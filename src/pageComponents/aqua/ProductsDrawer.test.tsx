import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_PRODUCTS } from "./catalogue";
import ProductsDrawer from "./ProductsDrawer";
import { DRAWER_OUT_MS } from "./useDrawer";

const [a, b, c] = DEMO_PRODUCTS;

const setup = (compare: string[] = []) => {
  const props = {
    products: [b, a, c],
    favIds: [a.id],
    cartIds: [],
    compare,
    canView: true,
    onView: vi.fn(),
    onToggleFav: vi.fn(),
    onToggleCompare: vi.fn(),
    onAddToCart: vi.fn(),
    onCompare: vi.fn(),
    onClose: vi.fn(),
  };
  render(<ProductsDrawer {...props} />);
  return props;
};

const names = () =>
  within(screen.getByRole("list", { name: "Products" }))
    .getAllByRole("button", { name: /^Open / })
    .map((x) => x.getAttribute("aria-label")!.slice(5));

afterEach(() => vi.useRealTimers());

describe("ProductsDrawer", () => {
  it("lists the answer's products in order, or cheapest first", () => {
    setup();
    expect(screen.getByRole("dialog", { name: "Products in this answer" }));
    expect(names()).toEqual([b.title, a.title, c.title]);
    fireEvent.click(screen.getByRole("button", { name: /As mentioned/ }));
    const byPrice = [a, b, c].sort((x, y) => x.price - y.price);
    expect(names()).toEqual(byPrice.map((x) => x.title));
  });

  it("opens a product and works the row's tools", () => {
    const p = setup();
    fireEvent.click(screen.getByRole("button", { name: `Open ${a.title}` }));
    expect(p.onView).toHaveBeenCalledWith(a.id);
    fireEvent.click(screen.getByRole("button", { name: `Compare ${b.title}` }));
    expect(p.onToggleCompare).toHaveBeenCalledWith(b.id);
    fireEvent.click(
      screen.getByRole("button", { name: `Remove ${a.title} from favourites` }),
    );
    expect(p.onToggleFav).toHaveBeenCalledWith(a.id);
    fireEvent.click(
      screen.getByRole("button", { name: `Add ${a.title} to cart` }),
    );
    expect(p.onAddToCart).toHaveBeenCalledWith(a.id);
    // Out of stock: nothing to add.
    if (!c.inStock)
      expect(
        screen.getByRole("button", { name: `Add ${c.title} to cart` }),
      ).toHaveProperty("disabled", true);
  });

  it("compares once two are picked", () => {
    const p = setup([a.id, b.id]);
    expect(screen.getByText("2 picked to compare")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Compare" }));
    expect(p.onCompare).toHaveBeenCalled();
  });

  it("slides away before closing, on Escape or Close", () => {
    vi.useFakeTimers();
    const p = setup();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(p.onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog").getAttribute("data-leaving")).toBe(
      "true",
    );
    act(() => void vi.advanceTimersByTime(DRAWER_OUT_MS));
    expect(p.onClose).toHaveBeenCalledTimes(1);
    // A second close while it's leaving doesn't close twice.
    fireEvent.click(screen.getByRole("button", { name: "Close products" }));
    act(() => void vi.advanceTimersByTime(DRAWER_OUT_MS));
    expect(p.onClose).toHaveBeenCalledTimes(1);
  });
});

describe("ProductsDrawer compare mode", () => {
  it("asks to pick the chat's products, with the compare footer from the start", () => {
    render(
      <ProductsDrawer
        products={[a, b]}
        favIds={[]}
        cartIds={[]}
        compare={[]}
        canView
        mode="compare"
        onView={vi.fn()}
        onToggleFav={vi.fn()}
        onToggleCompare={vi.fn()}
        onAddToCart={vi.fn()}
        onCompare={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("dialog", { name: "Pick products to compare" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/from this chat/)).toBeInTheDocument();
    expect(
      screen.getByText("Tap ⇄ on 2 or more to compare"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Compare$/ })).toBeDisabled();
  });
});
