import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  const post = vi.fn();
  const get = vi.fn();
  return {
    ...actual,
    default: {
      ...actual.default,
      post,
      get,
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
    ax.get
      .mockRejectedValueOnce(new Error("404"))
      .mockResolvedValueOnce({
        data: { success: true, data: { configured: true } },
      });
    const { getAiStatus } = await import("./ai");
    await expect(getAiStatus()).resolves.toBe(false);
    await expect(getAiStatus()).resolves.toBe(true);
    await expect(getAiStatus()).resolves.toBe(true);
    expect(ax.get).toHaveBeenCalledTimes(2);
  });
});
