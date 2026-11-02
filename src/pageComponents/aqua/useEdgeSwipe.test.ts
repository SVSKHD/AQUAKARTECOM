import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dragOffset,
  settleOpen,
  sidebarTravel,
  useEdgeSwipe,
} from "./useEdgeSwipe";

// jsdom has no Touch: a plain event carrying the touch lists the hook reads.
const touch = (
  type: string,
  x: number,
  y: number,
  timeStamp: number,
): Event => {
  const e = new Event(type, { bubbles: true, cancelable: true });
  const point = [{ clientX: x, clientY: y }];
  Object.defineProperties(e, {
    touches: { value: type === "touchend" ? [] : point },
    changedTouches: { value: point },
    timeStamp: { value: timeStamp },
  });
  return e;
};
const fire = (e: Event) => act(() => void window.dispatchEvent(e));
// The sidebar's grip: opening drags start on it.
const grip = () => {
  const el = document.createElement("button");
  el.setAttribute("data-dock-grab", "");
  document.body.append(el);
  return el;
};
const onGrip = (e: Event) => act(() => void grip().dispatchEvent(e));
afterEach(() => document.body.replaceChildren());

describe("edge swipe maths", () => {
  const travel = sidebarTravel(390); // 320 + 24

  it("drags the sidebar with the finger, never past open or closed", () => {
    expect(travel).toBe(344);
    expect(dragOffset("open", 100, travel)).toBe(-244);
    expect(dragOffset("open", 500, travel)).toBe(0);
    expect(dragOffset("open", -30, travel)).toBe(-344);
    expect(dragOffset("close", -100, travel)).toBe(-100);
    expect(dragOffset("close", 50, travel)).toBe(0);
  });

  it("opens past a third of the way or on a flick, else springs back", () => {
    expect(settleOpen("open", -200, travel, 0.1)).toBe(true);
    expect(settleOpen("open", -300, travel, 0.1)).toBe(false);
    expect(settleOpen("open", -320, travel, 0.8)).toBe(true);
    expect(settleOpen("close", -60, travel, -0.1)).toBe(true);
    expect(settleOpen("close", -150, travel, -0.1)).toBe(false);
    expect(settleOpen("close", -20, travel, -0.9)).toBe(false);
  });
});

describe("useEdgeSwipe", () => {
  const setup = (open = false) => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const hook = renderHook(
      (p: { open: boolean }) =>
        useEdgeSwipe({ enabled: true, open: p.open, onOpen, onClose }),
      { initialProps: { open } },
    );
    return { onOpen, onClose, hook };
  };

  it("follows a finger dragged from the grip and opens the sidebar", () => {
    const { onOpen, hook } = setup();
    onGrip(touch("touchstart", 30, 300, 0));
    fire(touch("touchmove", 60, 302, 50));
    const move = touch("touchmove", 200, 305, 200);
    fire(move);
    expect(move.defaultPrevented).toBe(true);
    expect(hook.result.current).toBe(-sidebarTravel(1024) + 170);
    fire(touch("touchend", 200, 305, 400));
    expect(onOpen).toHaveBeenCalled();
    expect(hook.result.current).toBeNull();
  });

  it("ignores the bare edge (the browser's back swipe) and scrolls", () => {
    const { onOpen, hook } = setup();
    // From the very edge, not on the grip: left to the browser.
    fire(touch("touchstart", 4, 300, 0));
    const edge = touch("touchmove", 200, 300, 100);
    fire(edge);
    expect(edge.defaultPrevented).toBe(false);
    fire(touch("touchend", 200, 300, 150));
    // A grip start that turns out to be a scroll stays a scroll.
    onGrip(touch("touchstart", 30, 300, 200));
    const scroll = touch("touchmove", 36, 380, 250);
    fire(scroll);
    expect(scroll.defaultPrevented).toBe(false);
    fire(touch("touchend", 36, 380, 300));
    expect(onOpen).not.toHaveBeenCalled();
    expect(hook.result.current).toBeNull();
  });

  it("pushes the open sidebar away with a swipe left", () => {
    const { onClose } = setup(true);
    fire(touch("touchstart", 260, 300, 0));
    fire(touch("touchmove", 200, 302, 40));
    fire(touch("touchmove", 60, 304, 120));
    fire(touch("touchend", 60, 304, 160));
    expect(onClose).toHaveBeenCalled();
  });
});
