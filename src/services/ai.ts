import axios from "axios";

// Public storefront assistant:
//   GET  /v1/ai/status        → { configured }
//   GET  /v1/ai/quota         → { tier, limit, used, remaining, resetsAt }
//   POST /v1/ai/chat          → { reply, thoughts?, quota }      (JSON)
//   POST /v1/ai/chat/stream   → thought · delta · done · error   (SSE over POST)
// The server owns the system prompt and keeps no conversation state, so the
// caller sends the recent history with every prompt.
// Daily question limits: guests 3 (per IP), logged-in customers 5 (per account),
// reset at midnight IST. Logged-in callers send their Bearer token; only answered
// questions count, and the latest server `quota` is always the source of truth.
const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.aquakart.co.in/v1";

export const AI_PROMPT_MAX = 2000;
export const AI_HISTORY_MAX = 10;
const AI_TIMEOUT_MS = 60_000;
// The server allows up to 90 s for a streamed answer.
const AI_STREAM_TIMEOUT_MS = 95_000;

export type AiRole = "user" | "assistant";
export type AiTurn = { role: AiRole; text: string };
export type AiThought = { title: string | null; text: string };
export type AiQuota = {
  tier: "guest" | "user";
  limit: number;
  used: number;
  // Infinity when unlimited.
  remaining: number;
  resetsAt: string;
  // Nothing is counted and nothing is ever blocked: the account is an admin
  // or tester (any environment), or the backend runs with TESTING_MODE=true.
  unlimited: boolean;
  // Why it's unlimited (null when limited).
  access: AiAccess | null;
};
export type AiAccess = "admin" | "tester" | "testing";
export type AiAnswer = {
  reply: string;
  thoughts: AiThought[];
  quota: AiQuota | null;
  // The saved conversation this answer was stored in (logged-in customers only).
  sessionId?: string | null;
};

export type AiErrorKind =
  | "invalid" // 400: prompt missing or too long
  | "rate_limited" // 429: too many requests, or the model is busy
  | "daily_limit" // 429 with code AI_DAILY_LIMIT: today's questions are used up
  | "unauthorized" // 401: the token was rejected
  | "blocked" // 422: safety filter
  | "unavailable" // 5xx or timeout
  | "network" // no response at all
  | "aborted"; // cancelled by the caller

export class AiError extends Error {
  kind: AiErrorKind;
  status?: number;
  // Answer text that had already streamed when the error arrived.
  partial?: string;
  // daily_limit only: whether logging in raises the limit, and the server's quota.
  loginRequired?: boolean;
  quota?: AiQuota | null;

  constructor(kind: AiErrorKind, message: string, status?: number) {
    super(message);
    this.name = "AiError";
    this.kind = kind;
    this.status = status;
  }

  // Worth offering a "Try again" button for.
  get retryable() {
    return this.kind === "unavailable" || this.kind === "network";
  }
}

const MESSAGES: Record<
  Exclude<
    AiErrorKind,
    "invalid" | "blocked" | "aborted" | "daily_limit" | "unauthorized"
  >,
  string
> = {
  rate_limited: "You're sending messages too fast, please wait a moment.",
  unavailable: "Assistant is unavailable right now.",
  network: "Couldn't reach AquaKart. Check your connection and try again.",
};

const serverMessage = (data: unknown) =>
  data &&
  typeof data === "object" &&
  typeof (data as { message?: unknown }).message === "string"
    ? (data as { message: string }).message
    : "";

export function normalizeQuota(value: unknown): AiQuota | null {
  if (!value || typeof value !== "object") return null;
  const q = value as Record<string, unknown>;
  const tier = q.tier === "user" ? "user" : "guest";
  const resetsAt = typeof q.resetsAt === "string" ? q.resetsAt : "";
  // Unlimited sends { limit: null, remaining: null, unlimited: true, access }.
  if (q.unlimited === true)
    return {
      tier,
      limit: 0,
      used: 0,
      remaining: Infinity,
      resetsAt,
      unlimited: true,
      // Older backends only knew TESTING_MODE.
      access:
        q.access === "admin" || q.access === "tester" ? q.access : "testing",
    };
  // null/"" mean "missing", not 0 (Number(null) is 0, which would read as "used up").
  const num = (v: unknown) =>
    v === null || v === undefined || v === "" ? NaN : Number(v);
  const limit = num(q.limit);
  const used = num(q.used);
  const remaining = num(q.remaining);
  if (![limit, used, remaining].every(Number.isFinite)) return null;
  return {
    tier,
    limit,
    used,
    remaining: Math.max(0, remaining),
    resetsAt,
    unlimited: false,
    access: null,
  };
}

// HTTP status (+ response body) → UI-facing error. Shared by axios and fetch paths.
// Only a 429 carrying code AI_DAILY_LIMIT is the daily limit; other 429s mean "busy".
export function aiErrorFromStatus(
  status: number | undefined,
  message = "",
  data?: unknown,
): AiError {
  const body = (data && typeof data === "object" ? data : {}) as Record<
    string,
    unknown
  >;
  if (status === 429 && body.code === "AI_DAILY_LIMIT") {
    const quota = normalizeQuota(body.quota);
    const err = new AiError(
      "daily_limit",
      message || "You've used today's questions.",
      status,
    );
    err.loginRequired = body.loginRequired === true;
    err.quota = quota ? { ...quota, remaining: 0 } : null;
    return err;
  }
  if (status === 401)
    return new AiError(
      "unauthorized",
      "Your session has expired. Please sign in again.",
      status,
    );
  if (status === 400)
    return new AiError("invalid", message || "Please enter a message.", status);
  if (status === 429)
    return new AiError("rate_limited", MESSAGES.rate_limited, status);
  if (status === 422)
    return new AiError(
      "blocked",
      message || "I can't help with that request.",
      status,
    );
  if (status !== undefined && status >= 500)
    return new AiError("unavailable", MESSAGES.unavailable, status);
  return new AiError("unavailable", message || MESSAGES.unavailable, status);
}

export function toAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  if (axios.isCancel(error)) return new AiError("aborted", "Request cancelled");
  if (!axios.isAxiosError(error))
    return new AiError("unavailable", MESSAGES.unavailable);
  if (!error.response) {
    const timedOut =
      error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
    return timedOut
      ? new AiError("unavailable", MESSAGES.unavailable)
      : new AiError("network", MESSAGES.network);
  }
  return aiErrorFromStatus(
    error.response.status,
    serverMessage(error.response.data),
    error.response.data,
  );
}

// Guests send no Authorization header at all.
const authHeaders = (token?: string | null): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};

// The server rejected a token the app thinks is valid (expired, or issued by
// another environment's backend). The session is dead on that backend, so the
// UI should end it and ask the customer to log in again; otherwise it would
// show them as logged in while the server counts them as a guest.
type TokenRejectedListener = (token: string) => void;
const tokenRejectedListeners = new Set<TokenRejectedListener>();
export const onTokenRejected = (fn: TokenRejectedListener) => {
  tokenRejectedListeners.add(fn);
  return () => void tokenRejectedListeners.delete(fn);
};
const tokenRejected = (token: string) =>
  tokenRejectedListeners.forEach((fn) => fn(token));

// A rejected token (401) is reported, dropped, and the request retried once as a guest.
async function asGuestOn401<T>(
  token: string | null | undefined,
  run: (token: string | null) => Promise<T>,
): Promise<T> {
  try {
    return await run(token || null);
  } catch (e) {
    if (token && e instanceof AiError && e.kind === "unauthorized") {
      tokenRejected(token);
      return run(null);
    }
    throw e;
  }
}

// Same limits the server applies: last 10 turns, each cut to 2000 characters.
// Only { role, text } ever goes back to the server, never thoughts.
export const trimHistory = (history: AiTurn[]): AiTurn[] =>
  history
    .slice(-AI_HISTORY_MAX)
    .map((t) => ({ role: t.role, text: t.text.slice(0, AI_PROMPT_MAX) }));

// Client-side check that mirrors the server's 400. Returns an error message or null.
export function validatePrompt(prompt: string): string | null {
  const text = prompt.trim();
  if (!text) return "Type a question first.";
  if (text.length > AI_PROMPT_MAX)
    return `Please keep it under ${AI_PROMPT_MAX.toLocaleString("en-IN")} characters.`;
  return null;
}

const normalizeThoughts = (value: unknown): AiThought[] =>
  Array.isArray(value)
    ? value
        .filter((t) => t && typeof t === "object")
        .map((t) => ({
          title:
            typeof t.title === "string" && t.title.trim()
              ? t.title.trim()
              : null,
          text: typeof t.text === "string" ? t.text : "",
        }))
        .filter((t) => t.title || t.text)
    : [];

// `token`: the logged-in customer's token, or null/undefined for a guest.
// `sessionId`: the customer's saved conversation to continue (logged in only;
// the server then uses its stored transcript instead of `history`).
type ChatOptions = {
  signal?: AbortSignal;
  thinking?: boolean;
  token?: string | null;
  sessionId?: string | null;
};

// Saved sessions belong to accounts: never sent as a guest.
const sessionBody = (auth: string | null, sessionId?: string | null) =>
  auth && sessionId ? { sessionId } : {};
// Only answers saved to an account carry a session id.
const readSessionId = (v: unknown) =>
  typeof v === "string" && v ? { sessionId: v } : {};

// Non-streaming request. Returns the reply, the steps when thinking is on, and the quota.
export async function requestAiChat(
  prompt: string,
  history: AiTurn[] = [],
  { signal, thinking = false, token, sessionId }: ChatOptions = {},
): Promise<AiAnswer> {
  const invalid = validatePrompt(prompt);
  if (invalid) throw new AiError("invalid", invalid);
  return asGuestOn401(token, async (auth) => {
    try {
      const res = await axios.post(
        `${BASE}/ai/chat`,
        {
          prompt: prompt.trim(),
          history: trimHistory(history),
          ...(thinking ? { thinking: true } : {}),
          ...sessionBody(auth, sessionId),
        },
        { timeout: AI_TIMEOUT_MS, signal, headers: authHeaders(auth) },
      );
      const reply = res.data?.data?.reply;
      if (res.data?.success === false || typeof reply !== "string") {
        throw new AiError("unavailable", MESSAGES.unavailable, res.status);
      }
      return {
        reply,
        thoughts: normalizeThoughts(res.data?.data?.thoughts),
        quota: normalizeQuota(res.data?.data?.quota),
        ...readSessionId(res.data?.data?.sessionId),
      };
    } catch (error) {
      throw toAiError(error);
    }
  });
}

export async function sendAiChat(
  prompt: string,
  history: AiTurn[] = [],
  { signal, token }: { signal?: AbortSignal; token?: string | null } = {},
) {
  return (await requestAiChat(prompt, history, { signal, token })).reply;
}

// Today's questions. Doesn't use one. null when it can't be read (no counter shown).
export async function getAiQuota(
  token?: string | null,
  { signal }: { signal?: AbortSignal } = {},
): Promise<AiQuota | null> {
  try {
    return await asGuestOn401(token, async (auth) => {
      try {
        const res = await axios.get(`${BASE}/ai/quota`, {
          timeout: 10_000,
          signal,
          headers: authHeaders(auth),
        });
        return normalizeQuota(res.data?.data);
      } catch (error) {
        throw toAiError(error);
      }
    });
  } catch {
    return null;
  }
}

// ---------- saved conversations (logged-in customers) ----------

export type AiChatSummary = {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: string;
  pinned: boolean;
};
export type AiSavedChat = { id: string; title: string; messages: AiTurn[] };

// Account-only calls: a rejected token is reported, then treated as "nothing saved".
async function asCustomer<T>(
  token: string | null | undefined,
  run: (headers: Record<string, string>) => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!token) return fallback;
  try {
    return await run(authHeaders(token));
  } catch (error) {
    if (toAiError(error).kind === "unauthorized") tokenRejected(token);
    return fallback;
  }
}

const toSummary = (s: Record<string, unknown>): AiChatSummary => ({
  id: String(s._id),
  title: typeof s.title === "string" ? s.title : "Chat",
  messageCount: Number(s.messageCount) || 0,
  lastMessageAt: typeof s.lastMessageAt === "string" ? s.lastMessageAt : "",
  pinned: s.pinned === true,
});

// Pinned first, then most recent.
export const listAiChats = (
  token: string | null | undefined,
  { limit = 20 }: { limit?: number } = {},
) =>
  asCustomer<AiChatSummary[]>(
    token,
    async (headers) => {
      const res = await axios.get(`${BASE}/ai/chat/history`, {
        params: { limit },
        headers,
        timeout: 15_000,
      });
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      return list
        .filter((s: Record<string, unknown>) => s && s._id)
        .map(toSummary);
    },
    [],
  );

export const CHAT_TITLE_MAX = 80;

// Renames and/or pins a saved chat. Returns the updated summary, or null if it
// couldn't be saved (the caller rolls its optimistic change back).
export const updateAiChat = (
  id: string,
  patch: { title?: string; pinned?: boolean },
  token: string | null | undefined,
) =>
  asCustomer<AiChatSummary | null>(
    token,
    async (headers) => {
      const res = await axios.patch(
        `${BASE}/ai/chat/history/${encodeURIComponent(id)}`,
        patch,
        { headers, timeout: 15_000 },
      );
      const s = res.data?.data;
      return s?._id ? toSummary(s) : null;
    },
    null,
  );

// One saved chat, as { role: user | assistant, text } turns. null if it can't be read.
export const getAiChat = (id: string, token: string | null | undefined) =>
  asCustomer<AiSavedChat | null>(
    token,
    async (headers) => {
      const res = await axios.get(
        `${BASE}/ai/chat/history/${encodeURIComponent(id)}`,
        { headers, timeout: 15_000 },
      );
      const s = res.data?.data;
      if (!s?._id) return null;
      const messages: AiTurn[] = (Array.isArray(s.messages) ? s.messages : [])
        .filter(
          (m: Record<string, unknown>) =>
            m && typeof m.text === "string" && m.text,
        )
        .map((m: Record<string, unknown>) => ({
          role: m.role === "user" ? "user" : "assistant",
          text: String(m.text),
        }));
      return {
        id: String(s._id),
        title: typeof s.title === "string" ? s.title : "Chat",
        messages,
      };
    },
    null,
  );

// Deletes one saved chat. One that's already gone (404) counts as deleted.
export const deleteAiChat = async (
  id: string,
  token: string | null | undefined,
) => {
  if (!token) return false;
  try {
    await axios.delete(`${BASE}/ai/chat/history/${encodeURIComponent(id)}`, {
      headers: authHeaders(token),
      timeout: 15_000,
    });
    return true;
  } catch (error) {
    if (toAiError(error).kind === "unauthorized") tokenRejected(token);
    return axios.isAxiosError(error) && error.response?.status === 404;
  }
};

// After a guest logs in mid-chat: count today's guest questions (from this
// browser) toward the account's allowance. Returns the account quota.
export const carryGuestQuota = (token: string | null | undefined) =>
  asCustomer<AiQuota | null>(
    token,
    async (headers) => {
      const res = await axios.post(
        `${BASE}/ai/quota/carry-guest`,
        {},
        { headers, timeout: 10_000 },
      );
      return normalizeQuota(res.data?.data);
    },
    null,
  );

// "2 of 3 free questions left today" (guest) / "4 of 5 questions left today".
// Unlimited: says whose account (admin / tester) or that it's testing mode.
const UNLIMITED_LABEL: Record<AiAccess, string> = {
  admin: "Admin · unlimited chats",
  tester: "Tester · unlimited chats",
  testing: "Testing mode · no question limit",
};

export const quotaLabel = (q: AiQuota) =>
  q.unlimited
    ? UNLIMITED_LABEL[q.access || "testing"]
    : `${q.remaining} of ${q.limit} ${q.tier === "guest" ? "free " : ""}question${q.limit === 1 ? "" : "s"} left today`;

// The blocked state a quota implies: null while questions are left. Guests can
// log in for more; customers wait for the midnight reset.
export type AiLimit = { message: string; loginRequired: boolean };
export const limitFromQuota = (q: AiQuota): AiLimit | null =>
  q.unlimited || q.remaining > 0
    ? null
    : q.tier === "guest"
      ? {
          message: `You've used your ${q.limit} free questions for today.`,
          loginRequired: true,
        }
      : {
          message: `You've used all ${q.limit} of today's questions.`,
          loginRequired: false,
        };

// resetsAt as an IST time, e.g. "12:00 am IST, Fri 24 Oct". "" if it can't be read.
export function formatResetIST(resetsAt: string): string {
  const d = new Date(resetsAt);
  if (!resetsAt || Number.isNaN(d.getTime())) return "";
  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  const part = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...o }).format(
      d,
    );
  return `${time.toLowerCase()} IST, ${part({ weekday: "short" })} ${part({ day: "numeric" })} ${part({ month: "short" })}`;
}

// ---------- server-sent events over POST ----------

export type SSEEvent = { event: string; data: unknown };

// Parses one "event: x\ndata: {...}" block. Multi-line data is joined with \n.
export function parseSSEBlock(block: string): SSEEvent | null {
  let event = "message";
  const data: string[] = [];
  for (const line of block.split("\n")) {
    if (!line || line.startsWith(":")) continue; // blank or comment / keep-alive
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    const value = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
  }
  if (!data.length) return null;
  const raw = data.join("\n");
  try {
    return { event, data: JSON.parse(raw) };
  } catch {
    return { event, data: raw };
  }
}

type StreamOptions = {
  onEvent: (event: SSEEvent) => void;
  signal?: AbortSignal;
  timeoutMs?: number;
  headers?: Record<string, string>;
};

// POSTs `body` as JSON and reads a text/event-stream response with fetch +
// getReader() (EventSource can't POST). Errors that happen before streaming
// starts come back as JSON and are thrown as AiError with their HTTP status;
// a failed connection throws AiError("network").
export async function streamSSE(
  url: string,
  body: unknown,
  { onEvent, signal, timeoutMs = AI_STREAM_TIMEOUT_MS, headers }: StreamOptions,
) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const fail = (e: unknown): never => {
    if (e instanceof AiError) throw e;
    if (timedOut) throw new AiError("unavailable", MESSAGES.unavailable);
    if (controller.signal.aborted)
      throw new AiError("aborted", "Request cancelled");
    throw new AiError("network", MESSAGES.network);
  };

  try {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      return fail(e);
    }

    const type = res.headers.get("content-type") || "";
    if (!res.ok || !type.includes("text/event-stream")) {
      const data = await res.json().catch(() => ({}));
      throw aiErrorFromStatus(
        res.ok ? 502 : res.status,
        serverMessage(data),
        data,
      );
    }
    if (!res.body)
      throw new AiError("unavailable", MESSAGES.unavailable, res.status);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const drain = (final: boolean) => {
      buffer = buffer.replace(/\r\n?/g, "\n");
      let cut: number;
      while ((cut = buffer.indexOf("\n\n")) !== -1) {
        const parsed = parseSSEBlock(buffer.slice(0, cut));
        buffer = buffer.slice(cut + 2);
        if (parsed) onEvent(parsed);
      }
      if (final && buffer.trim()) {
        const parsed = parseSSEBlock(buffer);
        buffer = "";
        if (parsed) onEvent(parsed);
      }
    };
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        drain(false);
      }
      buffer += decoder.decode();
      drain(true);
    } catch (e) {
      return fail(e);
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

type StreamChatOptions = ChatOptions & {
  // Upsert by index: the same step can arrive again with longer text.
  onThought?: (index: number, thought: AiThought) => void;
  onDelta?: (text: string) => void;
};

export type StreamedAnswer = AiAnswer & { streamed: boolean };

// A backend that only has POST /ai/chat answers the stream route with 404/405/501.
// Once seen, the rest of the session goes straight to /ai/chat.
const STREAM_MISSING = new Set([404, 405, 501]);
let streamUnsupported = false;
export const resetStreamSupport = () => {
  streamUnsupported = false;
};

// Answers via POST /ai/chat/stream when the backend has it, otherwise via
// POST /ai/chat (`streamed: false`: the whole answer, and any thoughts, at once).
// Also falls back to /ai/chat when the stream can't connect (network).
export async function streamAiChat(
  prompt: string,
  history: AiTurn[] = [],
  {
    signal,
    thinking = true,
    token,
    sessionId,
    onThought,
    onDelta,
  }: StreamChatOptions = {},
): Promise<StreamedAnswer> {
  const invalid = validatePrompt(prompt);
  if (invalid) throw new AiError("invalid", invalid);
  // A token rejected on the stream route is already dropped by the time this runs.
  let auth = token || null;
  const plain = async () => ({
    ...(await requestAiChat(prompt, history, {
      signal,
      thinking,
      token: auth,
      sessionId,
    })),
    streamed: false,
  });
  if (streamUnsupported) return plain();

  const thoughts: AiThought[] = [];
  let text = "";
  let done: AiAnswer | null = null;
  let streamError: AiError | null = null;
  let started = false;

  const open = () =>
    streamSSE(
      `${BASE}/ai/chat/stream`,
      {
        prompt: prompt.trim(),
        history: trimHistory(history),
        thinking,
        ...sessionBody(auth, sessionId),
      },
      {
        signal,
        headers: authHeaders(auth),
        onEvent: ({ event, data }) => {
          started = true;
          const d = (data || {}) as Record<string, unknown>;
          if (event === "thought") {
            const index = Number(d.index) || 0;
            const thought = normalizeThoughts([d])[0];
            if (!thought) return;
            thoughts[index] = thought;
            onThought?.(index, thought);
          } else if (event === "delta" && typeof d.text === "string") {
            text += d.text;
            onDelta?.(d.text);
          } else if (event === "done") {
            const reply = typeof d.reply === "string" ? d.reply : text;
            const final = normalizeThoughts(d.thoughts);
            done = {
              reply,
              thoughts: final.length ? final : thoughts.filter(Boolean),
              quota: normalizeQuota(d.quota),
              ...readSessionId(d.sessionId),
            };
          } else if (event === "error") {
            streamError = aiErrorFromStatus(
              Number(d.status) || 502,
              typeof d.message === "string" ? d.message : "",
              d,
            );
          }
        },
      },
    );

  try {
    try {
      await open();
    } catch (e) {
      // 401 arrives before any event: report it, drop the token and ask again as a guest.
      if (!(
        auth &&
        !started &&
        e instanceof AiError &&
        e.kind === "unauthorized"
      ))
        throw e;
      tokenRejected(auth);
      auth = null;
      await open();
    }
  } catch (e) {
    const err =
      e instanceof AiError ? e : new AiError("network", MESSAGES.network);
    if (
      !started &&
      err.status !== undefined &&
      STREAM_MISSING.has(err.status)
    ) {
      streamUnsupported = true;
      return plain();
    }
    // Couldn't open the stream at all: try the plain endpoint once.
    if (err.kind === "network" && !started) return plain();
    err.partial = text;
    throw err;
  }

  const failed = streamError as AiError | null;
  if (failed) {
    failed.partial = text;
    throw failed;
  }
  const answer = done as AiAnswer | null;
  if (!answer) {
    const ended = new AiError("unavailable", MESSAGES.unavailable);
    ended.partial = text;
    throw ended;
  }
  return { ...answer, streamed: true };
}

// ---------- thinking steps ----------

// Splits one thought's text into nested sub-steps: list items if the model
// wrote a list, otherwise paragraphs, otherwise sentences.
export function thoughtSubsteps(text: string): string[] {
  const clean = String(text || "")
    .replace(/\r\n?/g, "\n")
    .trim();
  if (!clean) return [];
  const lines = clean
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const LIST = /^([-*•]|\d+[.)])\s+/;
  if (lines.filter((l) => LIST.test(l)).length >= 2)
    return lines.map((l) => l.replace(LIST, ""));
  const paragraphs = clean
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  if (paragraphs.length >= 2) return paragraphs;
  const sentences = paragraphs[0]
    .split(/(?<=[.!?])\s+(?=["'(\[]?[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.length ? sentences : [paragraphs[0]];
}

// "Show thinking" preference, shared by the widget and /aqua. Defaults to on.
const THINKING_KEY = "aquakart.assistant.thinking";
export function readThinkingPref(): boolean {
  try {
    return window.localStorage.getItem(THINKING_KEY) !== "off";
  } catch {
    return true;
  }
}
export function writeThinkingPref(on: boolean) {
  try {
    window.localStorage.setItem(THINKING_KEY, on ? "on" : "off");
  } catch {
    // ignore
  }
}

// Called once per page load at most: the answer is cached for the session.
let statusRequest: Promise<boolean> | null = null;

export function getAiStatus(): Promise<boolean> {
  if (!statusRequest) {
    statusRequest = axios
      .get(`${BASE}/ai/status`, { timeout: 10_000 })
      .then(
        (res) =>
          res.data?.success === true && res.data?.data?.configured === true,
      )
      .catch(() => {
        statusRequest = null; // let a later mount retry a failed check
        return false;
      });
  }
  return statusRequest;
}

const aiServiceOperations = {
  sendAiChat,
  requestAiChat,
  streamAiChat,
  streamSSE,
  getAiStatus,
  validatePrompt,
  trimHistory,
  thoughtSubsteps,
};
export default aiServiceOperations;
