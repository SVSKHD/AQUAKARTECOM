import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { Flame } from "lucide-react";
import useCurrency from "@/utils/currency";
import {
  areaFromUser,
  demandHeadings,
  describeRawProduct,
  matchProduct,
  recentLine,
  trendingLine,
} from "@/utils/demandFeed";
import { useDemandFeed } from "./useDemandFeed";

const ROTATE_MS = 4000;

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);
  return reduced;
};

const ItemLink = ({ href, children, className = "" }) =>
  href ? (
    <Link
      href={href}
      className={`${className} underline-offset-4 hover:text-emerald-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500`}
    >
      {children}
    </Link>
  ) : (
    <span className={className}>{children}</span>
  );

// "Recently bought near you" + "Popular this month" for the listing pages.
// Optional: renders nothing when the feed fails or is empty, a small skeleton
// while it loads. `products` is the page's raw catalogue (for links/photos/prices).
export default function RecentlyBought({ products = [], className = "mb-5" }) {
  const user = useSelector((state) => state.userData?.user);
  const area = areaFromUser(user);
  const { status, result } = useDemandFeed({ area });
  const reduced = usePrefersReducedMotion();
  const { formatCurrencyINR } = useCurrency;

  const recent = useMemo(
    () =>
      (result?.feed?.recent || []).map((item) => ({
        item,
        view: describeRawProduct(matchProduct(item, products)),
      })),
    [result, products],
  );
  const trending = useMemo(
    () =>
      (result?.feed?.trending || []).map((item) => ({
        item,
        view: describeRawProduct(matchProduct(item, products)),
      })),
    [result, products],
  );

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    setIndex(0);
  }, [result]);
  useEffect(() => {
    if (reduced || paused || recent.length < 2) return undefined;
    const t = setInterval(
      () => setIndex((i) => (i + 1) % recent.length),
      ROTATE_MS,
    );
    return () => clearInterval(t);
  }, [reduced, paused, recent.length]);

  if (status === "loading")
    return (
      <div
        aria-hidden="true"
        className={`rounded-[1.75rem] border border-slate-200 bg-white p-4 ${className}`}
      >
        <div className="aqua-shimmer-block h-3 w-32 rounded-full" />
        <div className="aqua-shimmer-block mt-3 h-5 w-3/4 max-w-md rounded-xl" />
      </div>
    );
  if (status !== "ready") return null;

  const headings = demandHeadings(result);
  const days = result.feed.days;
  const now = Date.now();
  const current = recent[index % Math.max(recent.length, 1)];

  return (
    <section
      aria-label="Recent purchases"
      className={`grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] ${className}`}
    >
      {recent.length > 0 && (
        <div className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
            Live demand
          </span>
          <h2 className="mt-1 text-lg font-black tracking-[-0.04em] text-slate-950">
            {headings.recent}
          </h2>
          {reduced ? (
            <ul className="mt-3 space-y-2">
              {recent.slice(0, 3).map(({ item, view }, i) => (
                <li
                  key={`${item.productName}-${item.purchasedAt}-${i}`}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <ItemLink href={view?.href} className="min-w-0 break-words">
                    {recentLine(item, now)}
                  </ItemLink>
                </li>
              ))}
            </ul>
          ) : (
            current && (
              <div
                className="mt-3 flex min-h-[2.75rem] items-start gap-2 text-sm text-slate-700"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
              >
                <span className="relative mt-1.5 flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <ItemLink
                  href={current.view?.href}
                  className="line-clamp-2 min-w-0 break-words"
                >
                  {recentLine(current.item, now)}
                </ItemLink>
              </div>
            )
          )}
        </div>
      )}

      {trending.length > 0 && (
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-sm font-black text-slate-950">
            <Flame size={15} className="text-orange-500" aria-hidden="true" />
            {headings.trending}
          </h2>
          <ol className="mt-2 divide-y divide-slate-100">
            {trending.map(({ item, view }, i) => (
              <li
                key={item.productId || item.productSlug || item.productName}
                className="flex min-w-0 items-center gap-3 py-2"
              >
                <span className="w-4 shrink-0 text-xs font-black text-slate-400">
                  {i + 1}
                </span>
                {view?.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={view.photo}
                    alt=""
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded-xl border border-slate-100 bg-slate-50 object-contain"
                  />
                ) : null}
                <span className="min-w-0 flex-1">
                  <ItemLink
                    href={view?.href}
                    className="block truncate text-sm font-bold text-slate-900"
                  >
                    {view?.title || item.productName}
                  </ItemLink>
                  <span className="block text-xs text-slate-500">
                    {trendingLine(item, days)}
                  </span>
                </span>
                {view?.price ? (
                  <span className="shrink-0 text-sm font-black text-slate-950">
                    {formatCurrencyINR(view.price)}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
