import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEMO_PRODUCTS, INR } from "./catalogue";
import { ShopList, type ShopRow } from "./ShopPopover";

const p = { ...DEMO_PRODUCTS[0], mrp: 10000, price: 7500 };
const row = (o: Partial<ShopRow> = {}): ShopRow => ({
  id: p.id,
  title: p.title,
  price: p.price,
  qty: 1,
  product: p,
  ...o,
});
const list = (kind: "cart" | "fav", rows: ShopRow[]) =>
  render(
    <ShopList
      kind={kind}
      rows={rows}
      canView
      canCheckout
      onQty={vi.fn()}
      onRemove={vi.fn()}
      onAddToCart={vi.fn()}
      onView={vi.fn()}
      onCheckout={vi.fn()}
      inline
    />,
  );

describe("ShopList", () => {
  it("shows a favourite like a product card", () => {
    list("fav", [row()]);
    expect(screen.getByText(p.brand)).toBeInTheDocument();
    expect(screen.getByText(p.title)).toBeInTheDocument();
    expect(screen.getByText(INR(7500))).toBeInTheDocument();
    expect(screen.getByText(INR(10000))).toBeInTheDocument();
    expect(screen.getByText("25% off")).toBeInTheDocument();
    expect(screen.getByText(p.stock)).toBeInTheDocument();
  });

  it("prices a cart line once, or each with the total beside", () => {
    const { unmount } = list("cart", [row()]);
    expect(screen.getAllByText(INR(7500))).toHaveLength(2); // line + subtotal
    unmount();
    list("cart", [row({ qty: 2 })]);
    expect(screen.getByText(`${INR(7500)} each`)).toBeInTheDocument();
    expect(screen.getAllByText(INR(15000))).toHaveLength(2); // line + subtotal
  });

  it("falls back to name and price without the catalogue product", () => {
    list("fav", [row({ product: undefined })]);
    expect(screen.getByText(p.title)).toBeInTheDocument();
    expect(screen.getByText(INR(7500))).toBeInTheDocument();
    expect(screen.queryByText(/% off/)).toBeNull();
  });
});
