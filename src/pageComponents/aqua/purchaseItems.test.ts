import { describe, expect, it } from "vitest";
import { matchPurchaseItem, purchaseLines } from "./purchaseItems";
import type { Product } from "./types";

const prod = (id: string, title: string) => ({ id, title }) as Product;
const catalogue = [
  prod("sand", "Kent Sandfilter"),
  prod("s25", "Kent Automatic Water Softener 25"),
  prod("s40", "Kent Automatic Water Softener 40"),
  prod("kent", "Kent"),
];

describe("purchaseItems", () => {
  it("matches invoice names to catalogue products despite case and suffixes", () => {
    expect(matchPurchaseItem("KENT SANDFILTER | Aquakart", catalogue)?.id).toBe(
      "sand",
    );
    expect(
      matchPurchaseItem(
        "Kent Automatic Water Softener 40 (with install)",
        catalogue,
      )?.id,
    ).toBe("s40");
  });

  it("doesn't guess from short, generic words", () => {
    expect(matchPurchaseItem("Kent", catalogue)?.id).toBe("kent"); // exact is fine
    expect(matchPurchaseItem("Kent RO service visit", catalogue)).toBeNull();
    expect(matchPurchaseItem("", catalogue)).toBeNull();
  });

  it("lists the names the API sends and counts the rest", () => {
    const { lines, more } = purchaseLines(
      { items: ["Kent Sandfilter | Aquakart", "Installation"], itemCount: 4 },
      catalogue,
    );
    expect(lines.map((l) => [l.name, l.product?.id ?? null])).toEqual([
      ["Kent Sandfilter", "sand"],
      ["Installation", null],
    ]);
    expect(more).toBe(2);
  });

  it("prefers full lines (qty, price) when the API sends them", () => {
    const { lines, more } = purchaseLines(
      {
        items: ["Kent Sandfilter"],
        itemCount: 2,
        lines: [
          { name: "Kent Sandfilter", qty: 1, price: 20000 },
          { name: "Kent Automatic Water Softener 25", qty: 2, price: 71000 },
        ],
      },
      catalogue,
    );
    expect(lines.map((l) => [l.product?.id, l.qty, l.price])).toEqual([
      ["sand", 1, 20000],
      ["s25", 2, 71000],
    ]);
    expect(more).toBe(0);
  });
});
