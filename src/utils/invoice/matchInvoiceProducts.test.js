import { describe, expect, it } from "vitest";
import {
  enrichInvoiceProducts,
  findCatalogueProduct,
  mapCatalogueProducts,
  normalizeProductName,
} from "@/utils/invoice/matchInvoiceProducts";

const cataloguePayload = {
  data: {
    data: [
      {
        _id: "kent-excell-plus",
        title: "Kent Excell Plus",
        slug: "kent-excell-plus",
        category: { title: "Water Softeners" },
        subCategory: { title: "Automatic Softeners" },
        photos: [
          {
            secure_url: "https://cdn.aquakart.test/kent-excell-plus.png",
          },
        ],
      },
      {
        _id: "kent-automatic-50l",
        title: "Kent Automatic Water Softener 50L",
        photos: [{ secure_url: "https://cdn.aquakart.test/50l.png" }],
      },
      {
        _id: "kent-automatic-100l",
        title: "Kent Automatic Water Softener 100L | Aquakart",
        photos: [{ delivery_url: "https://cdn.aquakart.test/100l.png" }],
      },
    ],
  },
};

describe("invoice product catalogue matching", () => {
  it("normalizes storefront suffixes before comparing names", () => {
    expect(normalizeProductName("Kent Excell Plus | Aquakart")).toBe(
      "kent excell plus",
    );
  });

  it("maps nested catalogue payloads with category and photo metadata", () => {
    expect(mapCatalogueProducts(cataloguePayload)[0]).toMatchObject({
      id: "kent-excell-plus",
      title: "Kent Excell Plus",
      category: "Water Softeners",
      subcategory: "Automatic Softeners",
      image: "https://cdn.aquakart.test/kent-excell-plus.png",
    });
  });

  it("protects numeric model and capacity tokens from incorrect matches", () => {
    const catalogue = mapCatalogueProducts(cataloguePayload);
    expect(
      findCatalogueProduct("Kent Automatic Water Softener 100L", catalogue)?.id,
    ).toBe("kent-automatic-100l");
  });

  it("adds matched catalogue visuals while keeping invoice-owned values", () => {
    const invoice = {
      products: [
        {
          productName: "Kent Excell Plus | Aquakart",
          productImage: "",
          productCategory: "",
          productPrice: 58_910,
        },
      ],
    };

    expect(
      enrichInvoiceProducts(invoice, cataloguePayload).products[0],
    ).toMatchObject({
      catalogueProductId: "kent-excell-plus",
      productImage: "https://cdn.aquakart.test/kent-excell-plus.png",
      productCategory: "Water Softeners",
      productSubcategory: "Automatic Softeners",
      productPrice: 58_910,
    });
  });

  it("leaves unmatched invoice products untouched", () => {
    const product = { productName: "Completely custom installation package" };
    const enriched = enrichInvoiceProducts(
      { products: [product] },
      cataloguePayload,
    );
    expect(enriched.products[0]).toEqual(product);
  });
});
