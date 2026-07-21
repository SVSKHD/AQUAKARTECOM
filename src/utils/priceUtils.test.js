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

  it("uses quantity when calculating invoice totals", () => {
    const result = priceUtils.getInvoiceAmounts({
      gst: false,
      products: [
        { productPrice: 1_000, productQuantity: 2 },
        { productPrice: 500, productQuantity: 3 },
      ],
    });

    expect(result.itemsTotal).toBe(3_500);
    expect(result.basePrice).toBe(3_500);
    expect(result.gstValue).toBe(0);
    expect(result.cgstValue).toBe(0);
    expect(result.sgstValue).toBe(0);
    expect(result.grandTotal).toBe(3_500);
  });

  it("formats Indian amount words", () => {
    expect(priceUtils.numberToWords(125_050.5)).toBe(
      "One Lakh Twenty Five Thousand and Fifty Rupees and Fifty Paise Only",
    );
  });
});
