import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { DEMO_PRODUCTS, INR } from "./catalogue";
import ProductStage from "./ProductStage";
import type { ChatMessage } from "./types";

const products = new Map(DEMO_PRODUCTS.map((p) => [p.id, p]));
const base = {
  products,
  reasons: {},
  favIds: [],
  cartIds: [],
  compareHint: false,
  selectedId: null,
  busy: false,
  onOpen: vi.fn(),
  onToggleFav: vi.fn(),
  onToggleCompare: vi.fn(),
  onAddToCart: vi.fn(),
};
const msgs = [
  { id: "u1", role: "user", text: "softener?" },
  { id: "a1", role: "aqua", text: "x", products: ["d1"], done: true },
  { id: "u2", role: "user", text: "villa?" },
  { id: "a2", role: "aqua", text: "y", products: ["d3", "d4"], done: true },
] as ChatMessage[];

describe("ProductStage", () => {
  it("shows the latest answer's products first, then earlier ones", () => {
    render(
      <ProductStage
        {...base}
        messages={msgs}
        compare={[]}
        onCompare={vi.fn()}
      />,
    );
    const latest = screen.getByRole("region", {
      name: "From Aqua's latest answer",
    });
    const earlier = screen.getByRole("region", {
      name: "Earlier in this chat",
    });
    expect(latest).toHaveTextContent("Family Water Softener 30 L Auto");
    expect(latest).toHaveTextContent("Whole-Home Softener 50 L");
    expect(earlier).toHaveTextContent("Compact Water Softener 10 L");
    expect(
      screen.getByText("3 products from your chat with Aqua"),
    ).toBeTruthy();
  });

  it("compares once two are picked", () => {
    const onCompare = vi.fn();
    render(
      <ProductStage
        {...base}
        messages={msgs}
        compare={["d3", "d4"]}
        onCompare={onCompare}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Compare 2/ }));
    expect(onCompare).toHaveBeenCalled();
  });

  it("sums up the picks in the rail and offers follow-up questions", () => {
    const onAsk = vi.fn();
    render(
      <ProductStage
        {...base}
        messages={msgs}
        compare={[]}
        onCompare={vi.fn()}
        onAsk={onAsk}
      />,
    );
    const rail = screen.getByRole("complementary", {
      name: "About your picks",
    });
    const prices = ["d1", "d3", "d4"].map((id) => products.get(id)!.price);
    expect(rail).toHaveTextContent(
      `${INR(Math.min(...prices))} – ${INR(Math.max(...prices))}`,
    );
    fireEvent.click(
      within(rail).getByRole("button", { name: /suits my home best/ }),
    );
    expect(onAsk).toHaveBeenCalledWith("Which of these suits my home best?");
  });

  it("invites a question before there are products", () => {
    const onAsk = vi.fn();
    render(
      <ProductStage
        {...base}
        messages={[]}
        compare={[]}
        onCompare={vi.fn()}
        onAsk={onAsk}
        awaitingAnswers
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Your picks land here" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Answer Aqua's quick questions/)).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: /Villa or independent house/ }),
    );
    expect(onAsk).toHaveBeenCalledWith(
      "Which softener for a villa with 4 bathrooms on borewell?",
    );
    // Something real to look at meanwhile: in-stock products.
    expect(
      screen.getByRole("region", { name: "In stock now" }),
    ).toBeInTheDocument();
  });
});
