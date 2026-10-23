import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/ai")>();
  return { ...actual, getAiStatus: vi.fn(), sendAiChat: vi.fn() };
});

const ai = await import("@/services/ai");
const { useAquaChat } = await import("./useAquaChat");
const { DEMO_PRODUCTS } = await import("./catalogue");

const getAiStatus = ai.getAiStatus as unknown as ReturnType<typeof vi.fn>;
const sendAiChat = ai.sendAiChat as unknown as ReturnType<typeof vi.fn>;

const setup = () =>
  renderHook(() =>
    useAquaChat({
      products: DEMO_PRODUCTS,
      getCompare: () => [],
      clearCompare: () => {},
      reducedMotion: true,
    }),
  );

const lastAqua = (msgs: { role: string; typing?: boolean }[]) =>
  [...msgs].reverse().find((m) => m.role === "aqua" && !m.typing);

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

  it("allows one request at a time", async () => {
    let resolve!: (v: string) => void;
    sendAiChat.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    const { result } = setup();
    act(() => void result.current.send("first"));
    await waitFor(() => expect(sendAiChat).toHaveBeenCalledTimes(1));
    let accepted = true;
    act(() => {
      accepted = result.current.send("second");
    });
    expect(accepted).toBe(false);
    await act(async () => resolve("done"));
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
