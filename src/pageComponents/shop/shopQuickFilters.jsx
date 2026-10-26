import { useEffect, useState } from "react";
import {
  BadgePercent,
  Check,
  Copy,
  IndianRupee,
  PackageCheck,
  Star,
} from "lucide-react";
import { couponTitle, getActiveCoupons } from "@/pageComponents/aqua/coupons";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

// "₹500", "₹2.5k", "₹1.5L": short enough for a chip.
export const shortRupees = (value) =>
  value >= 100_000
    ? `₹${Number((value / 100_000).toFixed(1))}L`
    : value >= 1000
      ? `₹${Number((value / 1000).toFixed(1))}k`
      : `₹${value}`;

// Up to three round budget ceilings below the most expensive product.
export const budgetPresets = (max) =>
  [10_000, 25_000, 50_000, 100_000, 200_000]
    .filter((value) => value < max)
    .slice(0, 3);

const chipClass = (on) =>
  `inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-xs font-black transition ${
    on
      ? "border-slate-950 bg-slate-950 text-white"
      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
  }`;

// One tap per category, with how many products each has.
export const CategoryRail = ({
  categories,
  counts,
  total,
  value,
  onChange,
}) => (
  <div
    role="group"
    aria-label="Categories"
    className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
  >
    {[
      { label: "All", count: total },
      ...categories.map((label) => ({
        label,
        count: counts.get(label) || 0,
      })),
    ]
      .filter((c) => c.label === "All" || c.count > 0)
      .map((c) => {
        const on = value === c.label;
        return (
          <button
            key={c.label}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(c.label)}
            className={chipClass(on)}
          >
            {c.label === "All" ? "All products" : c.label}
            <span
              className={`rounded-full px-1.5 text-[10px] ${on ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}
            >
              {c.count}
            </span>
          </button>
        );
      })}
  </div>
);

// The filters people reach for most, as toggles: budget, stock, offers, rating.
export const QuickFilters = ({ filters, priceMax, onFilterChange }) => {
  const budgets = budgetPresets(priceMax);
  return (
    <div
      role="group"
      aria-label="Quick filters"
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
    >
      {budgets.map((value) => {
        const on = filters.price === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={on}
            onClick={() => onFilterChange("price", on ? null : value)}
            className={chipClass(on)}
          >
            <IndianRupee size={13} aria-hidden="true" />
            Under {shortRupees(value)}
          </button>
        );
      })}
      <button
        type="button"
        aria-pressed={filters.inStockOnly}
        onClick={() => onFilterChange("inStockOnly", !filters.inStockOnly)}
        className={chipClass(filters.inStockOnly)}
      >
        <PackageCheck size={14} aria-hidden="true" /> In stock
      </button>
      <button
        type="button"
        aria-pressed={filters.offersOnly}
        onClick={() => onFilterChange("offersOnly", !filters.offersOnly)}
        className={chipClass(filters.offersOnly)}
      >
        <BadgePercent size={14} aria-hidden="true" /> On offer
      </button>
      <button
        type="button"
        aria-pressed={filters.rating === 4}
        onClick={() => onFilterChange("rating", filters.rating === 4 ? 0 : 4)}
        className={chipClass(filters.rating === 4)}
      >
        <Star size={13} aria-hidden="true" /> 4★ &amp; up
      </button>
    </div>
  );
};

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

// Active store coupons as ticket cards. Checkout validates whichever code is used.
export const CouponStrip = ({ load = getActiveCoupons }) => {
  const [coupons, setCoupons] = useState([]);
  const [copied, setCopied] = useState("");
  useEffect(() => {
    const ctl = new AbortController();
    load(ctl.signal)
      .then((list) => setCoupons(Array.isArray(list) ? list : []))
      .catch(() => {});
    return () => ctl.abort();
  }, [load]);
  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(""), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  if (!coupons.length) return null;
  return (
    <section aria-label="Coupons" className="mb-5">
      <div className="mb-2 flex items-center gap-2 px-1">
        <BadgePercent
          size={15}
          className="text-emerald-700"
          aria-hidden="true"
        />
        <h2 className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
          Offers you can use today
        </h2>
      </div>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
        {coupons.map((c) => {
          const ends = c.endsAt ? new Date(c.endsAt) : null;
          const terms = [
            c.minimumOrder
              ? `Min. order ${formatCurrency(c.minimumOrder)}`
              : "",
            c.firstOrderOnly ? "First order only" : "",
            ends && !Number.isNaN(ends.getTime())
              ? `Ends ${ends.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
              : "",
          ].filter(Boolean);
          const isCopied = copied === c.code;
          return (
            <article
              key={c.code}
              className="relative flex min-h-[96px] w-[290px] shrink-0 snap-start overflow-hidden rounded-2xl border-[1.5px] border-dashed border-emerald-300 bg-white"
            >
              <span className="relative flex w-[84px] shrink-0 flex-col items-center justify-center gap-0.5 bg-gradient-to-br from-emerald-500 to-emerald-700 px-2 text-center text-white">
                <span className="text-lg font-black leading-none">
                  {c.discountType === "fixed"
                    ? shortRupees(c.discountValue)
                    : `${c.discountValue}%`}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.14em] opacity-85">
                  off
                </span>
                <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-white" />
                <span className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-white" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-3 pl-4 pr-3">
                <span className="self-start rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-emerald-800">
                  {c.code}
                </span>
                <span className="text-sm font-black leading-tight text-slate-950">
                  {couponTitle(c)}
                </span>
                {terms.length ? (
                  <span className="text-[11px] leading-snug text-slate-500">
                    {terms.join(" · ")}
                  </span>
                ) : null}
              </span>
              <button
                type="button"
                onClick={async () =>
                  (await copyText(c.code)) && setCopied(c.code)
                }
                aria-label={
                  isCopied ? `${c.code} copied` : `Copy code ${c.code}`
                }
                className="mr-3 self-center rounded-xl bg-emerald-50 p-2.5 text-emerald-800 transition hover:bg-emerald-100"
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
};
