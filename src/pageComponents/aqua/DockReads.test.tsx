import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { BlogRead } from "./blogReads";

const speech = vi.hoisted(() => ({ speak: vi.fn(), stop: vi.fn() }));
vi.mock("./ReplyActions", () => ({
  canSpeak: () => true,
  speak: speech.speak,
  stopSpeaking: speech.stop,
  speakingNow: () => null,
  useSpeaking: () => false,
}));

const { default: DockReads } = await import("./DockReads");

const read = (id: string, title: string): BlogRead => ({
  id,
  title,
  href: `/blog/${id}`,
  image: null,
  summary: `${title} in short.`,
  highlights: [],
  paragraphs: ["One.", "Two.", "Three.", "Four.", "Five.", "Six."],
  minutes: 2,
});

describe("DockReads", () => {
  it("is a collapsed section that opens to read a post in full or listen", async () => {
    const user = userEvent.setup();
    render(
      <DockReads
        reads={[read("a", "Hard water basics"), read("b", "Salt or salt-free")]}
      />,
    );

    const section = screen.getByRole("button", { name: /Water reads/ });
    expect(section.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("Hard water basics")).toBeNull();

    await user.click(section);
    expect(section.getAttribute("aria-expanded")).toBe("true");
    const post = screen.getByRole("button", { name: /Hard water basics/ });
    await user.click(post);
    expect(post.getAttribute("aria-expanded")).toBe("true");
    // Whole article in place, no "open in a new tab" link.
    const body = document.getElementById(post.getAttribute("aria-controls")!)!;
    expect(body.hidden).toBe(false);
    expect(within(body).getByText("Six.")).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: /Read full article/ }),
    ).toBeNull();
    // More than the newest few: the blog page.
    expect(
      screen
        .getByRole("link", { name: /More water reads/ })
        .getAttribute("href"),
    ).toBe("/blogs");

    await user.click(screen.getByRole("button", { name: /Listen as podcast/ }));
    expect(speech.speak).toHaveBeenCalledWith(
      "blog:a",
      expect.stringContaining("Hard water basics"),
    );
  });

  it("renders nothing without reads", () => {
    const { container } = render(<DockReads reads={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
