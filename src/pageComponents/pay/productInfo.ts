// Product photos and details for the /pay order lines, matched by name from
// the storefront catalogue (the same matching as the invoice page). Prices are
// deliberately left out: the order's agreed price is the only one shown.
import {
  findCatalogueProduct,
  mapCatalogueProducts,
} from "@/utils/invoice/matchInvoiceProducts";

export type ProductSpec = { label: string; value: string };
export type ProductInfo = {
  id: string;
  title: string;
  href: string | null;
  brand: string;
  category: string;
  subcategory: string;
  photos: string[];
  rating: number | null;
  reviews: number | null;
  intro: string;
  specs: ProductSpec[];
};

type Raw = Record<string, unknown>;

const text = (v: unknown) =>
  typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
const titleOf = (v: unknown) =>
  v && typeof v === "object"
    ? text((v as Raw).title ?? (v as Raw).name)
    : text(v);
const count = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const catalogueArray = (payload: unknown, depth = 0): Raw[] => {
  if (depth > 3 || !payload) return [];
  if (Array.isArray(payload)) return payload as Raw[];
  if (typeof payload !== "object") return [];
  const p = payload as Raw;
  if (Array.isArray(p.products)) return p.products as Raw[];
  if (Array.isArray(p.data)) return p.data as Raw[];
  return catalogueArray(p.data ?? p.result, depth + 1);
};

// Optimised Cloudinary URLs first; at most 6 photos.
export function photosOf(raw: Raw): string[] {
  const list = Array.isArray(raw.photos) ? raw.photos : [];
  const urls = list
    .map((p) =>
      typeof p === "string"
        ? p
        : p && typeof p === "object"
          ? text((p as Raw).delivery_url) ||
            text((p as Raw).secure_url) ||
            text((p as Raw).url)
          : "",
    )
    .filter((u) => /^https:\/\//.test(u));
  return [...new Set(urls)].slice(0, 6);
}

const squash = (s: string) => s.replace(/\s+/g, " ").trim();

// The catalogue description is admin-written HTML. It is parsed into plain
// text (never rendered as HTML): an intro paragraph and "label: value" specs
// from <li><h4>label</h4><p>value</p></li> blocks.
export function parseDescription(html: string): {
  intro: string;
  specs: ProductSpec[];
} {
  if (!html || typeof DOMParser === "undefined")
    return { intro: "", specs: [] };
  const doc = new DOMParser().parseFromString(html, "text/html");
  const specs: ProductSpec[] = [];
  doc.querySelectorAll("li").forEach((li) => {
    const label = squash(
      li.querySelector("h1,h2,h3,h4,h5,h6,strong,b")?.textContent || "",
    );
    const value = squash(li.querySelector("p")?.textContent || "");
    if (label && value && label.length <= 60 && value.length <= 160)
      specs.push({ label, value });
  });
  const firstP = Array.from(doc.querySelectorAll("p")).find(
    (p) => !p.closest("li") && squash(p.textContent || "").length > 40,
  );
  let intro = squash(firstP?.textContent || "");
  if (!intro && !specs.length) intro = squash(doc.body.textContent || "");
  if (intro.length > 320)
    intro = `${intro.slice(0, 317).replace(/\s+\S*$/, "")}…`;
  return { intro, specs: specs.slice(0, 10) };
}

export function toProductInfo(raw: Raw): ProductInfo {
  const id = text(raw._id ?? raw.id);
  const slug = text(raw.slug);
  const { intro, specs } = parseDescription(text(raw.description));
  return {
    id,
    title: text(raw.title ?? raw.name),
    href: slug
      ? `/product/${encodeURIComponent(slug)}`
      : id
        ? `/product/${encodeURIComponent(id)}`
        : null,
    brand: text(raw.brand),
    category: titleOf(raw.category),
    subcategory: titleOf(raw.subCategory ?? raw.subcategory),
    photos: photosOf(raw),
    rating: count(raw.ratings),
    reviews: count(raw.numberOfReviews),
    intro,
    specs,
  };
}

// One entry per order line: its catalogue product, or null when none matches.
export function matchLineProducts(
  lines: { name: string }[],
  payload: unknown,
): (ProductInfo | null)[] {
  const raws = catalogueArray(payload);
  const catalogue = mapCatalogueProducts(raws) as { id: string }[];
  if (!catalogue.length) return lines.map(() => null);
  return lines.map((line) => {
    const hit = findCatalogueProduct(line.name, catalogue) as {
      id: string;
    } | null;
    if (!hit) return null;
    const raw = raws.find((r) => text(r._id ?? r.id) === hit.id);
    return raw ? toProductInfo(raw) : null;
  });
}
