import { describe, expect, it } from "vitest";

import {
  getPublicInvoiceReference,
  getPublicProductClassification,
  isInternalInvoiceIdentifier,
} from "./generatePublicInvoicePdf";

describe("public invoice PDF privacy", () => {
  it("recognizes internal Mongo and UUID identifiers", () => {
    expect(isInternalInvoiceIdentifier("66b388e5aaee5040f671f5fe")).toBe(true);
    expect(
      isInternalInvoiceIdentifier("550e8400-e29b-41d4-a716-446655440000"),
    ).toBe(true);
    expect(isInternalInvoiceIdentifier("AQ-2026-101")).toBe(false);
  });

  it("never falls back to the database ID as the public invoice reference", () => {
    expect(
      getPublicInvoiceReference({
        id: "66b388e5aaee5040f671f5fe",
        invoice_no: "",
      }),
    ).toBe("Invoice");
    expect(getPublicInvoiceReference({ invoice_no: "AQ-2026-101" })).toBe(
      "AQ-2026-101",
    );
  });

  it("removes internal identifiers from product classifications", () => {
    expect(
      getPublicProductClassification({
        productCategory: "66b388e5aaee5040f671f5fe",
        productSubcategory: "Water softeners",
      }),
    ).toBe("Water softeners");
    expect(
      getPublicProductClassification({
        productCategory: "66b388e5aaee5040f671f5fe",
        productSubcategory: "6533f07c7986c193b3c620d2",
      }),
    ).toBe("");
  });
});
