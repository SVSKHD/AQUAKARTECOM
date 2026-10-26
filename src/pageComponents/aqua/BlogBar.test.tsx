import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BlogRead } from "./blogReads";

// jsdom has no speech synthesis: a tiny stand-in that tracks what's playing.
const voice = vi.hoisted(() => ({
  playing: "" as string,
  subs: new Set<() => void>(),
}));
vi.mock("./ReplyActions", () => {
  const notify = () => voice.subs.forEach((f) => f());
  return {
    canSpeak: () => true,
    speakingNow: () => voice.playing || null,
    speak: vi.fn((id: string) => {
      voice.playing = id;
      notify();
    }),
    stopSpeaking: vi.fn(() => {
      voice.playing = "";
      notify();
    }),
    useSpeaking: (id: string) => {
      const [, force] = useState(0);
      voice.subs.add(() => force((n) => n + 1));
      return !!id && voice.playing === id;
    },
  };
});

const ReplyActions = await import("./ReplyActions");
const { default: BlogBar, BLOG_BAR_POS_KEY } = await import("./BlogBar");

const read = (id: string, title: string): BlogRead => ({
  id,
  title,
  href: `/blog/${id}`,
  image: null,
  summary: `${title} in short.`,
  highlights: ["Scale builds up in pipes"],
  paragraphs: [`All about ${title}`],
  minutes: 4,
});
const reads = [
  read("hard-water", "Is hard water bad for hair?"),
  read("tds", "What TDS is safe?"),
];

describe("BlogBar", () => {
  beforeEach(() => window.localStorage.clear());

  it("shows one read at a time and flips through them", async () => {
    const user = userEvent.setup();
    render(<BlogBar reads={reads} bottomOffset={0} onDock={vi.fn()} />);
    expect(screen.getByText("Is hard water bad for hair?")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next read" }));
    expect(screen.getByText("What TDS is safe?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next read" }));
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("opens the read right in the bar, never a new window", async () => {
    const user = userEvent.setup();
    render(<BlogBar reads={reads} bottomOffset={0} onDock={vi.fn()} />);
    expect(screen.queryByRole("link")).toBeNull();
    const open = screen.getByRole("button", {
      name: /is hard water bad for hair/i,
    });
    expect(open).toHaveAttribute("aria-expanded", "false");
    await user.click(open);
    expect(open).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText("All about Is hard water bad for hair?"),
    ).toBeVisible();
    expect(screen.getByText("Scale builds up in pipes")).toBeVisible();
  });

  it("plays the read as a podcast and stops it", async () => {
    const user = userEvent.setup();
    render(<BlogBar reads={reads} bottomOffset={0} onDock={vi.fn()} />);
    await user.click(
      screen.getByRole("button", { name: /listen as podcast/i }),
    );
    expect(ReplyActions.speak).toHaveBeenCalledWith(
      "blog:hard-water",
      expect.stringContaining("Is hard water bad for hair?"),
    );
    const stop = await screen.findByRole("button", { name: /stop podcast/i });
    await user.click(stop);
    expect(ReplyActions.stopSpeaking).toHaveBeenCalled();
  });

  it("opens on the read picked in the history sidebar", () => {
    render(
      <BlogBar reads={reads} bottomOffset={0} focusId="tds" onDock={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: /what tds is safe/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("closing moves it to the history sidebar", async () => {
    const user = userEvent.setup();
    const onDock = vi.fn();
    render(<BlogBar reads={reads} bottomOffset={0} onDock={onDock} />);
    await user.click(
      screen.getByRole("button", {
        name: /move reads to the history sidebar/i,
      }),
    );
    expect(onDock).toHaveBeenCalledTimes(1);
  });

  it("can be moved with the keyboard and remembers where it was put", async () => {
    const user = userEvent.setup();
    render(<BlogBar reads={reads} bottomOffset={0} onDock={vi.fn()} />);
    screen.getByRole("button", { name: /move the reads bar/i }).focus();
    await user.keyboard("{ArrowUp}");
    expect(
      JSON.parse(window.localStorage.getItem(BLOG_BAR_POS_KEY) || "null"),
    ).toMatchObject({
      x: expect.any(Number),
      y: expect.any(Number),
    });
  });

  it("renders nothing without reads", () => {
    const { container } = render(
      <BlogBar reads={[]} bottomOffset={0} onDock={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
