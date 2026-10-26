import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/ai")>();
  // Reply-only tests use `sendAiChat` as a plain mock; the stream wraps it.
  const sendAiChat = vi.fn();
  const streamAiChat = vi.fn(
    async (prompt: string, history: unknown, opts: unknown) => ({
      reply: await sendAiChat(prompt, history, opts),
      thoughts: [],
      quota: null,
      streamed: true,
    }),
  );
  const getAiQuota = vi.fn(async () => null);
  return {
    ...actual,
    getAiStatus: vi.fn(),
    getAiQuota,
    sendAiChat,
    streamAiChat,
    listAiChats: vi.fn(async () => []),
    getAiChat: vi.fn(async () => null),
    carryGuestQuota: vi.fn(async () => null),
  };
});

const ai = await import("@/services/ai");
const { useAquaChat } = await import("./useAquaChat");
const { DEMO_PRODUCTS } = await import("./catalogue");
type ChatMessage = import("./types").ChatMessage;

const getAiStatus = ai.getAiStatus as unknown as ReturnType<typeof vi.fn>;
const sendAiChat = ai.sendAiChat as unknown as ReturnType<typeof vi.fn>;
const streamAiChat = ai.streamAiChat as unknown as ReturnType<typeof vi.fn>;

const setup = () =>
  renderHook(() =>
    useAquaChat({
      products: DEMO_PRODUCTS,
      getCompare: () => [],
      clearCompare: () => {},
      reducedMotion: true,
    }),
  );

const lastAqua = (msgs: ChatMessage[]) =>
  [...msgs].reverse().find((m) => m.role === "aqua" && !m.typing);

beforeEach(() => window.sessionStorage.clear());

describe("useAquaChat with the backend AI", () => {
  beforeEach(() => {
    getAiStatus.mockReset().mockResolvedValue(true);
    sendAiChat.mockReset();
  });

  it("answers from POST /ai/chat and sends earlier turns as history", async () => {
    sendAiChat
      .mockResolvedValueOnce("Hello! How can I help?")
      .mockResolvedValueOnce("A 20 L softener suits a family of 4.");
    const { result } = setup();
    await waitFor(() => expect(result.current.aiMode).toBe("live"));

    act(() => void result.current.send("Hi"));
    await waitFor(() =>
      expect(lastAqua(result.current.messages)?.text).toBe(
        "Hello! How can I help?",
      ),
    );

    act(
      () =>
        void result.current.send(
          "Which softener for a family of 4 on borewell?",
        ),
    );
    await waitFor(() => expect(sendAiChat).toHaveBeenCalledTimes(2));
    expect(sendAiChat.mock.calls[1][0]).toBe(
      "Which softener for a family of 4 on borewell?",
    );
    expect(sendAiChat.mock.calls[1][1]).toEqual([
      { role: "user", text: "Hi" },
      { role: "assistant", text: "Hello! How can I help?" },
    ]);
    // Shopping question → catalogue cards attached locally, ranked for 4 people.
    await waitFor(() =>
      expect(
        lastAqua(result.current.messages)?.products?.length,
      ).toBeGreaterThan(0),
    );
    const picks = lastAqua(result.current.messages)!.products!.map((id) =>
      DEMO_PRODUCTS.find((p) => p.id === id)!,
    );
    expect(picks.every((p) => p.cat === "softener" && p.inStock)).toBe(true);
  });

  it("adds the open product as context to the user's message", async () => {
    sendAiChat.mockResolvedValueOnce("It needs a drain and a power socket.");
    const { result } = setup();
    act(() => void result.current.send("What does installation need?", "d2"));
    await waitFor(() => expect(sendAiChat).toHaveBeenCalled());
    expect(sendAiChat.mock.calls[0][0]).toBe(
      'I\'m looking at "Home Water Softener 20 L Auto" (20 L resin) on AquaKart. What does installation need?',
    );
    // No cards for a question about the open product.
    await waitFor(() =>
      expect(lastAqua(result.current.messages)?.text).toContain("drain"),
    );
    expect(lastAqua(result.current.messages)?.products).toBeUndefined();
  });

  it("keeps failed turns out of history and retries with the same words", async () => {
    sendAiChat
      .mockRejectedValueOnce(
        new ai.AiError(
          "unavailable",
          "Assistant is unavailable right now.",
          503,
        ),
      )
      .mockResolvedValueOnce("Every 6–12 months.")
      .mockResolvedValueOnce("Sure.");
    const { result } = setup();
    act(() => void result.current.send("How often should filters be changed?"));
    await waitFor(() =>
      expect(lastAqua(result.current.messages)?.error).toBe(true),
    );
    const failed = lastAqua(result.current.messages)!;
    expect(failed.retry).toEqual({
      text: "How often should filters be changed?",
      productId: null,
    });

    act(() => result.current.retry(failed.id));
    await waitFor(() =>
      expect(lastAqua(result.current.messages)?.text).toBe(
        "Every 6–12 months.",
      ),
    );
    expect(
      result.current.messages.filter((m) => m.role === "user"),
    ).toHaveLength(1);
    expect(sendAiChat.mock.calls[1][1]).toEqual([]);

    act(() => void result.current.send("Thanks"));
    await waitFor(() => expect(sendAiChat).toHaveBeenCalledTimes(3));
    expect(sendAiChat.mock.calls[2][1]).toEqual([
      { role: "user", text: "How often should filters be changed?" },
      { role: "assistant", text: "Every 6–12 months." },
    ]);
  });

  it("does not offer a retry when the safety filter blocks a prompt", async () => {
    sendAiChat.mockRejectedValueOnce(
      new ai.AiError("blocked", "I can't help with that request.", 422),
    );
    const { result } = setup();
    act(() => void result.current.send("something off-topic"));
    await waitFor(() =>
      expect(lastAqua(result.current.messages)?.text).toBe(
        "I can't help with that request.",
      ),
    );
    expect(lastAqua(result.current.messages)?.retry).toBeUndefined();
  });

  it("streams thinking steps, then the answer, and keeps thoughts out of history", async () => {
    type Opts = {
      signal: AbortSignal;
      thinking: boolean;
      onThought: (i: number, t: { title: string | null; text: string }) => void;
      onDelta: (t: string) => void;
    };
    let opts!: Opts;
    let finish!: (v: unknown) => void;
    streamAiChat.mockImplementationOnce((_p: string, _h: unknown, o: Opts) => {
      opts = o;
      return new Promise((r) => (finish = r));
    });
    const { result } = setup();
    act(() => void result.current.send("Do I need a softener for 400 ppm?"));
    await waitFor(() => expect(opts).toBeDefined());
    expect(opts.thinking).toBe(true);
    const bubble = () =>
      result.current.messages[result.current.messages.length - 1];
    await waitFor(() => expect(bubble().thinkingLive).toBe(true));

    act(() =>
      opts.onThought(0, {
        title: "Assessing hardness",
        text: "400 ppm is very hard.",
      }),
    );
    act(() =>
      opts.onThought(0, {
        title: "Assessing hardness",
        text: "400 ppm is very hard. Scale forms fast.",
      }),
    );
    expect(bubble().thoughts).toHaveLength(1);
    expect(bubble().thoughts![0].text).toContain("Scale forms fast.");
    expect(result.current.status).toBe("thinking");

    act(() => opts.onDelta("Yes, "));
    act(() => opts.onDelta("a softener."));
    expect(bubble().thinkingLive).toBe(false);
    expect(bubble().text).toBe("Yes, a softener.");
    expect(result.current.status).toBe("streaming");

    await act(async () =>
      finish({
        reply: "Yes, a softener is recommended.",
        thoughts: [{ title: "Assessing hardness", text: "x" }],
        streamed: true,
      }),
    );
    expect(bubble()).toMatchObject({
      text: "Yes, a softener is recommended.",
      done: true,
      thoughts: [{ title: "Assessing hardness", text: "x" }],
    });
    expect(result.current.status).toBe("idle");

    sendAiChat.mockResolvedValueOnce("ok");
    act(() => void result.current.send("Thanks"));
    await waitFor(() => expect(sendAiChat).toHaveBeenCalled());
    expect(sendAiChat.mock.calls[0][1]).toEqual([
      { role: "user", text: "Do I need a softener for 400 ppm?" },
      { role: "assistant", text: "Yes, a softener is recommended." },
    ]);
  });

  it("sends thinking: false when Show thinking is off", async () => {
    sendAiChat.mockResolvedValueOnce("Quick answer.");
    const { result } = renderHook(() =>
      useAquaChat({
        products: DEMO_PRODUCTS,
        getCompare: () => [],
        clearCompare: () => {},
        reducedMotion: true,
        thinking: false,
      }),
    );
    act(() => void result.current.send("Hi"));
    await waitFor(() => expect(sendAiChat).toHaveBeenCalled());
    expect(sendAiChat.mock.calls[0][2]).toMatchObject({ thinking: false });
  });

  it("a new message stops the answer in flight", async () => {
    let firstSignal!: AbortSignal;
    streamAiChat.mockImplementationOnce(
      (_p: string, _h: unknown, o: { signal: AbortSignal }) =>
        new Promise((_r, reject) => {
          firstSignal = o.signal;
          o.signal.addEventListener("abort", () =>
            reject(new ai.AiError("aborted", "cancelled")),
          );
        }),
    );
    sendAiChat.mockResolvedValueOnce("Second answer.");
    const { result } = setup();
    act(() => void result.current.send("first"));
    await waitFor(() => expect(firstSignal).toBeDefined());
    act(() => void result.current.send("second"));
    expect(firstSignal.aborted).toBe(true);
    await waitFor(() =>
      expect(lastAqua(result.current.messages)?.text).toBe("Second answer."),
    );
    const users = result.current.messages.filter((m) => m.role === "user");
    expect(users.map((u) => [u.text, !!u.stopped])).toEqual([
      ["first", true],
      ["second", false],
    ]);
    // The stopped question is not history.
    expect(sendAiChat.mock.calls[0][1]).toEqual([]);
  });

  it("keeps the streamed text with a mid-stream error", async () => {
    streamAiChat.mockImplementationOnce(
      async (_p: string, _h: unknown, o: { onDelta: (t: string) => void }) => {
        o.onDelta("A 20 L softener");
        const err = new ai.AiError(
          "unavailable",
          "Assistant is unavailable right now.",
          503,
        );
        err.partial = "A 20 L softener";
        throw err;
      },
    );
    const { result } = setup();
    act(() => void result.current.send("Which softener?"));
    await waitFor(() =>
      expect(lastAqua(result.current.messages)?.error).toBe(true),
    );
    expect(lastAqua(result.current.messages)).toMatchObject({
      partial: "A 20 L softener",
      retry: { text: "Which softener?" },
    });
  });

  it("keeps Compare local", async () => {
    const { result } = setup();
    act(() => void result.current.send("Compare these"));
    await waitFor(() =>
      expect(lastAqua(result.current.messages)?.text).toMatch(/at least two/),
    );
    expect(sendAiChat).not.toHaveBeenCalled();
  });

  it("falls back to the built-in answers when the AI isn't configured", async () => {
    getAiStatus.mockResolvedValue(false);
    const { result } = setup();
    await waitFor(() => expect(result.current.aiMode).toBe("offline"));
    act(() => void result.current.send("Help me choose a water softener"));
    await waitFor(() =>
      expect(lastAqua(result.current.messages)?.text).toMatch(
        /borewell water or municipal/,
      ),
    );
    expect(sendAiChat).not.toHaveBeenCalled();
  });
});

describe("daily question limits", () => {
  const getAiQuota = ai.getAiQuota as unknown as ReturnType<typeof vi.fn>;
  const guest = {
    tier: "guest",
    limit: 3,
    used: 1,
    remaining: 2,
    resetsAt: "2026-10-23T18:30:00.000Z",
  };
  beforeEach(() => {
    getAiStatus.mockReset().mockResolvedValue(true);
    getAiQuota.mockReset().mockResolvedValue(guest);
    sendAiChat.mockReset();
    streamAiChat.mockClear();
  });

  it("reads the quota on open and updates it from each answer", async () => {
    const { result } = setup();
    await waitFor(() =>
      expect(result.current.quota).toMatchObject({ remaining: 2 }),
    );
    expect(getAiQuota).toHaveBeenCalledWith(null, expect.anything());
    streamAiChat.mockResolvedValueOnce({
      reply: "Hi!",
      thoughts: [],
      streamed: true,
      quota: { ...guest, used: 2, remaining: 1 },
    });
    act(() => void result.current.send("Hello"));
    await waitFor(() =>
      expect(result.current.quota).toMatchObject({ remaining: 1 }),
    );
    expect(result.current.limit).toBeNull();
  });

  it("sends the customer's token with questions and the quota check", async () => {
    sendAiChat.mockResolvedValueOnce("ok");
    const { result } = renderHook(() =>
      useAquaChat({
        products: DEMO_PRODUCTS,
        getCompare: () => [],
        clearCompare: () => {},
        reducedMotion: true,
        token: "tok",
      }),
    );
    await waitFor(() =>
      expect(getAiQuota).toHaveBeenCalledWith("tok", expect.anything()),
    );
    act(() => void result.current.send("Hi"));
    await waitFor(() => expect(sendAiChat).toHaveBeenCalled());
    expect(sendAiChat.mock.calls[0][2]).toMatchObject({ token: "tok" });
  });

  it("on AI_DAILY_LIMIT keeps the question, marks it, and blocks further questions", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.quota).not.toBeNull());
    const err = new ai.AiError(
      "daily_limit",
      "You've used your 3 free questions for today.",
      429,
    );
    err.loginRequired = true;
    err.quota = { ...guest, used: 3, remaining: 0 } as never;
    streamAiChat.mockRejectedValueOnce(err);
    act(() => void result.current.send("One more?"));
    await waitFor(() =>
      expect(result.current.limit).toMatchObject({ loginRequired: true }),
    );
    const ms = result.current.messages;
    expect(ms.find((m) => m.role === "user")).toMatchObject({
      text: "One more?",
      unanswered: true,
    });
    expect(ms.some((m) => m.role === "aqua")).toBe(false);
    expect(result.current.quota).toMatchObject({ remaining: 0 });
    let sent = true;
    act(() => {
      sent = result.current.send("Still there?");
    });
    expect(sent).toBe(false);
  });

  it("a fresh quota with questions left (e.g. after login) lifts the limit", async () => {
    getAiQuota.mockResolvedValueOnce({ ...guest, used: 3, remaining: 0 });
    const { result, rerender } = renderHook(
      ({ token }) =>
        useAquaChat({
          products: DEMO_PRODUCTS,
          getCompare: () => [],
          clearCompare: () => {},
          reducedMotion: true,
          token,
        }),
      { initialProps: { token: null as string | null } },
    );
    await waitFor(() =>
      expect(result.current.limit).toMatchObject({ loginRequired: true }),
    );
    getAiQuota.mockResolvedValueOnce({
      tier: "user",
      limit: 5,
      used: 0,
      remaining: 5,
      resetsAt: guest.resetsAt,
    });
    rerender({ token: "tok" });
    await waitFor(() => expect(result.current.limit).toBeNull());
    expect(result.current.quota).toMatchObject({ tier: "user", remaining: 5 });
  });
});

describe("sizing softeners for a home", () => {
  beforeEach(() => {
    getAiStatus.mockReset().mockResolvedValue(true);
    sendAiChat.mockReset();
    streamAiChat.mockClear();
  });

  it("shows whole-home softeners for a villa with 5 bathrooms, ready to compare", async () => {
    sendAiChat.mockResolvedValueOnce(
      "For a villa, a whole-home automatic softener is simplest.",
    );
    const { result } = setup();
    await waitFor(() => expect(result.current.aiMode).toBe("live"));
    act(
      () =>
        void result.current.send(
          "Which softener for a villa with 5 bathrooms?",
        ),
    );
    await waitFor(() =>
      expect(lastAqua(result.current.messages)?.done).toBe(true),
    );
    const answer = lastAqua(result.current.messages)!;
    // The demo range tops out at 2,500 L/hr, below 5 × 600: the largest leads, flagged.
    expect(answer.products?.[0]).toBe("d4");
    expect(answer.products).not.toContain("d5");
    expect(result.current.reasons.d4).toMatch(/below all 5 bathrooms at once/);
    expect(answer.chips).toEqual([
      "Compare these",
      "Automatic or manual?",
      "Book a site visit",
    ]);
  });

  it("explains automatic vs manual without the AI's help offline", async () => {
    getAiStatus.mockResolvedValue(false);
    const { result } = setup();
    await waitFor(() => expect(result.current.aiMode).toBe("offline"));
    act(() => void result.current.send("Automatic or manual?"));
    await waitFor(() =>
      expect(lastAqua(result.current.messages)?.done).toBe(true),
    );
    expect(lastAqua(result.current.messages)?.text).toMatch(
      /\*\*automatic\*\* softener regenerates by itself/,
    );
  });
});

describe("saved chats", () => {
  const getAiQuota = ai.getAiQuota as unknown as ReturnType<typeof vi.fn>;
  const listAiChats = ai.listAiChats as unknown as ReturnType<typeof vi.fn>;
  const getAiChat = ai.getAiChat as unknown as ReturnType<typeof vi.fn>;
  const carryGuestQuota = ai.carryGuestQuota as unknown as ReturnType<
    typeof vi.fn
  >;
  const resetsAt = "2026-10-23T18:30:00.000Z";
  const hook = (
    token: string | null,
    onResumed = () => {},
    owner: string | null = token ? "u1" : null,
  ) =>
    renderHook(
      ({ token, owner }) =>
        useAquaChat({
          products: DEMO_PRODUCTS,
          getCompare: () => [],
          clearCompare: () => {},
          reducedMotion: true,
          token,
          owner,
          onResumed,
        }),
      { initialProps: { token, owner } },
    );
  const tds = {
    id: "s1",
    title: "TDS",
    messages: [
      { role: "user", text: "What TDS is safe?" },
      { role: "assistant", text: "Below 500 ppm." },
    ],
  };
  beforeEach(() => {
    getAiStatus.mockReset().mockResolvedValue(true);
    getAiQuota.mockReset().mockResolvedValue(null);
    sendAiChat.mockReset();
    streamAiChat.mockClear();
    listAiChats.mockReset().mockResolvedValue([]);
    getAiChat.mockReset().mockResolvedValue(null);
    carryGuestQuota.mockReset().mockResolvedValue(null);
  });

  it("a new visit opens on a new chat; earlier ones wait in the list", async () => {
    listAiChats.mockResolvedValue([
      { id: "s1", title: "TDS", messageCount: 2, lastMessageAt: resetsAt },
    ]);
    const onResumed = vi.fn();
    const { result } = hook("tok", onResumed);
    await waitFor(() => expect(result.current.savedChats).toHaveLength(1));
    expect(result.current.messages).toEqual([]);
    expect(getAiChat).not.toHaveBeenCalled();
    expect(onResumed).not.toHaveBeenCalled();
  });

  it("a refresh lands back on the chat that was opened and keeps saving to it", async () => {
    getAiChat.mockResolvedValueOnce(tds);
    const first = hook("tok");
    await waitFor(() => expect(first.result.current.aiMode).toBe("live"));
    await act(async () => {
      await first.result.current.openSaved("s1");
    });
    first.unmount();

    // Refresh: Redux hands the token back a moment after mount.
    const onResumed = vi.fn();
    const { result, rerender } = hook(null, onResumed, null);
    expect(lastAqua(result.current.messages)?.text).toBe("Below 500 ppm.");
    expect(onResumed).toHaveBeenCalledTimes(1);
    rerender({ token: "tok", owner: "u1" });
    await waitFor(() =>
      expect(listAiChats).toHaveBeenCalledWith("tok", { limit: 20 }),
    );
    expect(getAiChat).toHaveBeenCalledTimes(1); // only the click, not the refresh

    sendAiChat.mockResolvedValueOnce("Yes.");
    act(() => void result.current.send("Is 300 fine?"));
    await waitFor(() => expect(sendAiChat).toHaveBeenCalled());
    expect(sendAiChat.mock.calls[0][1]).toEqual([
      { role: "user", text: "What TDS is safe?" },
      { role: "assistant", text: "Below 500 ppm." },
    ]);
    expect(sendAiChat.mock.calls[0][2]).toMatchObject({
      token: "tok",
      sessionId: "s1",
    });
  });

  it("after New chat, a refresh stays on a new chat", async () => {
    getAiChat.mockResolvedValueOnce(tds);
    const first = hook("tok");
    await waitFor(() => expect(first.result.current.aiMode).toBe("live"));
    await act(async () => {
      await first.result.current.openSaved("s1");
    });
    act(() => first.result.current.clear());
    first.unmount();
    const { result } = hook("tok");
    expect(result.current.messages).toEqual([]);
  });

  it("a guest's chat survives a refresh too", async () => {
    sendAiChat.mockResolvedValueOnce("Below 500 ppm.");
    const first = hook(null);
    await waitFor(() => expect(first.result.current.aiMode).toBe("live"));
    act(() => void first.result.current.send("What TDS is safe?"));
    await waitFor(() =>
      expect(lastAqua(first.result.current.messages)?.text).toBe(
        "Below 500 ppm.",
      ),
    );
    first.unmount();
    const { result } = hook(null);
    expect(result.current.messages.map((m) => m.text)).toEqual([
      "What TDS is safe?",
      "Below 500 ppm.",
    ]);
  });

  it("a refreshed tab signed in as someone else keeps the text but not the session", async () => {
    getAiChat.mockResolvedValueOnce(tds);
    const first = hook("tok");
    await waitFor(() => expect(first.result.current.aiMode).toBe("live"));
    await act(async () => {
      await first.result.current.openSaved("s1");
    });
    first.unmount();

    const { result, rerender } = hook(null, () => {}, null);
    rerender({ token: "tok2", owner: "u2" });
    await waitFor(() =>
      expect(listAiChats).toHaveBeenCalledWith("tok2", { limit: 20 }),
    );
    sendAiChat.mockResolvedValueOnce("Yes.");
    act(() => void result.current.send("Is 300 fine?"));
    await waitFor(() => expect(sendAiChat).toHaveBeenCalled());
    expect(sendAiChat.mock.calls[0][2]).toMatchObject({
      token: "tok2",
      sessionId: null,
    });
  });

  it("a saved chat opens with its product cards back", async () => {
    getAiChat.mockResolvedValueOnce({
      id: "s3",
      title: "Softener for 4",
      messages: [
        { role: "user", text: "Which softener for a family of 4?" },
        {
          role: "assistant",
          text: "**Home Water Softener 20 L Auto** suits four people on borewell water.\n\n**Compact Water Softener 10 L** is enough for two.",
        },
      ],
    });
    const { result } = hook("tok");
    await waitFor(() => expect(result.current.aiMode).toBe("live"));
    await act(async () => {
      await result.current.openSaved("s3");
    });
    const reply = lastAqua(result.current.messages);
    expect(reply?.products).toEqual(["d2", "d1"]);
    expect(reply?.chips).toEqual(["Compare these"]);
  });

  it("lists the account's chats and opens one, continuing that session", async () => {
    listAiChats.mockResolvedValue([
      {
        id: "s2",
        title: "Villa softener",
        messageCount: 4,
        lastMessageAt: resetsAt,
      },
      { id: "s1", title: "TDS", messageCount: 2, lastMessageAt: resetsAt },
    ]);
    const { result } = hook("tok");
    await waitFor(() =>
      expect(result.current.savedChats.map((s) => s.id)).toEqual(["s2", "s1"]),
    );
    getAiChat.mockResolvedValueOnce({
      id: "s1",
      title: "TDS",
      messages: [
        { role: "user", text: "What TDS is safe?" },
        { role: "assistant", text: "Below 500 ppm." },
      ],
    });
    let opened = false;
    await act(async () => {
      opened = await result.current.openSaved("s1");
    });
    expect(opened).toBe(true);
    expect(lastAqua(result.current.messages)?.text).toBe("Below 500 ppm.");
    sendAiChat.mockResolvedValueOnce("Yes.");
    act(() => void result.current.send("And 300?"));
    await waitFor(() => expect(sendAiChat).toHaveBeenCalled());
    expect(sendAiChat.mock.calls[0][2]).toMatchObject({ sessionId: "s1" });
  });

  it("a guest isn't resumed", async () => {
    const { result } = hook(null);
    await waitFor(() => expect(result.current.aiMode).toBe("live"));
    expect(listAiChats).not.toHaveBeenCalled();
  });

  it("a guest who logs in keeps the chat and their questions count toward the account", async () => {
    streamAiChat.mockResolvedValueOnce({
      reply: "Below 500 ppm.",
      thoughts: [],
      streamed: true,
      quota: { tier: "guest", limit: 3, used: 1, remaining: 2, resetsAt },
    });
    const { result, rerender } = hook(null);
    await waitFor(() => expect(result.current.aiMode).toBe("live"));
    act(() => void result.current.send("What TDS is safe?"));
    await waitFor(() =>
      expect(lastAqua(result.current.messages)?.text).toBe("Below 500 ppm."),
    );

    carryGuestQuota.mockResolvedValueOnce({
      tier: "user",
      limit: 5,
      used: 1,
      remaining: 4,
      resetsAt,
    });
    rerender({ token: "tok", owner: "u1" });
    await waitFor(() =>
      expect(result.current.quota).toMatchObject({
        tier: "user",
        remaining: 4,
      }),
    );
    expect(carryGuestQuota).toHaveBeenCalledWith("tok");
    // The saved list loads for the history dock, but the chat on screen isn't replaced.
    expect(getAiChat).not.toHaveBeenCalled();
    expect(lastAqua(result.current.messages)?.text).toBe("Below 500 ppm.");
  });
});
