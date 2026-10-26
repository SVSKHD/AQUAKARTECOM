import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  budgetPresets,
  CategoryRail,
  CouponStrip,
  QuickFilters,
  shortRupees,
} from "./shopQuickFilters";

const filters = {
  query: "",
  category: "All",
  subcategory: "All",
  brand: "All",
  price: null,
  inStockOnly: false,
  offersOnly: false,
  rating: 0,
};

describe("shop quick filters", () => {
  it("offers round budgets below the dearest product", () => {
    expect(budgetPresets(60_000)).toEqual([10_000, 25_000, 50_000]);
    expect(budgetPresets(9_000)).toEqual([]);
    expect(shortRupees(500)).toBe("₹500");
    expect(shortRupees(2_500)).toBe("₹2.5k");
    expect(shortRupees(150_000)).toBe("₹1.5L");
  });

  it("picks a category in one tap and hides empty ones", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryRail
        categories={["Purifiers", "Softeners", "Empty"]}
        counts={
          new Map([
            ["Purifiers", 3],
            ["Softeners", 5],
          ])
        }
        total={8}
        value="All"
        onChange={onChange}
      />,
    );
    expect(
      screen.getByRole("button", { name: /all products/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: /empty/i })).toBeNull();
    await user.click(screen.getByRole("button", { name: /softeners/i }));
    expect(onChange).toHaveBeenCalledWith("Softeners");
  });

  it("toggles budget, stock, offers and rating", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const { rerender } = render(
      <QuickFilters
        filters={filters}
        priceMax={60_000}
        onFilterChange={onFilterChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /under ₹25k/i }));
    expect(onFilterChange).toHaveBeenCalledWith("price", 25_000);
    await user.click(screen.getByRole("button", { name: /in stock/i }));
    expect(onFilterChange).toHaveBeenCalledWith("inStockOnly", true);
    await user.click(screen.getByRole("button", { name: /on offer/i }));
    expect(onFilterChange).toHaveBeenCalledWith("offersOnly", true);
    await user.click(screen.getByRole("button", { name: /4★/ }));
    expect(onFilterChange).toHaveBeenCalledWith("rating", 4);

    // Tapping an active chip clears it.
    rerender(
      <QuickFilters
        filters={{ ...filters, price: 25_000 }}
        priceMax={60_000}
        onFilterChange={onFilterChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /under ₹25k/i }));
    expect(onFilterChange).toHaveBeenLastCalledWith("price", null);
  });

  it("shows active coupons as cards and copies a code", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    const load = vi.fn(async () => [
      {
        code: "WATER10",
        description: "",
        discountType: "percentage",
        discountValue: 10,
        maxDiscount: 2000,
        minimumOrder: 15000,
        endsAt: "2099-01-31",
        firstOrderOnly: true,
        productIds: [],
        categoryIds: [],
      },
    ]);
    render(<CouponStrip load={load} />);
    expect(await screen.findByText("WATER10")).toBeInTheDocument();
    expect(screen.getByText("10% off up to ₹2,000")).toBeInTheDocument();
    expect(screen.getByText(/first order only/i)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /copy code water10/i }),
    );
    expect(writeText).toHaveBeenCalledWith("WATER10");
    expect(
      await screen.findByRole("button", { name: /water10 copied/i }),
    ).toBeInTheDocument();
  });

  it("renders nothing when there are no coupons", async () => {
    const load = vi.fn(async () => []);
    const { container } = render(<CouponStrip load={load} />);
    await vi.waitFor(() => expect(load).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
