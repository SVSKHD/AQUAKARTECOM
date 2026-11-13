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

  it("calculates invoice totals from GST-inclusive unit prices multiplied by quantity", () => {
    const result = priceUtils.getInvoiceAmounts({
      gst: false,
      products: [
        { productPrice: 1_000, productQuantity: 2 },
        { productPrice: 500, productQuantity: 3 },
      ],
    });

    expect(result.itemsTotal).toBe(3_500);
    expect(result.basePrice).toBe(2_966.1);
    expect(result.gstValue).toBe(533.9);
    expect(result.cgstValue).toBe(266.95);
    expect(result.sgstValue).toBe(266.95);
    expect(result.grandTotal).toBe(3_500);
  });

  it("formats Indian amount words", () => {
    expect(priceUtils.numberToWords(125_050.5)).toBe(
      "One Lakh Twenty Five Thousand and Fifty Rupees and Fifty Paise Only",
    );
  });

  it("works out GST on the offer price after line and overall discounts", () => {
    const result = priceUtils.getInvoiceAmounts({
      products: [
        { productPrice: 20_000, productQuantity: 1, productDiscount: 2_000 },
        { productPrice: 1_000, productQuantity: 2 },
      ],
      discount_amount: 1_000,
    });

    expect(result.originalTotal).toBe(22_000);
    expect(result.discountTotal).toBe(3_000);
    expect(result.hasDiscount).toBe(true);
    expect(result.grandTotal).toBe(19_000);
    expect(result.basePrice).toBe(16_101.69);
    expect(result.gstValue).toBe(2_898.31);
  });

  it("splits a discounted line into original, discount and offer", () => {
    const line = priceUtils.getLineAmounts({
      productPrice: 10_000,
      productQuantity: 2,
      productDiscount: 3_000,
    });

    expect(line).toMatchObject({
      originalTotal: 20_000,
      discount: 3_000,
      offerTotal: 17_000,
      offerUnitPrice: 8_500,
      hasDiscount: true,
    });
  });
});
