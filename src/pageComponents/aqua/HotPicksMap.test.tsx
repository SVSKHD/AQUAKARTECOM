import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import * as storefront from "@/services/storefront";
import { DEMO_PRODUCTS } from "./catalogue";
import HotPicksMap from "./HotPicksMap";

vi.mock("@/services/storefront", () => ({ getDemandAreas: vi.fn() }));
const getDemandAreas = storefront.getDemandAreas as unknown as ReturnType<
  typeof vi.fn
>;

const products = new Map(DEMO_PRODUCTS.map((p) => [p.id, p]));
const d2 = DEMO_PRODUCTS.find((p) => p.id === "d2")!;

describe("HotPicksMap", () => {
  beforeEach(() => {
    getDemandAreas.mockReset().mockResolvedValue({
      days: 90,
      areas: [
        {
          area: "Kondapur",
          orders: 6,
          lastPurchasedAt: null,
          top: [
            {
              productName: d2.title,
              productId: "d2",
              productSlug: null,
              orders: 4,
            },
          ],
        },
        {
          area: "Gachibowli",
          orders: 2,
          lastPurchasedAt: null,
          top: [
            {
              productName: "Kent Iron Filter",
              productId: null,
              productSlug: null,
              orders: 2,
            },
          ],
        },
      ],
    });
  });

  it("maps the areas and lists the busiest area's hot picks", async () => {
    const onOpen = vi.fn();
    render(
      <HotPicksMap products={products} onOpen={onOpen} onClose={vi.fn()} />,
    );
    expect(
      await screen.findByRole("img", {
        name: /Heatmap of orders in Hyderabad/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("8 orders across 2 areas of Hyderabad"),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /Hot in Kondapur/ }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(d2.title) }));
    expect(onOpen).toHaveBeenCalledWith("d2");
  });

  it("switches area from the list, and starts on the customer's own", async () => {
    render(
      <HotPicksMap
        products={products}
        area="Gachibowli"
        onOpen={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(
      await screen.findByRole("heading", { name: /Hot in Gachibowli/ }),
    ).toHaveTextContent("Your area");
    fireEvent.click(screen.getByRole("button", { name: /^Kondapur/ }));
    expect(
      screen.getByRole("heading", { name: /Hot in Kondapur/ }),
    ).toBeInTheDocument();
  });

  it("asks again for another window, and says when there's nothing", async () => {
    render(
      <HotPicksMap products={products} onOpen={vi.fn()} onClose={vi.fn()} />,
    );
    await screen.findByRole("img");
    getDemandAreas.mockResolvedValueOnce(null);
    fireEvent.click(screen.getByRole("button", { name: "30 days" }));
    expect(getDemandAreas).toHaveBeenLastCalledWith({ days: 30 });
    expect(
      await screen.findByText(/Not enough orders to map in the last 30 days/),
    ).toBeInTheDocument();
  });
});
