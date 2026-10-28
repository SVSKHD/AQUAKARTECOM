import { Flame } from "lucide-react";
import { trendingEntryFor, trendingLine } from "@/utils/demandFeed";
import { useDemandFeed } from "./useDemandFeed";

// "In demand" on a product page when the product is among the site-wide
// most-bought (the feed without an area). Renders nothing otherwise.
export default function InDemandBadge({ product }) {
  const { status, result } = useDemandFeed({ enabled: Boolean(product) });
  const entry =
    status === "ready" && product
      ? trendingEntryFor(product, result.feed)
      : null;
  if (!entry) return null;
  const detail = trendingLine(entry, result.feed.days);
  return (
    <span
      title={detail}
      className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700 ring-1 ring-orange-200"
    >
      <Flame size={14} aria-hidden="true" />
      In demand
      <span className="sr-only">: {detail}</span>
    </span>
  );
}
