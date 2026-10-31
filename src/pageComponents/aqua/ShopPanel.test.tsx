import { useState } from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ShopPanel, {
  EMPTY_SHOP_UI,
  pickToCompare,
  shopList,
  type ShopUi,
} from "./ShopPanel";
import { productReviews } from "./productReviews";
import type { Product } from "./types";

const P = (
  id: string,
  title: string,
  cat: Product["cat"],
  price: number,
  mrp: number,
  extra: Partial<Product> = {},
): Product => ({
  id,
  title,
  brand: "Kent",
  cat,
  price,
  mrp,
  photos: [],
  inStock: true,
  stock: "In stock",
  desc: "",
  ...extra,
});

const reviews = {
  ratings: 4.5,
  numberOfReviews: 12,
  reviews: [
    { name: "Ravi", rating: 5, comment: "Water feels soft, no more scale." },
    { name: "Meena", rating: 3, comment: "Okay." },
  ],
};

const products = [
  P("a", "Kent Grand Plus", "purifier", 18500, 20000),
  P("b", "Home Softener 20 L", "softener", 24990, 29990, {
    capacity: "20 L resin",
    warranty: "1 year",
    desc: "A softener for families.",
    raw: reviews,
  }),
  P("c", "Sediment Filter", "filter", 450, 0, {
    inStock: false,
    stock: "Out of stock",
  }),
  P("d", "Compact Softener 10 L", "softener", 18500, 0),
];

describe("shopList", () => {
  const all = EMPTY_SHOP_UI;
  const ids = (o: Partial<ShopUi>) =>
    shopList(products, { ...all, ...o }).map((p) => p.id);
  it("searches, filters and sorts", () => {
    expect(ids({ query: "softener" })).toEqual(["b", "d"]);
    expect(ids({ inStock: true })).toEqual(["a", "b", "d"]);
    expect(ids({ cat: "filter" })).toEqual(["c"]);
    expect(ids({ sort: "price-asc" })).toEqual(["c", "a", "d", "b"]);
    expect(ids({ sort: "discount" })[0]).toBe("b");
    expect(ids({ sort: "rating" })[0]).toBe("b");
  });
});

describe("productReviews", () => {
  it("reads the rating, count and the best review", () => {
    expect(productReviews(products[1])).toEqual({
      rating: 4.5,
      count: 12,
      top: [
        {
          name: "Ravi",
          rating: 5,
          comment: "Water feels soft, no more scale.",
        },
        { name: "Meena", rating: 3, comment: "Okay." },
      ],
    });
    expect(productReviews(products[0])).toEqual({
      rating: null,
      count: 0,
      top: [],
    });
  });
});

describe("productReviews duplicates", () => {
  it("shows a review posted twice only once", () => {
    const comment = "Excellent product! Easy to install.";
    const p = P("z", "X", "softener", 1, 0, {
      raw: {
        reviews: [
          { name: "Anonymous", rating: 5, comment },
          {
            name: "Anonymous",
            rating: 5,
            comment: ` ${comment.toUpperCase()} `,
          },
        ],
      },
    });
    expect(productReviews(p).top).toHaveLength(1);
  });
});

describe("pickToCompare", () => {
  const catOf = (id: string) => products.find((p) => p.id === id)?.cat;
  it("compares within one category, up to four", () => {
    expect(pickToCompare(["b"], "d", catOf)).toEqual({
      picked: ["b", "d"],
      note: "",
    });
    expect(pickToCompare(["b", "d"], "b", catOf).picked).toEqual(["d"]);
    const other = pickToCompare(["b", "d"], "a", catOf);
    expect(other.picked).toEqual(["a"]);
    expect(other.note).toMatch(/now comparing purifiers/i);
    expect(
      pickToCompare(["b", "d", "x", "y"], "z", () => "softener").note,
    ).toMatch(/up to 4/);
  });
});

describe("ShopPanel", () => {
  afterEach(() => vi.useRealTimers());

  const setup = (over = {}) => {
    const props = {
      products,
      loading: false,
      live: true,
      favs: ["b"],
      cart: [],
      canView: true,
      onView: vi.fn(),
      onBuy: vi.fn(),
      onAddToCart: vi.fn(),
      onToggleFav: vi.fn(),
      onCompare: vi.fn(),
      onAsk: vi.fn(),
      ...over,
    };
    function Harness() {
      const [ui, setUi] = useState<ShopUi>(EMPTY_SHOP_UI);
      return (
        <ShopPanel
          {...props}
          ui={ui}
          onUi={(patch) => setUi((u) => ({ ...u, ...patch }))}
        />
      );
    }
    render(<Harness />);
    return props;
  };
  const card = (name: RegExp) =>
    screen
      .getAllByRole("listitem")
      .find((li) => name.test(li.textContent || ""))!;

  it("lists the catalogue with prices, discounts, ratings and stock", () => {
    setup();
    const cards = within(
      screen.getByRole("list", { name: "Products" }),
    ).getAllByRole("listitem");
    expect(cards).toHaveLength(4);
    expect(screen.getByText("4 of 4 products")).toBeInTheDocument();
    expect(within(cards[1]).getByText("17% off")).toBeInTheDocument();
    expect(
      within(cards[1]).getByLabelText("Rated 4.5 out of 5 from 12 reviews"),
    ).toBeInTheDocument();
    expect(within(cards[0]).getByText("No reviews yet")).toBeInTheDocument();
    expect(
      within(cards[2]).getByRole("button", { name: "Buy now" }),
    ).toBeDisabled();
  });

  it("filters by category and search, and acts on a product", async () => {
    const p = setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole("radio", { name: /softeners/i }));
    expect(screen.getByText("2 of 4 products")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "View Home Softener 20 L" }),
    );
    expect(p.onView).toHaveBeenCalledWith("b");
    await user.click(
      within(card(/Home Softener/)).getByRole("button", { name: "Buy now" }),
    );
    expect(p.onBuy).toHaveBeenCalledWith("b");

    await user.click(screen.getByRole("radio", { name: /all/i }));
    await user.type(
      screen.getByRole("searchbox", { name: "Search products" }),
      "zzz",
    );
    expect(screen.getByText(/no products match/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("4 of 4 products")).toBeInTheDocument();
  });

  it("opens a quick look with details and reviews", async () => {
    const p = setup();
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Quick look: Home Softener 20 L" }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Quick look: Home Softener 20 L",
    });
    expect(within(dialog).getByText("Save ₹5,000 (17%)")).toBeInTheDocument();
    expect(within(dialog).getByText("20 L resin")).toBeInTheDocument();
    expect(within(dialog).getByText("1 year")).toBeInTheDocument();
    expect(
      within(dialog).getByText("Water feels soft, no more scale."),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Details" }));
    expect(p.onView).toHaveBeenCalledWith("b");
    // The rest of the shop dims behind it; the product stays above.
    expect(document.querySelector(".aq-store-scrim")).not.toBeNull();
    expect(card(/Home Softener 20 L/)).toHaveAttribute("data-peek", "true");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector(".aq-store-scrim")).toBeNull();
  });

  it("opens the quick look on hover with a mouse", () => {
    vi.useFakeTimers();
    const mm = vi
      .spyOn(window, "matchMedia")
      .mockReturnValue({ matches: true } as MediaQueryList);
    setup();
    act(() => {
      card(/Kent Grand Plus/).dispatchEvent(
        new MouseEvent("mouseover", { bubbles: true }),
      );
    });
    act(() => vi.advanceTimersByTime(400));
    expect(
      screen.getByRole("dialog", { name: "Quick look: Kent Grand Plus" }),
    ).toBeInTheDocument();
    mm.mockRestore();
  });

  it("compares products of one category from the tray", async () => {
    const p = setup();
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Compare Home Softener 20 L" }),
    );
    const tray = () => screen.getByRole("region", { name: "Compare tray" });
    expect(tray()).toHaveTextContent(/pick one more/i);
    expect(
      within(tray()).getByRole("button", { name: /compare 1/i }),
    ).toBeDisabled();
    // Another category starts over.
    await user.click(
      screen.getByRole("button", { name: "Compare Kent Grand Plus" }),
    );
    expect(tray()).toHaveTextContent(/now comparing purifiers/i);
    await user.click(
      screen.getByRole("button", { name: "Compare Home Softener 20 L" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Compare Compact Softener 10 L" }),
    );
    await user.click(
      within(tray()).getByRole("button", { name: /compare 2/i }),
    );
    expect(p.onCompare).toHaveBeenCalledWith(["b", "d"]);
  });

  it("compares a whole category in one go", async () => {
    const p = setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole("radio", { name: /softeners/i }));
    await user.click(
      screen.getByRole("button", { name: /compare 2 softeners side by side/i }),
    );
    expect(p.onCompare).toHaveBeenCalledWith(["b", "d"]);
  });

  it("shows placeholders while the catalogue loads", () => {
    setup({ loading: true });
    expect(screen.getByText("Loading the catalogue…")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Loading" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });
});
