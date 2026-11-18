import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AssistantLauncher, { LAUNCHER_HINTS } from "./AssistantLauncher";

// jsdom has no layout: give the label a width so the knob has room to slide.
let widthSpy;
beforeEach(() => {
  widthSpy = vi
    .spyOn(HTMLElement.prototype, "offsetWidth", "get")
    .mockReturnValue(152);
});
afterEach(() => {
  widthSpy.mockRestore();
  vi.useRealTimers();
});

const setup = (props = {}) => {
  const onOpen = vi.fn();
  const utils = render(
    <AssistantLauncher
      avatar={<span>A</span>}
      onOpen={onOpen}
      reduceMotion
      panelId="panel"
      {...props}
    />,
  );
  const button = screen.getByRole("button", {
    name: "Open AquaKart assistant",
  });
  const knob = utils.container.querySelector(".aq-launch-knob");
  return { onOpen, button, knob };
};

// Travel is the label width + 8 = 160px.
const slide = (knob, button, dx) => {
  fireEvent.pointerDown(knob, { clientX: 10, pointerId: 1, button: 0 });
  fireEvent.pointerMove(knob, { clientX: 10 + dx / 2, pointerId: 1 });
  fireEvent.pointerMove(knob, { clientX: 10 + dx, pointerId: 1 });
  fireEvent.pointerUp(knob, { clientX: 10 + dx, pointerId: 1 });
  // Browsers follow the release with a click on the button.
  fireEvent.click(button);
};

describe("AssistantLauncher (slide to ask)", () => {
  it("opens on a tap, so the slide is never required", () => {
    const { onOpen, button } = setup();
    fireEvent.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("says how to use it", () => {
    setup();
    expect(screen.getByText(LAUNCHER_HINTS[0])).toBeInTheDocument();
    expect(LAUNCHER_HINTS[0]).toBe("Slide to ask");
  });

  it("opens when the knob is slid most of the way", () => {
    const { onOpen, button, knob } = setup();
    slide(knob, button, 140);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("springs back without opening after a short slide", () => {
    const { onOpen, button, knob } = setup();
    slide(knob, button, 40);
    expect(onOpen).not.toHaveBeenCalled();
    // The next plain tap still opens.
    fireEvent.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("rotates its prompts unless motion is reduced", () => {
    vi.useFakeTimers();
    const { button } = setup({ reduceMotion: false });
    const hint = button.querySelector(".aq-launch-hint");
    expect(hint).toHaveAttribute("data-hint", "0");
    act(() => vi.advanceTimersByTime(3700));
    expect(hint).toHaveAttribute("data-hint", "1");
  });

  it("keeps one prompt when motion is reduced", () => {
    vi.useFakeTimers();
    const { button } = setup({ reduceMotion: true });
    act(() => vi.advanceTimersByTime(8000));
    expect(button.querySelector(".aq-launch-hint")).toHaveAttribute(
      "data-hint",
      "0",
    );
  });

  it("shrinks to the round avatar on phones after a moment", () => {
    vi.useFakeTimers();
    const mm = vi.spyOn(window, "matchMedia").mockImplementation((q) => ({
      matches: q.includes("max-width: 639px"),
      media: q,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }));
    const { button } = setup();
    expect(button).toHaveAttribute("data-compact", "false");
    act(() => vi.advanceTimersByTime(7500));
    expect(button).toHaveAttribute("data-compact", "true");
    mm.mockRestore();
  });
});
