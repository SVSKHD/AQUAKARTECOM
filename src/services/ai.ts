import axios from "axios";

// Public storefront assistant (POST /v1/ai/chat, GET /v1/ai/status).
// The server owns the system prompt and keeps no conversation state, so the
// caller sends the recent history with every prompt.
const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.aquakart.co.in/v1";

export const AI_PROMPT_MAX = 2000;
export const AI_HISTORY_MAX = 10;
const AI_TIMEOUT_MS = 60_000;

export type AiRole = "user" | "assistant";
export type AiTurn = { role: AiRole; text: string };

export type AiErrorKind =
  | "invalid" // 400: prompt missing or too long
  | "rate_limited" // 429: too many requests, or the model is busy
  | "blocked" // 422: safety filter
  | "unavailable" // 5xx or timeout
  | "network" // no response at all
  | "aborted"; // cancelled by the caller

export class AiError extends Error {
  kind: AiErrorKind;
  status?: number;

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
  Exclude<AiErrorKind, "invalid" | "blocked" | "aborted">,
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

export function toAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  if (axios.isCancel(error)) return new AiError("aborted", "Request cancelled");
  if (!axios.isAxiosError(error))
    return new AiError("unavailable", MESSAGES.unavailable);

  const status = error.response?.status;
  const message = serverMessage(error.response?.data);
  if (!error.response) {
    const timedOut =
      error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
    return timedOut
      ? new AiError("unavailable", MESSAGES.unavailable)
      : new AiError("network", MESSAGES.network);
  }
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

// Same limits the server applies: last 10 turns, each cut to 2000 characters.
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

export async function sendAiChat(
  prompt: string,
  history: AiTurn[] = [],
  { signal }: { signal?: AbortSignal } = {},
) {
  const invalid = validatePrompt(prompt);
  if (invalid) throw new AiError("invalid", invalid);
  try {
    const res = await axios.post(
      `${BASE}/ai/chat`,
      { prompt: prompt.trim(), history: trimHistory(history) },
      { timeout: AI_TIMEOUT_MS, signal },
    );
    const reply = res.data?.data?.reply;
    if (res.data?.success === false || typeof reply !== "string") {
      throw new AiError("unavailable", MESSAGES.unavailable, res.status);
    }
    return reply;
  } catch (error) {
    throw toAiError(error);
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
  getAiStatus,
  validatePrompt,
  trimHistory,
};
export default aiServiceOperations;
