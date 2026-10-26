// Active store coupons (GET /coupons/active) and the one that saves the most
// on a product. Only a hint: checkout re-validates whichever code is applied.
import axios from "axios";
import type { Product } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.aquakart.co.in/v1";

export type ActiveCoupon = {
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscount: number | null;
  minimumOrder: number;
  endsAt: string;
  firstOrderOnly: boolean;
  productIds: string[];
  categoryIds: string[];
};

export type CouponPick = { code: string; save: number; label: string };

export const getActiveCoupons = async (
  signal?: AbortSignal,
): Promise<ActiveCoupon[]> => {
  const res = await axios.get(`${API_BASE}/coupons/active`, {
    signal,
    timeout: 5000,
  });
  return Array.isArray(res?.data?.data) ? res.data.data : [];
};

export const categoryId = (p: Product) => {
  const c = p.raw?.category as { _id?: string } | string | undefined;
  return c ? String(typeof c === "string" ? c : c._id || "") : "";
};

export const couponSaving = (c: ActiveCoupon, price: number) => {
  const raw =
    c.discountType === "fixed"
      ? c.discountValue
      : (price * c.discountValue) / 100;
  return Math.max(0, Math.round(Math.min(raw, c.maxDiscount ?? raw, price)));
};

// "10% off up to ₹2,000", or the description for a flat amount.
export const couponTitle = (c: ActiveCoupon) =>
  c.discountType === "fixed"
    ? c.description ||
      `₹${c.discountValue.toLocaleString("en-IN")} off with ${c.code}`
    : `${c.discountValue}% off${c.maxDiscount ? ` up to ₹${c.maxDiscount.toLocaleString("en-IN")}` : ""}`;

// The coupon with the biggest saving on one unit of this product, if any applies.
export function bestCoupon(
  p: Product,
  coupons: ActiveCoupon[],
): CouponPick | null {
  const cat = categoryId(p);
  let best: CouponPick | null = null;
  for (const c of coupons) {
    if (c.productIds.length && !c.productIds.includes(p.id)) continue;
    if (c.categoryIds.length && !c.categoryIds.includes(cat)) continue;
    if (p.price < (c.minimumOrder || 0)) continue;
    const save = couponSaving(c, p.price);
    if (save > 0 && (!best || save > best.save))
      best = {
        code: c.code,
        save,
        label:
          c.discountType === "fixed"
            ? c.description || `Flat off with ${c.code}`
            : couponTitle(c),
      };
  }
  return best;
}

// ---------- checkout: every active coupon against the whole cart ----------
// Mirrors the server's rules: the discount is on the subtotal, a product or
// category restriction needs one matching item, and the minimum is on the
// subtotal. Per-account limits (first order, uses left) are only known to the
// server, so the quote still has the final say.
export type CartLine = { id: string; category?: string };
export type CartCouponOffer = {
  coupon: ActiveCoupon;
  save: number;
  eligible: boolean;
  // Why it doesn't apply yet, in words ("Add ₹1,200 more"), or "".
  note: string;
};

export function cartCouponOffers(
  coupons: ActiveCoupon[],
  lines: CartLine[],
  subtotal: number,
): CartCouponOffer[] {
  return coupons
    .map((c) => {
      const save = couponSaving(c, subtotal);
      const short = Math.max(0, (c.minimumOrder || 0) - subtotal);
      const productOk =
        !c.productIds.length || lines.some((l) => c.productIds.includes(l.id));
      const categoryOk =
        !c.categoryIds.length ||
        lines.some((l) => !!l.category && c.categoryIds.includes(l.category));
      const note =
        !productOk || !categoryOk
          ? "For other products"
          : short > 0
            ? `Add ₹${short.toLocaleString("en-IN")} more`
            : "";
      return { coupon: c, save, eligible: !note && save > 0, note };
    })
    .sort(
      (x, y) =>
        Number(y.eligible) - Number(x.eligible) ||
        y.save - x.save ||
        x.coupon.code.localeCompare(y.coupon.code),
    );
}
