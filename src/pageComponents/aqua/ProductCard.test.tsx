import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ProductCard from "./ProductCard";
import ProductDetail from "./ProductDetail";
import type { Product } from "./types";

vi.mock("./AquaAvatar", () => ({ default: () => null }));

const product: Product = {
  id: "p1",
  title: "Kent Bathroom Water Softener",
  brand: "Kent",
  cat: "softener",
  price: 14500,
  mrp: 18000,
  photos: [],
  inStock: true,
  stock: "In stock",
  desc: "",
};

const card = (p: Product) => {
  const onOpen = vi.fn();
  render(
    <ProductCard
      product={p}
      isFav={false}
      inCart={false}
      inCompare={false}
      selected={false}
      compact
      onOpen={onOpen}
      onToggleFav={vi.fn()}
      onToggleCompare={vi.fn()}
      onAddToCart={vi.fn()}
    />,
  );
  return onOpen;
};

describe("ProductCard", () => {
  it("Buy now opens the product (the drawer on a phone)", async () => {
    const onOpen = card(product);
    await userEvent.click(
      screen.getByRole("button", { name: `Buy ${product.title}` }),
    );
    expect(onOpen).toHaveBeenCalledWith("p1");
    expect(screen.getByText("Buy now")).toBeInTheDocument();
  });

  it("has compare and cart as icons on the photo", async () => {
    const onToggleCompare = vi.fn();
    const onAddToCart = vi.fn();
    render(
      <ProductCard
        product={product}
        isFav={false}
        inCart
        inCompare={false}
        selected={false}
        compact
        onOpen={vi.fn()}
        onToggleFav={vi.fn()}
        onToggleCompare={onToggleCompare}
        onAddToCart={onAddToCart}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: `Compare ${product.title}` }),
    );
    expect(onToggleCompare).toHaveBeenCalledWith("p1");
    await userEvent.click(
      screen.getByRole("button", { name: /is in your cart, add one more/ }),
    );
    expect(onAddToCart).toHaveBeenCalledWith("p1");
    expect(screen.queryByText("Compare")).toBeNull();
  });

  it("offers View when the product is out of stock", () => {
    card({ ...product, inStock: false, stock: "Out of stock" });
    // The photo and the button both open it.
    expect(
      screen.getAllByRole("button", { name: `View ${product.title}` }),
    ).toHaveLength(2);
    expect(screen.queryByText("Buy now")).toBeNull();
  });
});

describe("ProductDetail in the drawer", () => {
  it("has a Close / Close & ask button group", async () => {
    const onChat = vi.fn();
    const onClose = vi.fn();
    render(
      <ProductDetail
        product={product}
        selection={{ variant: 0, qty: 1 }}
        onSelection={vi.fn()}
        isFav={false}
        inCart={false}
        inCompare={false}
        onAddToCart={vi.fn()}
        onToggleFav={vi.fn()}
        onToggleCompare={vi.fn()}
        onBuy={vi.fn()}
        onAsk={vi.fn()}
        onChat={onChat}
        onClose={onClose}
        dark={false}
        isMobile
      />,
    );
    const group = screen.getByRole("group", { name: "Close the product" });
    expect(group).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Close & ask" }));
    expect(onChat).toHaveBeenCalled();
  });
});
