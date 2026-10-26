import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/blog", () => ({
  default: {
    AllBlogs: vi.fn(() =>
      Promise.resolve({
        data: {
          success: true,
          data: [
            {
              _id: "b1",
              slug: "hard-water",
              title: "Hard water in Hyderabad",
              description: "<p>Borewells run hard.</p><p>Test first.</p>",
              shortDescription: "Why geysers scale.",
            },
          ],
        },
      }),
    ),
  },
}));

const speech = vi.hoisted(() => ({ speak: vi.fn(), stop: vi.fn() }));
vi.mock("./ReplyActions", () => ({
  canSpeak: () => true,
  speak: speech.speak,
  stopSpeaking: speech.stop,
  speakingNow: () => null,
  useSpeaking: () => false,
}));

const { default: WhileYouWait } = await import("./WhileYouWait");

describe("WhileYouWait", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  const wait = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  it("stays hidden for a quick answer", async () => {
    const { rerender } = render(<WhileYouWait waiting />);
    await wait(1000);
    rerender(<WhileYouWait waiting={false} />);
    await wait(5000);
    expect(screen.queryByLabelText("Quick reads")).toBeNull();
  });

  it("offers reads on a slow answer, opens one, and plays it as a podcast", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { rerender } = render(<WhileYouWait waiting />);
    await wait(3600);
    expect(screen.getByText("While Aqua thinks")).toBeTruthy();

    const head = screen.getByRole("button", {
      name: /Hard water in Hyderabad/,
    });
    expect(head.getAttribute("aria-expanded")).toBe("false");
    await user.click(head);
    expect(head.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Why geysers scale.")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Read full article/ }),
    ).toHaveProperty("href", expect.stringContaining("/blog/hard-water"));

    await user.click(screen.getByRole("button", { name: /Listen as podcast/ }));
    expect(speech.speak).toHaveBeenCalledWith(
      "blog:b1",
      expect.stringMatching(/^You're listening to Aquakart Reads/),
    );

    // Opened, so it stays once the answer lands.
    rerender(<WhileYouWait waiting={false} />);
    expect(screen.getByText("Keep reading")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Close quick reads" }));
    expect(screen.queryByLabelText("Quick reads")).toBeNull();
  });
});
