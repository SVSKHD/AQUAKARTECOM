import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ComparePanel from "./ComparePanel";
import type { Product } from "./types";

const P = (id: string, title: string): Product => ({
  id,
  title,
  brand: "Kent",
  cat: "softener",
  price: 14500,
  mrp: 0,
  photos: [],
  inStock: true,
  stock: "In stock",
  desc: "",
});
const products = [P("a", "Kent Bathroom"), P("b", "Kent Automatic 8L")];

describe("ComparePanel ask Aqua", () => {
  const setup = () => {
    const onAsk = vi.fn();
    const onViewAnswer = vi.fn();
    const ui = (chatBusy: boolean) => (
      <ComparePanel
        products={products}
        onView={vi.fn()}
        onBuy={vi.fn()}
        onAsk={onAsk}
        chatBusy={chatBusy}
        onViewAnswer={onViewAnswer}
      />
    );
    const r = render(ui(false));
    return { onAsk, onViewAnswer, busy: (b: boolean) => r.rerender(ui(b)) };
  };

  it("shows a loader while Aqua answers, then a button to read it", async () => {
    const { onAsk, onViewAnswer, busy } = setup();
    await userEvent.click(
      screen.getByRole("button", { name: /ask aqua which one suits me/i }),
    );
    expect(onAsk).toHaveBeenCalledWith(
      "Which of these should I pick for my home?",
    );
    const loading = screen.getByRole("button", { name: /comparing these/i });
    expect(loading).toBeDisabled();
    busy(true);
    expect(
      screen.getByRole("button", { name: /comparing these/i }),
    ).toBeInTheDocument();
    busy(false);
    await userEvent.click(
      screen.getByRole("button", { name: /answer is ready · close & view/i }),
    );
    expect(onViewAnswer).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /ask aqua which one suits me/i }),
    ).toBeInTheDocument();
  });

  it("goes back to the ask button if the question never went out", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setup();
    await userEvent.click(
      screen.getByRole("button", { name: /ask aqua which one suits me/i }),
    );
    act(() => vi.advanceTimersByTime(4100));
    expect(
      screen.getByRole("button", { name: /ask aqua which one suits me/i }),
    ).toBeEnabled();
    vi.useRealTimers();
  });

  it("keeps the label column solid over scrolled cells", () => {
    setup();
    const label = screen.getByRole("rowheader", { name: "Price" });
    expect(label.style.position).toBe("sticky");
    expect(label.style.background).toBe("var(--aq-surf)");
  });
});
