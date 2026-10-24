import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  const post = vi.fn();
  const get = vi.fn();
  const del = vi.fn();
  return {
    ...actual,
    default: {
      ...actual.default,
      post,
      get,
      delete: del,
      isAxiosError: actual.isAxiosError,
      isCancel: actual.isCancel,
    },
  };
});

const {
  AiError,
  AI_PROMPT_MAX,
  sendAiChat,
  trimHistory,
  toAiError,
  validatePrompt,
} = await import("./ai");
const post = axios.post as unknown as ReturnType<typeof vi.fn>;

const httpError = (status: number, data: unknown = {}) =>
  Object.assign(new Error(`HTTP ${status}`), {
    isAxiosError: true,
    response: { status, data },
    config: {},
    toJSON: () => ({}),
  });

describe("services/ai", () => {
  beforeEach(() => post.mockReset());

  it("posts the trimmed prompt with the last 10 turns, each cut to 2000 chars", async () => {
    post.mockResolvedValueOnce({
      status: 200,
      data: { success: true, data: { reply: "Use a softener." } },
    });
    const history = Array.from({ length: 14 }, (_, i) => ({
      role: (i % 2 ? "assistant" : "user") as "user" | "assistant",
      text: `t${i}` + "x".repeat(i === 13 ? 2500 : 0),
    }));
    await expect(sendAiChat("  400 ppm?  ", history)).resolves.toBe(
      "Use a softener.",
    );
    const [url, body, config] = post.mock.calls[0];
    expect(url).toMatch(/\/ai\/chat$/);
    expect(body.prompt).toBe("400 ppm?");
    expect(body.history).toHaveLength(10);
    expect(body.history[0].text).toBe("t4");
    expect(body.history[9].text).toHaveLength(AI_PROMPT_MAX);
    expect(config.timeout).toBe(60000);
  });

  it("validates on the client before calling the server", async () => {
    expect(validatePrompt("   ")).toMatch(/Type a question/);
    expect(validatePrompt("x".repeat(AI_PROMPT_MAX + 1))).toMatch(/under/);
    expect(validatePrompt("x".repeat(AI_PROMPT_MAX))).toBeNull();
    await expect(sendAiChat("")).rejects.toMatchObject({ kind: "invalid" });
    expect(post).not.toHaveBeenCalled();
  });

  it("maps HTTP errors to UI-facing kinds", () => {
    expect(
      toAiError(
        httpError(400, { success: false, message: "prompt is required" }),
      ),
    ).toMatchObject({ kind: "invalid", message: "prompt is required" });
    expect(
      toAiError(httpError(429, { message: "Too many AI requests." })),
    ).toMatchObject({
      kind: "rate_limited",
      message: "You're sending messages too fast, please wait a moment.",
    });
    expect(
      toAiError(httpError(422, { message: "That request was blocked." })),
    ).toMatchObject({ kind: "blocked", message: "That request was blocked." });
    for (const status of [500, 502, 503, 504]) {
      const e = toAiError(httpError(status));
      expect(e).toMatchObject({
        kind: "unavailable",
        message: "Assistant is unavailable right now.",
      });
      expect(e.retryable).toBe(true);
    }
    expect(toAiError(httpError(429)).retryable).toBe(false);
  });

  it("treats a timeout as unavailable and no response as a network error", () => {
    const timeout = Object.assign(new Error("timeout"), {
      isAxiosError: true,
      code: "ECONNABORTED",
      config: {},
      toJSON: () => ({}),
    });
    const offline = Object.assign(new Error("Network Error"), {
      isAxiosError: true,
      code: "ERR_NETWORK",
      config: {},
      toJSON: () => ({}),
    });
    expect(toAiError(timeout).kind).toBe("unavailable");
    expect(toAiError(offline).kind).toBe("network");
  });

  it("rejects a 200 without a reply instead of showing an empty bubble", async () => {
    post.mockResolvedValueOnce({ status: 200, data: { success: false } });
    await expect(sendAiChat("hi")).rejects.toBeInstanceOf(AiError);
  });

  it("trimHistory keeps role and text only", () => {
    expect(
      trimHistory([{ role: "user", text: "a", extra: 1 } as never]),
    ).toEqual([{ role: "user", text: "a" }]);
  });
});

describe("getAiStatus", () => {
  it("is cached for the session and treats failures as not configured", async () => {
    vi.resetModules();
    const ax = (await import("axios")).default as unknown as {
      get: ReturnType<typeof vi.fn>;
    };
    ax.get.mockReset();
    ax.get.mockRejectedValueOnce(new Error("404")).mockResolvedValueOnce({
      data: { success: true, data: { configured: true } },
    });
    const { getAiStatus } = await import("./ai");
    await expect(getAiStatus()).resolves.toBe(false);
    await expect(getAiStatus()).resolves.toBe(true);
    await expect(getAiStatus()).resolves.toBe(true);
    expect(ax.get).toHaveBeenCalledTimes(2);
  });
});

// ---------- streaming ----------
const {
  streamAiChat,
  streamSSE,
  parseSSEBlock,
  thoughtSubsteps,
  resetStreamSupport,
} = await import("./ai");

const sse = (events: [string, unknown][]) =>
  events
    .map(([e, d]) => `event: ${e}\ndata: ${JSON.stringify(d)}\n\n`)
    .join("");

// A text/event-stream response whose body arrives in awkward chunks.
const streamResponse = (payload: string, chunkSize = 7) => {
  const bytes = new TextEncoder().encode(payload);
  const body = new ReadableStream({
    start(c) {
      for (let i = 0; i < bytes.length; i += chunkSize)
        c.enqueue(bytes.slice(i, i + chunkSize));
      c.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/event-stream; charset=utf-8" },
  });
};
const jsonResponse = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("streaming", () => {
  beforeEach(() => {
    post.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });
  const fetchMock = () =>
    globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

  it("parses SSE blocks, comments and multi-line data", () => {
    expect(parseSSEBlock('event: delta\ndata: {"text":"hi"}')).toEqual({
      event: "delta",
      data: { text: "hi" },
    });
    expect(parseSSEBlock(": keep-alive")).toBeNull();
    expect(parseSSEBlock("data: a\ndata: b")).toEqual({
      event: "message",
      data: "a\nb",
    });
  });

  it("streamSSE delivers every event even when chunks split them", async () => {
    fetchMock().mockResolvedValueOnce(
      streamResponse(
        sse([
          ["thought", { index: 0, title: "A", text: "x" }],
          ["delta", { text: "Hel" }],
          ["delta", { text: "lo" }],
        ]),
        3,
      ),
    );
    const events: unknown[] = [];
    await streamSSE(
      "http://x/stream",
      { a: 1 },
      { onEvent: (e) => events.push(e) },
    );
    expect(events).toEqual([
      { event: "thought", data: { index: 0, title: "A", text: "x" } },
      { event: "delta", data: { text: "Hel" } },
      { event: "delta", data: { text: "lo" } },
    ]);
    const [, init] = fetchMock().mock.calls[0];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ a: 1 });
  });

  it("streamAiChat upserts thoughts, types deltas and returns the authoritative reply", async () => {
    fetchMock().mockResolvedValueOnce(
      streamResponse(
        sse([
          ["thought", { index: 0, title: "Assessing", text: "400 ppm" }],
          [
            "thought",
            { index: 0, title: "Assessing", text: "400 ppm is very hard." },
          ],
          ["delta", { text: "Yes, " }],
          ["delta", { text: "a softener." }],
          [
            "done",
            {
              reply: "Yes, a softener is recommended.",
              thoughts: [{ title: "Assessing", text: "400 ppm is very hard." }],
            },
          ],
        ]),
      ),
    );
    const thoughts: unknown[] = [];
    let typed = "";
    const answer = await streamAiChat(
      "400 ppm?",
      [{ role: "user", text: "Hi" }],
      {
        onThought: (i, t) => thoughts.push([i, t.text]),
        onDelta: (d) => (typed += d),
      },
    );
    expect(thoughts).toEqual([
      [0, "400 ppm"],
      [0, "400 ppm is very hard."],
    ]);
    expect(typed).toBe("Yes, a softener.");
    expect(answer).toEqual({
      reply: "Yes, a softener is recommended.",
      thoughts: [{ title: "Assessing", text: "400 ppm is very hard." }],
      streamed: true,
      quota: null,
    });
    const body = JSON.parse(fetchMock().mock.calls[0][1].body);
    expect(fetchMock().mock.calls[0][0]).toMatch(/\/ai\/chat\/stream$/);
    expect(body).toEqual({
      prompt: "400 ppm?",
      history: [{ role: "user", text: "Hi" }],
      thinking: true,
    });
  });

  it("throws JSON errors that arrive before streaming starts with their HTTP status", async () => {
    fetchMock().mockResolvedValueOnce(
      jsonResponse(429, { success: false, message: "Too many AI requests." }),
    );
    await expect(streamAiChat("hi")).rejects.toMatchObject({
      kind: "rate_limited",
      status: 429,
    });
    fetchMock().mockResolvedValueOnce(
      jsonResponse(504, { success: false, message: "timeout" }),
    );
    await expect(streamAiChat("hi")).rejects.toMatchObject({
      kind: "unavailable",
      status: 504,
    });
    expect(post).not.toHaveBeenCalled();
  });

  it("an error event keeps the partial answer on the error", async () => {
    fetchMock().mockResolvedValueOnce(
      streamResponse(
        sse([
          ["delta", { text: "A 20 L" }],
          ["error", { status: 503, message: "busy" }],
        ]),
      ),
    );
    await expect(streamAiChat("hi")).rejects.toMatchObject({
      kind: "unavailable",
      partial: "A 20 L",
    });
  });

  it("falls back to POST /ai/chat with thinking when the stream can't connect", async () => {
    fetchMock().mockRejectedValueOnce(new TypeError("Failed to fetch"));
    post.mockResolvedValueOnce({
      status: 200,
      data: {
        success: true,
        data: {
          reply: "Plain answer",
          thoughts: [{ title: "Step", text: "t" }],
        },
      },
    });
    await expect(streamAiChat("hi", [], { thinking: true })).resolves.toEqual({
      reply: "Plain answer",
      thoughts: [{ title: "Step", text: "t" }],
      streamed: false,
      quota: null,
    });
    expect(post.mock.calls[0][1]).toMatchObject({
      prompt: "hi",
      thinking: true,
    });
  });

  it("does not fall back after an abort", async () => {
    const ctl = new AbortController();
    fetchMock().mockImplementationOnce(
      (_u: string, init: RequestInit) =>
        new Promise((_r, reject) =>
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          ),
        ),
    );
    const p = streamAiChat("hi", [], { signal: ctl.signal });
    ctl.abort();
    await expect(p).rejects.toMatchObject({ kind: "aborted" });
    expect(post).not.toHaveBeenCalled();
  });

  it("splits a thought into nested sub-steps", () => {
    expect(thoughtSubsteps("- one\n- two\n- three")).toEqual([
      "one",
      "two",
      "three",
    ]);
    expect(thoughtSubsteps("First paragraph here.\n\nSecond one.")).toEqual([
      "First paragraph here.",
      "Second one.",
    ]);
    expect(
      thoughtSubsteps(
        "400 ppm is very hard. A softener helps. I should ask about size.",
      ),
    ).toEqual([
      "400 ppm is very hard.",
      "A softener helps.",
      "I should ask about size.",
    ]);
    expect(thoughtSubsteps("Just one thought")).toEqual(["Just one thought"]);
    expect(thoughtSubsteps("")).toEqual([]);
  });
});

describe("backends that only have POST /ai/chat", () => {
  beforeEach(() => {
    post.mockReset();
    vi.stubGlobal("fetch", vi.fn());
    resetStreamSupport();
  });
  const fetchMock = () =>
    globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
  const html404 = () =>
    new Response("<pre>Cannot POST /v1/ai/chat/stream</pre>", {
      status: 404,
      headers: { "content-type": "text/html" },
    });

  it("uses POST /ai/chat when the stream route is missing, and keeps using it", async () => {
    fetchMock().mockResolvedValueOnce(html404());
    post
      .mockResolvedValueOnce({
        status: 200,
        data: { success: true, data: { reply: "A softener helps." } },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: { success: true, data: { reply: "Every 6–12 months." } },
      });
    const history = [
      { role: "user" as const, text: "Hi" },
      { role: "assistant" as const, text: "Hello!" },
    ];
    await expect(streamAiChat("400 ppm?", history)).resolves.toEqual({
      reply: "A softener helps.",
      thoughts: [],
      streamed: false,
      quota: null,
    });
    const [url, body, config] = post.mock.calls[0];
    expect(url).toMatch(/\/ai\/chat$/);
    expect(body).toMatchObject({ prompt: "400 ppm?", history });
    expect(config.timeout).toBe(60000);

    await expect(streamAiChat("Filters?")).resolves.toMatchObject({
      reply: "Every 6–12 months.",
      streamed: false,
    });
    expect(fetchMock()).toHaveBeenCalledTimes(1); // the stream route isn't tried again
  });

  it("treats 405 the same way", async () => {
    fetchMock().mockResolvedValueOnce(new Response("", { status: 405 }));
    post.mockResolvedValueOnce({
      status: 200,
      data: { success: true, data: { reply: "ok" } },
    });
    await expect(streamAiChat("hi")).resolves.toMatchObject({
      reply: "ok",
      streamed: false,
    });
  });

  it("does not fall back on real errors from the stream route", async () => {
    fetchMock().mockResolvedValueOnce(
      jsonResponse(503, { success: false, message: "AI unavailable" }),
    );
    await expect(streamAiChat("hi")).rejects.toMatchObject({
      kind: "unavailable",
      status: 503,
    });
    expect(post).not.toHaveBeenCalled();
  });

  it("maps /ai/chat errors from the table", async () => {
    fetchMock().mockResolvedValue(html404());
    const httpErr = (status: number, message: string) =>
      Object.assign(new Error(`HTTP ${status}`), {
        isAxiosError: true,
        response: { status, data: { success: false, message } },
        config: {},
        toJSON: () => ({}),
      });
    post.mockRejectedValueOnce(httpErr(429, "Too many AI requests."));
    await expect(streamAiChat("hi")).rejects.toMatchObject({
      kind: "rate_limited",
      message: "You're sending messages too fast, please wait a moment.",
    });
    post.mockRejectedValueOnce(httpErr(422, "Blocked by safety filter."));
    await expect(streamAiChat("hi")).rejects.toMatchObject({
      kind: "blocked",
      message: "Blocked by safety filter.",
    });
    post.mockRejectedValueOnce(httpErr(504, "timeout"));
    await expect(streamAiChat("hi")).rejects.toMatchObject({
      kind: "unavailable",
      message: "Assistant is unavailable right now.",
    });
  });
});

const { getAiQuota, quotaLabel, formatResetIST } = await import("./ai");

describe("daily question limits", () => {
  const get = axios.get as unknown as ReturnType<typeof vi.fn>;
  beforeEach(() => {
    post.mockReset();
    get.mockReset();
    vi.stubGlobal("fetch", vi.fn());
    resetStreamSupport();
  });
  const fetchMock = () =>
    globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
  const quota = {
    tier: "guest",
    limit: 3,
    used: 1,
    remaining: 2,
    resetsAt: "2026-10-23T18:30:00.000Z",
  };

  it("sends the Bearer token only when logged in", async () => {
    fetchMock().mockImplementation(async () =>
      streamResponse(sse([["done", { reply: "ok" }]])),
    );
    await streamAiChat("hi", [], { token: "tok" });
    expect(fetchMock().mock.calls[0][1].headers.Authorization).toBe(
      "Bearer tok",
    );
    await streamAiChat("hi");
    expect(fetchMock().mock.calls[1][1].headers).not.toHaveProperty(
      "Authorization",
    );
  });

  it("returns the quota from the stream's done event", async () => {
    fetchMock().mockResolvedValueOnce(
      streamResponse(sse([["done", { reply: "ok", quota }]])),
    );
    await expect(streamAiChat("hi")).resolves.toMatchObject({ quota });
  });

  it("drops a rejected token and asks again as a guest", async () => {
    fetchMock()
      .mockResolvedValueOnce(
        jsonResponse(401, { success: false, message: "Token is not valid" }),
      )
      .mockResolvedValueOnce(
        streamResponse(sse([["done", { reply: "ok", quota }]])),
      );
    await expect(
      streamAiChat("hi", [], { token: "stale" }),
    ).resolves.toMatchObject({ reply: "ok" });
    expect(fetchMock().mock.calls[1][1].headers).not.toHaveProperty(
      "Authorization",
    );
  });

  it("reads AI_DAILY_LIMIT as the daily limit, other 429s as busy", async () => {
    fetchMock().mockResolvedValueOnce(
      jsonResponse(429, {
        success: false,
        code: "AI_DAILY_LIMIT",
        loginRequired: true,
        message: "You've used your 3 free questions for today.",
        quota: { ...quota, used: 3, remaining: 0 },
      }),
    );
    await expect(streamAiChat("hi")).rejects.toMatchObject({
      kind: "daily_limit",
      loginRequired: true,
      message: "You've used your 3 free questions for today.",
      quota: { remaining: 0, limit: 3 },
    });
    expect(post).not.toHaveBeenCalled();
    fetchMock().mockResolvedValueOnce(
      jsonResponse(429, { success: false, message: "AI busy" }),
    );
    await expect(streamAiChat("hi")).rejects.toMatchObject({
      kind: "rate_limited",
    });
  });

  it("reads the quota without using a question, and returns null on failure", async () => {
    get.mockResolvedValueOnce({
      status: 200,
      data: {
        success: true,
        data: { ...quota, tier: "user", limit: 5, remaining: 4 },
      },
    });
    await expect(getAiQuota("tok")).resolves.toMatchObject({
      tier: "user",
      remaining: 4,
    });
    expect(get.mock.calls[0][0]).toMatch(/\/ai\/quota$/);
    expect(get.mock.calls[0][1].headers.Authorization).toBe("Bearer tok");
    get.mockRejectedValueOnce(new Error("down"));
    await expect(getAiQuota()).resolves.toBeNull();
  });

  it("labels the counter and formats the reset time in IST", () => {
    expect(quotaLabel({ ...quota, tier: "guest" } as never)).toBe(
      "2 of 3 free questions left today",
    );
    expect(
      quotaLabel({ ...quota, tier: "user", limit: 5, remaining: 4 } as never),
    ).toBe("4 of 5 questions left today");
    expect(formatResetIST("2026-10-23T18:30:00.000Z")).toBe(
      "12:00 am IST, Sat 24 Oct",
    );
    expect(formatResetIST("nonsense")).toBe("");
  });
});

const {
  normalizeQuota,
  limitFromQuota: limitOf,
  quotaLabel: label,
} = await import("./ai");

describe("backend TESTING_MODE (no question limits)", () => {
  // Exactly what services/aiQuota.js unlimitedQuota() returns.
  const testing = {
    tier: "guest",
    limit: null,
    used: 0,
    remaining: null,
    unlimited: true,
    testingMode: true,
    resetsAt: "2026-10-23T18:30:00.000Z",
  };

  it("never reads null limits as zero questions left", () => {
    const q = normalizeQuota(testing)!;
    expect(q).toMatchObject({ unlimited: true, remaining: Infinity });
    expect(limitOf(q)).toBeNull();
    expect(label(q)).toBe("Testing mode · no question limit");
  });

  it("treats a quota with null numbers and no unlimited flag as unknown, not used up", () => {
    expect(normalizeQuota({ ...testing, unlimited: undefined })).toBeNull();
  });

  it("still reads a normal production quota", () => {
    const q = normalizeQuota({
      tier: "user",
      limit: 5,
      used: 5,
      remaining: 0,
      resetsAt: testing.resetsAt,
    })!;
    expect(q.unlimited).toBe(false);
    expect(limitOf(q)).toMatchObject({ loginRequired: false });
  });
});

const { deleteAiChat } = await import("./ai");

describe("deleteAiChat", () => {
  const del = axios.delete as unknown as ReturnType<typeof vi.fn>;
  beforeEach(() => del.mockReset());

  it("deletes the saved chat with the customer's token", async () => {
    del.mockResolvedValueOnce({ status: 200, data: { success: true } });
    await expect(deleteAiChat("abc", "tok")).resolves.toBe(true);
    expect(del.mock.calls[0][0]).toMatch(/\/ai\/chat\/history\/abc$/);
    expect(del.mock.calls[0][1].headers.Authorization).toBe("Bearer tok");
  });

  it("counts an already-deleted chat as deleted, other failures as not", async () => {
    del.mockRejectedValueOnce(httpError(404));
    await expect(deleteAiChat("abc", "tok")).resolves.toBe(true);
    del.mockRejectedValueOnce(httpError(500));
    await expect(deleteAiChat("abc", "tok")).resolves.toBe(false);
  });

  it("does nothing without a token", async () => {
    await expect(deleteAiChat("abc", null)).resolves.toBe(false);
    expect(del).not.toHaveBeenCalled();
  });
});
