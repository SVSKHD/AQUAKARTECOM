import { describe, expect, it } from "vitest";
import {
  bestCoupon,
  cartCouponOffers,
  couponTitle,
  type ActiveCoupon,
} from "./coupons";
import type { Product } from "./types";

const product = (over: Partial<Product> = {}): Product => ({
  id: "p1",
  title: "Kent Automatic 8L",
  brand: "Kent",
  cat: "softener",
  price: 30000,
  mrp: 0,
  photos: [],
  inStock: true,
  stock: "In stock",
  desc: "",
  raw: { category: { _id: "cat1" } },
  ...over,
});

const coupon = (over: Partial<ActiveCoupon> = {}): ActiveCoupon => ({
  code: "C",
  description: "",
  discountType: "percentage",
  discountValue: 10,
  maxDiscount: null,
  minimumOrder: 0,
  endsAt: "2099-01-01",
  firstOrderOnly: false,
  productIds: [],
  categoryIds: [],
  ...over,
});

describe("bestCoupon", () => {
  it("picks the coupon that saves the most, honouring the cap", () => {
    const pick = bestCoupon(product(), [
      coupon({ code: "PCT20", discountValue: 20, maxDiscount: 2000 }),
      coupon({ code: "FLAT3K", discountType: "fixed", discountValue: 3000 }),
      coupon({ code: "PCT5", discountValue: 5 }),
    ]);
    expect(pick).toMatchObject({ code: "FLAT3K", save: 3000 });
  });

  it("skips coupons for other products, categories or a higher minimum order", () => {
    const pick = bestCoupon(product(), [
      coupon({ code: "OTHER", discountValue: 50, productIds: ["p2"] }),
      coupon({ code: "CAT", discountValue: 40, categoryIds: ["cat2"] }),
      coupon({ code: "MIN", discountValue: 30, minimumOrder: 50000 }),
      coupon({ code: "OK", discountValue: 10, categoryIds: ["cat1"] }),
    ]);
    expect(pick).toMatchObject({ code: "OK", save: 3000 });
  });

  it("returns null when nothing applies", () => {
    expect(bestCoupon(product(), [])).toBeNull();
  });
});

describe("cartCouponOffers", () => {
  const lines = [{ id: "p1", category: "cat1" }];
  it("ranks the coupons that apply by saving, then the rest with a reason", () => {
    const offers = cartCouponOffers(
      [
        coupon({ code: "SMALL", discountValue: 5 }),
        coupon({ code: "BIG", discountValue: 15, maxDiscount: 4000 }),
        coupon({ code: "MIN", minimumOrder: 50000 }),
        coupon({ code: "OTHER", productIds: ["p9"] }),
        coupon({
          code: "CAT",
          categoryIds: ["cat1"],
          discountType: "fixed",
          discountValue: 1000,
        }),
      ],
      lines,
      30000,
    );
    expect(offers.map((o) => [o.coupon.code, o.save, o.eligible])).toEqual([
      ["BIG", 4000, true],
      ["SMALL", 1500, true],
      ["CAT", 1000, true],
      ["MIN", 3000, false],
      ["OTHER", 3000, false],
    ]);
    expect(offers.find((o) => o.coupon.code === "MIN")?.note).toBe(
      "Add ₹20,000 more",
    );
    expect(offers.find((o) => o.coupon.code === "OTHER")?.note).toBe(
      "For other products",
    );
  });

  it("titles a coupon by what it takes off", () => {
    expect(couponTitle(coupon({ discountValue: 10, maxDiscount: 2000 }))).toBe(
      "10% off up to ₹2,000",
    );
    expect(
      couponTitle(
        coupon({ discountType: "fixed", discountValue: 500, code: "FLAT" }),
      ),
    ).toBe("₹500 off with FLAT");
  });
});
