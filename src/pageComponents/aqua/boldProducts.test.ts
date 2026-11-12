import { describe, expect, it } from "vitest";
import { boldProducts } from "./replyProducts";
import type { Product } from "./types";

const cat = [
  { id: "a25", title: "Kent Automatic Water Softener 25" },
  { id: "a40", title: "Kent Automatic Water Softener 40" },
  { id: "iron", title: "Kent Iron Filter" },
  { id: "sand", title: "Kent Sandfilter" },
  { id: "sand100", title: "kent Automatic Sandfilter 100L" },
] as unknown as Product[];

// The backend contract: a bold catalogue name is a recommendation (a card).
describe("boldProducts", () => {
  it("cards only bold product names, in order, without duplicates", () => {
    const text =
      "For a villa: **Kent Automatic Water Softener 40** or **kent automatic  water softener 25 | Aquakart**. Not the **NRV**. Again **Kent Automatic Water Softener 40**.";
    expect(boldProducts(text, cat)).toEqual(["a40", "a25"]);
  });

  it("skips a span that loosely matches more than one product", () => {
    expect(boldProducts("**Kent Automatic Water Softener**", cat)).toEqual([]);
    expect(boldProducts("**Sandfilter**", cat)).toEqual([]);
    expect(boldProducts("**Iron Filter**", cat)).toEqual(["iron"]);
  });

  it("ignores names that aren't bold", () => {
    expect(boldProducts("Kent Iron Filter works well.", cat)).toEqual([]);
  });
});
