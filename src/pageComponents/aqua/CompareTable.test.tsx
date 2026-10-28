import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CompareTable from "./CompareTable";
import type { Product } from "./types";

const base = (o: Partial<Product>): Product => ({
  id: "x",
  title: "X",
  brand: "Kent",
  cat: "softener",
  price: 1000,
  mrp: 0,
  photos: [],
  inStock: true,
  stock: "In stock",
  desc: "",
  ...o,
});

// Shapes taken from the live catalogue: specs only in description facts.
const washing = base({
  id: "w",
  title: "kent Washing Water Softener",
  price: 5500,
  raw: { subCategory: { title: "Manual-Softeners" } },
});
const bathroom = base({
  id: "b",
  title: "Kent Bathroom Water Softener 5.5L",
  price: 14500,
  raw: { subCategory: { title: "Manual-Softeners" } },
  about: [
    {
      kind: "facts",
      items: [
        { label: "Resin Volume", value: "5.5 L" },
        {
          label: "Water Softened Before Regeneration",
          value: "1200 L (Water TDS 500 ppm)",
        },
        { label: "Dimensions(mm)", value: "380 (L) x 220 (W) x 890 (H)" },
        { label: "Product Code", value: "111064" },
      ],
    },
  ],
});
const auto = base({
  id: "a",
  title: "Kent Automatic 8L",
  price: 31500,
  raw: { subCategory: { title: "Automatic Softeners" } },
  about: [
    {
      kind: "facts",
      items: [
        { label: "Resin Volume", value: "8 L" },
        { label: "Flow Rate", value: "1200 L/H" },
        { label: "Dimensions (mm)", value: "300 x 200 x 600" },
        { label: "Mounting", value: "Wall Mountable" },
      ],
    },
  ],
});

const rowLabels = () =>
  screen.getAllByRole("rowheader").map((r) => r.textContent);

describe("CompareTable", () => {
  it("builds rows from the facts the products have and drops empty ones", () => {
    render(
      <CompareTable products={[washing, bathroom, auto]} onOpen={() => {}} />,
    );
    const labels = rowLabels();
    expect(labels).toEqual([
      "Price",
      "Type",
      "Treats",
      "Brand",
      "Capacity",
      "Flow rate",
      "Water softened before regeneration",
      "Mounting",
      "Dimensions (mm)",
      "Availability",
    ]);
    // Rows nobody has are gone; noise facts are skipped.
    expect(labels).not.toContain("Household");
    expect(labels).not.toContain("Warranty");
    expect(labels).not.toContain("Product Code");
  });

  it("merges label variants and shows a dash for a single gap", () => {
    render(
      <CompareTable products={[washing, bathroom, auto]} onOpen={() => {}} />,
    );
    const dims = screen
      .getAllByRole("row")
      .find((r) => r.textContent?.startsWith("Dimensions"))!;
    const cells = within(dims)
      .getAllByRole("cell")
      .map((c) => c.textContent);
    expect(cells).toEqual([
      "—",
      "380 (L) x 220 (W) x 890 (H)",
      "300 x 200 x 600",
    ]);
  });

  it("shows type from the sub-category, marks the lowest price and explains missing specs", () => {
    render(
      <CompareTable products={[washing, bathroom, auto]} onOpen={() => {}} />,
    );
    const type = screen
      .getAllByRole("row")
      .find((r) => r.textContent?.startsWith("Type"))!;
    expect(
      within(type)
        .getAllByRole("cell")
        .map((c) => c.textContent),
    ).toEqual(["Manual", "Manual", "Automatic"]);
    const treats = screen
      .getAllByRole("row")
      .find((r) => r.textContent?.startsWith("Treats"))!;
    expect(
      within(treats)
        .getAllByRole("cell")
        .map((c) => c.textContent),
    ).toEqual(["Washing machine only", "One bathroom", "One bathroom"]);
    const price = screen
      .getAllByRole("row")
      .find((r) => r.textContent?.startsWith("Price"))!;
    expect(within(price).getAllByRole("cell")[0]).toHaveTextContent("Lowest");
    expect(
      screen.getByText(/kent Washing Water Softener doesn't list specs yet/),
    ).toBeInTheDocument();
  });
});

describe("CompareTable spec overflow", () => {
  it("shows the first 6 specs and the rest behind a toggle", async () => {
    const { fireEvent } = await import("@testing-library/react");
    const facts = Array.from({ length: 9 }, (_, i) => ({
      label: `Spec ${i + 1}`,
      value: `v${i + 1}`,
    }));
    const p = base({
      id: "p",
      title: "P",
      about: [{ kind: "facts", items: facts }],
    });
    render(
      <CompareTable
        products={[p, base({ id: "q", title: "Q" })]}
        onOpen={() => {}}
      />,
    );
    expect(rowLabels().filter((l) => l?.startsWith("Spec"))).toHaveLength(6);
    fireEvent.click(screen.getByRole("button", { name: "Show 3 more specs" }));
    expect(rowLabels().filter((l) => l?.startsWith("Spec"))).toHaveLength(9);
    expect(
      screen.getByRole("button", { name: "Show fewer specs" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("gives every product the same View and Buy now actions", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onBuy = vi.fn();
    const soldOut = { ...auto, inStock: false, stock: "Out of stock" };
    render(
      <CompareTable
        products={[washing, bathroom, soldOut]}
        onOpen={onOpen}
        onBuy={onBuy}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: `View ${bathroom.title}` }),
    );
    expect(onOpen).toHaveBeenCalledWith("b");
    await user.click(
      screen.getByRole("button", { name: `Buy ${washing.title}` }),
    );
    expect(onBuy).toHaveBeenCalledWith("w");
    expect(
      screen.getByRole("button", { name: `Buy ${soldOut.title}` }),
    ).toBeDisabled();
  });
});
