import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { useSheetContentDrag } from "./useSheetContentDrag";

// jsdom has no Touch: a plain event carrying the touch lists the hook reads.
const touch = (
  target: Element,
  type: string,
  x: number,
  y: number,
  timeStamp: number,
) => {
  const e = new Event(type, { bubbles: true, cancelable: true });
  const point = [{ clientX: x, clientY: y }];
  Object.defineProperties(e, {
    touches: { value: type === "touchend" ? [] : point },
    changedTouches: { value: point },
    timeStamp: { value: timeStamp },
  });
  act(() => void target.dispatchEvent(e));
  return e;
};

function Sheet(props: {
  peek?: boolean;
  onDrag: (h: number | null) => void;
  onSettle: (h: number, travel: number, ms: number) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useSheetContentDrag({
    ref,
    enabled: true,
    isPeek: () => !!props.peek,
    fullH: () => 700,
    onDrag: props.onDrag,
    onSettle: props.onSettle,
  });
  return (
    <aside ref={ref} data-testid="sheet">
      <button className="aq-sheet-handle">handle</button>
      <div data-testid="scroll" style={{ overflowY: "auto" }}>
        <p data-testid="content">content</p>
      </div>
    </aside>
  );
}

const setup = (peek = false, scrollTop = 0) => {
  const onDrag = vi.fn();
  const onSettle = vi.fn();
  const r = render(<Sheet peek={peek} onDrag={onDrag} onSettle={onSettle} />);
  const sheet = r.getByTestId("sheet");
  const scroll = r.getByTestId("scroll");
  // jsdom lays nothing out: give the sheet and its scroller real-looking sizes.
  sheet.getBoundingClientRect = () => ({ height: 600 }) as DOMRect;
  Object.defineProperty(scroll, "scrollHeight", { value: 2000 });
  Object.defineProperty(scroll, "clientHeight", { value: 500 });
  scroll.scrollTop = scrollTop;
  return { onDrag, onSettle, r, content: r.getByTestId("content"), scroll };
};

describe("useSheetContentDrag", () => {
  it("pulls the sheet down from content scrolled to the top", () => {
    const { onDrag, onSettle, content } = setup();
    touch(content, "touchstart", 100, 200, 0);
    touch(content, "touchmove", 101, 215, 20);
    const move = touch(content, "touchmove", 101, 300, 80);
    expect(move.defaultPrevented).toBe(true);
    expect(onDrag).toHaveBeenLastCalledWith(600 - 85);
    touch(content, "touchend", 101, 400, 200);
    expect(onSettle).toHaveBeenCalledWith(600, 185, 180);
  });

  it("lets content mid-list scroll, then takes over once it's at the top", () => {
    const { onDrag, onSettle, content, scroll } = setup(false, 120);
    touch(content, "touchstart", 100, 200, 0);
    const scrolling = touch(content, "touchmove", 100, 260, 30);
    expect(scrolling.defaultPrevented).toBe(false);
    expect(onDrag).not.toHaveBeenCalled();
    // The content reaches its top during the same pull.
    scroll.scrollTop = 0;
    touch(content, "touchmove", 100, 280, 60);
    touch(content, "touchmove", 100, 380, 120);
    expect(onDrag).toHaveBeenLastCalledWith(600 - 100);
    touch(content, "touchend", 100, 380, 160);
    expect(onSettle).toHaveBeenCalledWith(600, 100, 100);
  });

  it("ignores sideways swipes and the handle", () => {
    const { onDrag, onSettle, content, r } = setup();
    touch(content, "touchstart", 100, 200, 0);
    const side = touch(content, "touchmove", 200, 210, 30);
    expect(side.defaultPrevented).toBe(false);
    touch(content, "touchend", 200, 210, 60);
    const handle = r.getByText("handle");
    touch(handle, "touchstart", 100, 10, 100);
    touch(handle, "touchmove", 100, 200, 150);
    touch(handle, "touchend", 100, 200, 200);
    expect(onDrag).not.toHaveBeenCalled();
    expect(onSettle).not.toHaveBeenCalled();
  });

  it("moves a collapsed sheet up from anywhere", () => {
    const { onDrag, onSettle, content } = setup(true, 50);
    touch(content, "touchstart", 100, 500, 0);
    touch(content, "touchmove", 100, 480, 20);
    touch(content, "touchmove", 100, 300, 100);
    // Never taller than full.
    touch(content, "touchmove", 100, 0, 150);
    expect(onDrag).toHaveBeenLastCalledWith(700);
    touch(content, "touchend", 100, 0, 200);
    expect(onSettle).toHaveBeenCalledWith(600, -480, 180);
  });
});
