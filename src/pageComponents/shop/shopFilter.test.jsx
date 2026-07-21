import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ShopFiltersPanel from "./shopFilter";

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

const renderPanel = (onFilterChange = vi.fn()) => {
  render(
    <ShopFiltersPanel
      filters={filters}
      onFilterChange={onFilterChange}
      categoryOptions={["Softeners", "Purifiers"]}
      subcategoryOptions={["Automatic"]}
      brandOptions={["Kent"]}
      priceRange={{ min: 5_000, max: 50_000, value: 50_000 }}
    />,
  );
  return onFilterChange;
};

describe("ShopFiltersPanel", () => {
  it("updates search and quick purchase filters", async () => {
    const user = userEvent.setup();
    const onFilterChange = renderPanel();

    await user.type(
      screen.getByPlaceholderText(/search name, brand or use/i),
      "Kent",
    );
    expect(onFilterChange).toHaveBeenLastCalledWith("query", "t");

    await user.click(screen.getByRole("switch", { name: /ready to buy/i }));
    expect(onFilterChange).toHaveBeenCalledWith("inStockOnly", true);

    await user.click(screen.getByRole("switch", { name: /best offers/i }));
    expect(onFilterChange).toHaveBeenCalledWith("offersOnly", true);
  });

  it("selects categories and changes the budget ceiling", async () => {
    const user = userEvent.setup();
    const onFilterChange = renderPanel();

    await user.click(screen.getByRole("button", { name: "Softeners" }));
    expect(onFilterChange).toHaveBeenCalledWith("category", "Softeners");

    fireEvent.change(screen.getByRole("slider"), {
      target: { value: "25000" },
    });
    expect(onFilterChange).toHaveBeenCalledWith("price", 25_000);
  });

  it("supports a minimum customer rating", async () => {
    const user = userEvent.setup();
    const onFilterChange = renderPanel();

    await user.click(screen.getByRole("button", { name: /customer rating/i }));
    await user.click(screen.getByRole("button", { name: /4 stars & above/i }));

    expect(onFilterChange).toHaveBeenCalledWith("rating", 4);
  });
});
