import dayjs from "dayjs";

// Helpers for the "Recently bought" demand feed (GET /storefront/recent-purchases).
// The feed carries product names, a coarse locality and an hour-rounded time:
// prices and photos always come from the catalogue, never from the feed.

// Same words the backend drops when it picks a locality out of an address.
const REGION_WORDS = new Set([
  "hyderabad",
  "secunderabad",
  "telangana",
  "india",
  "andhra pradesh",
  "ap",
  "ts",
  "tg",
  "rangareddy",
  "ranga reddy",
  "rangareddy district",
  "medchal",
  "medchal malkajgiri",
  "sangareddy",
  "hyderabad district",
]);

const titleCase = (value) =>
  value.toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

// A saved address (object or text) -> its locality, e.g. "Kondapur".
// Mirrors the backend's areaFromAddress, except a bare city gives null: the
// whole city isn't "near you".
export const localityFromAddress = (address) => {
  if (!address) return null;
  const text =
    typeof address === "string"
      ? address
      : [address.street, address.city, address.state, address.postalCode]
          .filter(Boolean)
          .join(", ");
  const segments = String(text)
    .split(/[,\n]/)
    .map((s) =>
      s
        .replace(/\b\d{3}\s?\d{3}\b/g, "")
        .replace(/\s+/g, " ")
        .replace(/^[\s\-.:]+|[\s\-.:]+$/g, ""),
    )
    .filter(Boolean)
    .filter((s) => !REGION_WORDS.has(s.toLowerCase()));
  const locality = segments[segments.length - 1];
  if (
    locality &&
    locality.length <= 30 &&
    /[a-z]/i.test(locality) &&
    !/\d/.test(locality) &&
    !/\b(flat|plot|h\.?\s?no|door|floor|road no|street no)\b/i.test(locality)
  )
    return titleCase(locality);
  return null;
};

// The signed-in shopper's locality from their selected or first saved address.
export const areaFromUser = (user) =>
  localityFromAddress(user?.selectedAddress || user?.addresses?.[0]);

// "3 hours ago". Feed times are rounded down to the hour, so anything under
// an hour reads "in the last hour" rather than a too-precise "just now".
export const relativeTime = (iso, now = Date.now()) => {
  const then = iso ? dayjs(iso) : null;
  if (!then || !then.isValid()) return "";
  const hours = dayjs(now).diff(then, "hour");
  if (hours < 1) return "in the last hour";
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = dayjs(now).diff(then, "day");
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = dayjs(now).diff(then, "month");
  return `${months <= 1 ? "a month" : `${months} months`} ago`;
};

// Invoice product names can carry the site name for SEO ("Kent Automatic 8L | Aquakart").
export const cleanProductName = (name) =>
  String(name || "")
    .replace(/\s*\|\s*aquakart\s*$/i, "")
    .trim();

// "Kent Softener · bought in Gachibowli · 3 hours ago" (location left out when null).
export const recentLine = (item, now = Date.now()) =>
  [
    item.quantity > 1
      ? `${item.quantity} × ${cleanProductName(item.productName)}`
      : cleanProductName(item.productName),
    item.area ? `bought in ${item.area}` : "bought",
    relativeTime(item.purchasedAt, now),
  ]
    .filter(Boolean)
    .join(" · ");

// "Bought 12 times in the last 30 days".
export const trendingLine = (item, days) => {
  const n = Number(item?.orders) || 0;
  const times = n === 1 ? "once" : `${n} times`;
  return `Bought ${times} in the last ${days} days`;
};

// The catalogue product a feed item refers to (by id, then slug), or null.
// Works for raw API products (_id) and the Aqua catalogue (id).
export const matchProduct = (item, products) => {
  if (!item || !Array.isArray(products) || !products.length) return null;
  const id = item.productId ? String(item.productId) : "";
  const slug = item.productSlug ? String(item.productSlug).toLowerCase() : "";
  return (
    (id && products.find((p) => String(p?._id ?? p?.id ?? "") === id)) ||
    (slug &&
      products.find((p) => String(p?.slug || "").toLowerCase() === slug)) ||
    null
  );
};

// Is this product in the feed's trending list?
export const trendingEntryFor = (product, feed) =>
  (feed?.trending || []).find((t) => matchProduct(t, [product])) || null;

// Fetches the feed for the shopper's area; when that area has no recent
// purchases, fetches again for all areas. `nearby` says which one came back.
// Resolves null on failure (the feed is optional and never shows an error).
export const loadDemandFeed = async (
  fetchFeed,
  { area, limit, days } = {},
  config = {},
) => {
  try {
    if (area) {
      const local = await fetchFeed({ area, limit, days }, config);
      if (local?.recent?.length) return { feed: local, nearby: true };
    }
    const all = await fetchFeed({ limit, days }, config);
    return all ? { feed: all, nearby: false } : null;
  } catch {
    return null;
  }
};

export const demandHeadings = (result) => {
  const days = result?.feed?.days || 30;
  return {
    recent: result?.nearby
      ? "Recently bought near you"
      : "Recently bought on Aquakart",
    trending: result?.nearby
      ? `Popular in ${result.feed.area}`
      : days === 30
        ? "Popular this month"
        : "In demand",
  };
};

// Listing-page view of a raw catalogue product: link, first photo, sale price.
export const describeRawProduct = (p) => {
  if (!p) return null;
  const photo = Array.isArray(p.photos) ? p.photos[0] : null;
  const sale =
    p.discountPriceStatus && Number(p.discountPrice) > 0
      ? Number(p.discountPrice)
      : Number(p.price);
  return {
    href: p.slug ? `/product/${p.slug}` : p._id ? `/product/${p._id}` : null,
    photo:
      typeof photo === "string"
        ? photo
        : photo?.delivery_url || photo?.secure_url || photo?.url || null,
    price: Number.isFinite(sale) && sale > 0 ? sale : null,
    title: String(p.title || "").replace(/\s*\|\s*aquakart\s*$/i, ""),
  };
};
