import { useMemo } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { ArrowRight, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import AquaUserDashbordLayout from "./layout/layout";
import {
  CartLineItem,
  formatINR,
  getUnitPrice,
  getUnitSaving,
} from "./layout/cards/cartCard";

const AquaUserCartPageComponent = () => {
  const cartData = useSelector((state) => state.cartData);
  const cart = useMemo(
    () => (Array.isArray(cartData) ? cartData : []),
    [cartData],
  );

  const summary = useMemo(
    () =>
      cart.reduce(
        (acc, item) => {
          const qty = item?.quantity || 1;
          acc.units += qty;
          acc.mrp += (getUnitPrice(item) + getUnitSaving(item)) * qty;
          acc.saving += getUnitSaving(item) * qty;
          acc.total += getUnitPrice(item) * qty;
          return acc;
        },
        { units: 0, mrp: 0, saving: 0, total: 0 },
      ),
    [cart],
  );

  if (cart.length === 0) {
    return (
      <AquaUserDashbordLayout>
        <div className="flex flex-col items-center rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-700">
            <ShoppingCart className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-black text-slate-950">
            Your cart is empty
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Softeners, purifiers and filters you add will show up here, ready
            for checkout.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              href="/shop"
              className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Browse products
            </Link>
            <Link
              href="/dashboard/fav"
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              View saved items
            </Link>
          </div>
        </div>
      </AquaUserDashbordLayout>
    );
  }

  return (
    <AquaUserDashbordLayout>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-label="Cart items" className="space-y-3">
          <p className="text-sm font-semibold text-slate-500">
            {summary.units} {summary.units === 1 ? "item" : "items"}
          </p>
          {cart.map((item, index) => (
            <CartLineItem key={item?._id || index} product={item} />
          ))}
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5 lg:sticky lg:top-4">
          <h2 className="text-base font-black text-slate-950">Order summary</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>
                Price ({summary.units} {summary.units === 1 ? "item" : "items"})
              </dt>
              <dd>{formatINR(summary.mrp)}</dd>
            </div>
            {summary.saving > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Discount</dt>
                <dd>−{formatINR(summary.saving)}</dd>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <dt>Delivery</dt>
              <dd className="text-slate-500">Calculated at checkout</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-black text-slate-950">
              <dt>Total</dt>
              <dd>{formatINR(summary.total)}</dd>
            </div>
          </dl>
          {summary.saving > 0 && (
            <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
              You save {formatINR(summary.saving)} on this order.
            </p>
          )}
          <Link
            href="/checkout"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
          >
            Proceed to checkout
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/shop"
            className="mt-2 inline-flex w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Continue shopping
          </Link>
          <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Secure payment via PhonePe
            </li>
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-emerald-600" />
              Delivery and installation support
            </li>
          </ul>
        </aside>
      </div>
    </AquaUserDashbordLayout>
  );
};

export default AquaUserCartPageComponent;
