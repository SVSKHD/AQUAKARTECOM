import { describe, expect, it } from "vitest";
import {
  otherProductQuestion,
  ownedProductQuestions,
  recommendProducts,
} from "./recommendProducts";

const raw = (id, title, extra = {}) => ({
  _id: id,
  title,
  slug: id,
  price: 10000,
  photos: [{ secure_url: `https://img/${id}.png` }],
  ...extra,
});

const catalogue = {
  data: [
    raw("soft-8", "Kent Automatic Water Softener 8L | Aquakart"),
    raw("soft-12", "Kent Automatic Water Softener 12L"),
    raw("ro-1", "Kent Grand RO Purifier"),
    raw("sand-1", "Kent Sand Filter", { stock: 0 }),
    raw("misc-1", "Shower Head", { photos: [] }),
    raw("free", "Free sample", { price: 0 }),
  ],
};

const invoice = {
  products: [
    {
      productName: "Kent Automatic Water Softener 8L",
      catalogueProductId: "soft-8",
      productCategory: "Softeners",
    },
  ],
};

describe("recommendProducts", () => {
  it("never suggests what was bought, nor unpriced products", () => {
    const ids = recommendProducts(invoice, catalogue).map((p) => p.id);
    expect(ids).not.toContain("soft-8");
    expect(ids).not.toContain("free");
  });

  it("puts complements to the purchase first, in-stock ahead of sold-out", () => {
    const ids = recommendProducts(invoice, catalogue).map((p) => p.id);
    expect(ids[0]).toBe("ro-1");
    expect(ids.indexOf("ro-1")).toBeLessThan(ids.indexOf("sand-1"));
    expect(ids.indexOf("soft-12")).toBeLessThan(ids.indexOf("misc-1"));
  });

  it("shapes cards with links, images and limit", () => {
    const [card] = recommendProducts(invoice, catalogue, 1);
    expect(card).toMatchObject({
      id: "ro-1",
      title: "Kent Grand RO Purifier",
      href: "/product/ro-1",
      image: "https://img/ro-1.png",
      price: 10000,
    });
    expect(recommendProducts(invoice, catalogue, 2)).toHaveLength(2);
  });

  it("handles a missing catalogue", () => {
    expect(recommendProducts(invoice, null)).toEqual([]);
  });
});

describe("questions", () => {
  it("asks about the product the customer owns", () => {
    const [q] = ownedProductQuestions({
      products: [{ productName: "Kent Softener 8L | Aquakart" }],
    });
    expect(q).toBe("How do I maintain my Kent Softener 8L?");
    expect(ownedProductQuestions({ products: [] }).length).toBeGreaterThan(0);
  });

  it("relates another product to the purchase", () => {
    expect(otherProductQuestion({ title: "Sand Filter" }, invoice)).toBe(
      "Tell me about Sand Filter. Would it work well with my Kent Automatic Water Softener 8L?",
    );
  });
});
