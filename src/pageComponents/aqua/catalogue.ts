import productService from "@/services/products";
import type { Category, Product } from "./types";

export const INR = (n: number | string | undefined | null) =>
  "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");

const D = (
  id: string,
  title: string,
  cat: Category,
  price: number,
  mrp: number,
  o: Partial<Product>,
): Product => ({
  id,
  title,
  cat,
  price,
  mrp,
  brand: "Aquakart",
  photos: [],
  inStock: true,
  stock: "In stock",
  desc: "",
  demo: true,
  ...o,
});

// Fallback when /all-products can't be reached. Mirrors V4's demo catalogue.
export const DEMO_PRODUCTS: Product[] = [
  D("d1", "Compact Water Softener 10 L", "softener", 18500, 21000, {
    capacity: "10 L resin",
    flow: "800 L/hr",
    maxPeople: 2,
    maxPpm: 400,
    regen: "Automatic, time-based",
    warranty: "1 year",
    install: "Mounted at the inlet. Needs a drain and a power socket nearby.",
    maintenance: "Top up regeneration salt about once a month.",
    desc: "A space-saving softener for couples and small flats on moderately hard supply. Protects taps, geysers and bathroom fittings from scale.",
  }),
  D("d2", "Home Water Softener 20 L Auto", "softener", 24990, 29990, {
    capacity: "20 L resin",
    flow: "1,200 L/hr",
    maxPeople: 4,
    maxPpm: 700,
    regen: "Automatic, volume-based",
    warranty: "2 years",
    install:
      "Mounted at the overhead tank outlet or main inlet. Needs a drain and a power socket.",
    maintenance:
      "Top up salt every 3–5 weeks depending on usage. Annual service visit recommended.",
    variants: ["Standard valve", "Digital valve"],
    desc: "Whole-home softening for a family of up to four on borewell or mixed supply. Regenerates only when needed, which keeps salt use low.",
  }),
  D("d9", "Apartment Softener 15 L", "softener", 21500, 0, {
    capacity: "15 L resin",
    flow: "1,000 L/hr",
    maxPeople: 3,
    maxPpm: 600,
    regen: "Automatic, time-based",
    warranty: "1 year",
    install: "Fits utility areas in apartments. Needs a drain point.",
    maintenance: "Top up salt monthly.",
    inStock: false,
    stock: "Out of stock",
    desc: "Slim cabinet softener designed for apartment utility spaces.",
  }),
  D("d3", "Family Water Softener 30 L Auto", "softener", 32500, 0, {
    capacity: "30 L resin",
    flow: "1,800 L/hr",
    maxPeople: 6,
    maxPpm: 900,
    regen: "Automatic, volume-based",
    warranty: "2 years",
    install:
      "Installed on the main line after the overhead tank. Needs a drain and power socket.",
    maintenance: "Top up salt every 4–6 weeks. Annual service recommended.",
    variants: ["Standard valve", "Digital valve"],
    desc: "Higher-capacity softener for larger households and very hard borewell water.",
  }),
  D("d4", "Whole-Home Softener 50 L", "softener", 46000, 52000, {
    capacity: "50 L resin",
    flow: "2,500 L/hr",
    maxPeople: 10,
    maxPpm: 1200,
    regen: "Automatic, volume-based",
    warranty: "2 years",
    install:
      "Site visit recommended before installation for villas and duplexes.",
    maintenance: "Top up salt every 4–6 weeks. Annual service recommended.",
    stock: "Only 2 left",
    desc: "For villas, duplexes and joint families with high daily usage.",
  }),
  D("d5", "RO + UV Water Purifier 8 L", "purifier", 14990, 17990, {
    capacity: "8 L storage",
    flow: "15 L/hr",
    warranty: "1 year",
    install:
      "Wall-mounted in the kitchen. Needs a tap connection and power socket.",
    maintenance: "Filter change every 6–12 months depending on TDS.",
    desc: "Multi-stage RO and UV purification for drinking water.",
  }),
  D("d6", "RO + Mineral Water Purifier 10 L", "purifier", 19490, 0, {
    capacity: "10 L storage",
    flow: "18 L/hr",
    warranty: "1 year",
    install:
      "Wall or counter mounted. Needs a tap connection and power socket.",
    maintenance: "Filter change every 6–12 months.",
    desc: "RO purification with a mineral cartridge for taste.",
  }),
  D("d7", "Whole-Home Sediment + Carbon Filter", "filter", 9800, 0, {
    capacity: 'Twin 20" housings',
    flow: "1,500 L/hr",
    warranty: "1 year",
    install: "Installed on the main line. No power needed.",
    maintenance: "Replace cartridges every 3–6 months.",
    desc: "Removes sand, rust and chlorine taste before water reaches your home.",
  }),
  D("d8", "Commercial Water Softener 150 L", "commercial", 125000, 0, {
    capacity: "150 L resin",
    flow: "6,000 L/hr",
    warranty: "1 year",
    install: "Site survey required.",
    maintenance: "Scheduled service contract recommended.",
    inStock: false,
    stock: "Made to order",
    desc: "For hostels, restaurants and small commercial buildings.",
  }),
];

const strip = (s: unknown) =>
  (typeof s === "string" ? s : "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

type RawPhoto =
  string | { secure_url?: string; delivery_url?: string; url?: string } | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapReal(p: any): Product {
  const photos = ((p.photos || []) as RawPhoto[])
    .map((x) =>
      typeof x === "string"
        ? x
        : x && (x.secure_url || x.delivery_url || x.url),
    )
    .filter((x): x is string => !!x);
  const txt = String(
    ((p.category && (p.category.title || p.category)) || "") +
      " " +
      (p.title || ""),
  );
  const cat: Category = /soft/i.test(txt)
    ? "softener"
    : /\bro\b|purif/i.test(txt)
      ? "purifier"
      : /commercial|industrial/i.test(txt)
        ? "commercial"
        : /filter/i.test(txt)
          ? "filter"
          : "other";
  const sale =
    p.discountPriceStatus && p.discountPrice
      ? Number(p.discountPrice)
      : Number(p.price);
  const oos = p.stock === 0 || p.inStock === false;
  return {
    id: p._id || p.slug,
    title: p.title,
    brand: p.brand || "Aquakart",
    cat,
    price: sale,
    mrp: p.discountPriceStatus ? Number(p.price) : 0,
    photos,
    capacity: p.capacity || p.coverage || "",
    warranty: p.warranty || "",
    inStock: !oos,
    stock: oos ? "Out of stock" : "In stock",
    desc: strip(p.shortDescription || p.description),
    slug: p.slug,
    raw: p,
  };
}

export async function loadCatalogue(
  signal?: AbortSignal,
): Promise<{ products: Product[]; live: boolean }> {
  try {
    const res = await productService.AllProducts({ signal, timeout: 5000 });
    const j = res?.data;
    const arr = Array.isArray(j)
      ? j
      : j?.data || j?.products || j?.result || [];
    const list = (Array.isArray(arr) ? arr : [])
      .map(mapReal)
      .filter((p: Product) => p.id && p.title && p.price > 0);
    if (list.length) return { products: list, live: true };
  } catch {
    // fall through to the demo catalogue
  }
  return { products: DEMO_PRODUCTS, live: false };
}

// Shape stored in the existing Redux cartData / favData slices.
export const toStoreItem = (p: Product, quantity = 1) => ({
  ...(p.raw || {
    title: p.title,
    price: p.price,
    photos: p.photos.map((url) => ({ secure_url: url })),
  }),
  _id: p.id,
  quantity,
});
