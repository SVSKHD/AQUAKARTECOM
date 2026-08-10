import { describe, expect, it } from "vitest";
import priceUtils from "@/utils/priceUtils";

describe("priceUtils", () => {
  it("splits GST-inclusive totals into matching CGST and SGST values", () => {
    const result = priceUtils.getGSTBreakdown(15_000);

    expect(result).toEqual({
      grossPrice: 15_000,
      basePrice: 12_711.86,
      gstValue: 2_288.14,
      cgstValue: 1_144.07,
      sgstValue: 1_144.07,
    });
  });

  it("assigns the rounding remainder to SGST", () => {
    const result = priceUtils.getGSTBreakdown(100);

    expect(result.cgstValue).toBe(7.62);
    expect(result.sgstValue).toBe(7.63);
    expect(result.cgstValue + result.sgstValue).toBe(result.gstValue);
  });

  it("calculates invoice totals from GST-inclusive product prices without quantity", () => {
    const result = priceUtils.getInvoiceAmounts({
      gst: false,
      products: [
        { productPrice: 1_000, productQuantity: 2 },
        { productPrice: 500, productQuantity: 3 },
      ],
    });

    expect(result.itemsTotal).toBe(1_500);
    expect(result.basePrice).toBe(1_271.19);
    expect(result.gstValue).toBe(228.81);
    expect(result.cgstValue).toBe(114.4);
    expect(result.sgstValue).toBe(114.41);
    expect(result.grandTotal).toBe(1_500);
  });

  it("formats Indian amount words", () => {
    expect(priceUtils.numberToWords(125_050.5)).toBe(
      "One Lakh Twenty Five Thousand and Fifty Rupees and Fifty Paise Only",
    );
  });
});
