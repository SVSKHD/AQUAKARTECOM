import { describe, expect, it } from "vitest";
import { matchLineProducts, parseDescription } from "./productInfo";

const kent = {
  _id: "p1",
  title: "Kent Automatic 8L | Aquakart",
  slug: "kent-auto-8l",
  brand: "Kent",
  price: 36000,
  ratings: 5,
  numberOfReviews: 1,
  category: { title: "Softeners" },
  subCategory: { title: "Automatic Softeners" },
  photos: [
    { delivery_url: "https://res.cloudinary.com/x/f_auto/a.jpg" },
    { secure_url: "https://res.cloudinary.com/x/b.jpg" },
    { url: "http://insecure.example/c.jpg" },
  ],
  description: `<div><p>Soft water for the whole home, with automatic regeneration so you never have to think about it.</p>
    <ul><li><h4>Resin Volume</h4><p>8 L</p></li><li><h4>Product Code</h4><p>111064</p></li></ul>
    <script>alert(1)</script></div>`,
};

describe("pay product info", () => {
  it("matches order lines to catalogue products by name", () => {
    const [hit, miss] = matchLineProducts(
      [{ name: "Kent Automatic 8L | Aquakart" }, { name: "Installation" }],
      { data: [kent, { _id: "p2", title: "Kent Iron Filter" }] },
    );
    expect(miss).toBeNull();
    expect(hit).toMatchObject({
      title: "Kent Automatic 8L | Aquakart",
      href: "/product/kent-auto-8l",
      brand: "Kent",
      category: "Softeners",
      subcategory: "Automatic Softeners",
      rating: 5,
      reviews: 1,
      // https only, optimised URL first
      photos: [
        "https://res.cloudinary.com/x/f_auto/a.jpg",
        "https://res.cloudinary.com/x/b.jpg",
      ],
      specs: [
        { label: "Resin Volume", value: "8 L" },
        { label: "Product Code", value: "111064" },
      ],
    });
    // The catalogue price is never carried over.
    expect(hit).not.toHaveProperty("price");
  });

  it("reads the description as plain text only", () => {
    const { intro } = parseDescription(kent.description);
    expect(intro).toMatch(/^Soft water for the whole home/);
    expect(intro).not.toMatch(/<|alert/);
  });

  it("returns no matches when the catalogue is unavailable", () => {
    expect(matchLineProducts([{ name: "Kent Automatic 8L" }], null)).toEqual([
      null,
    ]);
  });
});
