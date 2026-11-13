import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BlogArtifact from "./BlogArtifact";
import type { BlogRead } from "./blogReads";
import type { Product } from "./types";

const read = (id: string, title: string): BlogRead => ({
  id,
  title,
  href: `/blog/${id}`,
  image: null,
  summary: "Hard water softener guide",
  highlights: [],
  paragraphs: [],
  blocks: [
    { kind: "h", text: "Understanding hard water" },
    { kind: "p", text: "Scale builds up on taps." },
    { kind: "h", text: "The solution" },
    { kind: "p", text: "A softener removes hardness." },
  ],
  minutes: 2,
});

const product = (o: Partial<Product>): Product => ({
  id: "s1",
  title: "Kent Bathroom Softener",
  brand: "Kent",
  cat: "softener",
  price: 9000,
  mrp: 12000,
  photos: [],
  inStock: true,
  stock: "",
  desc: "",
  ...o,
});

const setup = (extra = {}) => {
  const props = {
    read: read("a", "Water softener basics"),
    allReads: [read("a", "Water softener basics"), read("b", "Softener salt")],
    products: [product({})],
    renderProduct: (v: Product) => <div key={v.id}>card {v.title}</div>,
    onOpenRead: vi.fn(),
    onOpenProduct: vi.fn(),
    onAddToCart: vi.fn(),
    cartIds: [] as string[],
    onClose: vi.fn(),
    ...extra,
  };
  render(<BlogArtifact {...props} />);
  return props;
};

describe("BlogArtifact rail", () => {
  it("lists related products with price, discount and cart action", () => {
    const props = setup();
    const rail = screen.getByRole("complementary", {
      name: "More from this read",
    });
    expect(within(rail).getByText("₹9,000")).toBeTruthy();
    expect(within(rail).getByText("25% off")).toBeTruthy();
    fireEvent.click(
      within(rail).getByRole("button", {
        name: "Add Kent Bathroom Softener to cart",
      }),
    );
    expect(props.onAddToCart).toHaveBeenCalledWith("s1");
    fireEvent.click(
      within(rail).getByRole("button", { name: "View Kent Bathroom Softener" }),
    );
    expect(props.onOpenProduct).toHaveBeenCalledWith("s1");
  });

  it("shows an outline of the headings and more reads", () => {
    const props = setup();
    const nav = screen.getByRole("navigation", { name: "On this page" });
    expect(within(nav).getAllByRole("button")).toHaveLength(2);
    const rail = screen.getByRole("complementary", {
      name: "More from this read",
    });
    fireEvent.click(within(rail).getByText("Softener salt"));
    expect(props.onOpenRead).toHaveBeenCalledWith(
      expect.objectContaining({ id: "b" }),
    );
  });

  it("marks products already in the cart", () => {
    setup({ cartIds: ["s1"] });
    expect(
      screen.getByRole("button", {
        name: "Kent Bathroom Softener is in your cart, add one more",
      }),
    ).toBeTruthy();
  });
});
