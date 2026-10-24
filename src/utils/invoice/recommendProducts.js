import { mapReal } from "@/pageComponents/aqua/catalogue";
import { normalizeProductName } from "@/utils/invoice/matchInvoiceProducts";

// What goes well with what the customer already owns, best fit first.
const COMPLEMENTS = {
  softener: ["filter", "purifier", "commercial"],
  purifier: ["filter", "softener"],
  filter: ["softener", "purifier"],
  commercial: ["filter", "softener"],
  other: ["purifier", "softener", "filter"],
};

const categoryOf = (text) =>
  /soft/i.test(text)
    ? "softener"
    : /\bro\b|purif/i.test(text)
      ? "purifier"
      : /commercial|industrial/i.test(text)
        ? "commercial"
        : /filter/i.test(text)
          ? "filter"
          : "other";

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  const inner = payload?.products ?? payload?.data ?? payload?.result;
  return Array.isArray(inner) ? inner : [];
};

/** A catalogue product shaped for the receipt's "other products" cards. */
const toCard = (product) => ({
  id: String(product.id),
  title: product.title,
  category: product.cat,
  price: product.price,
  mrp: product.mrp > product.price ? product.mrp : 0,
  image: product.photos[0] || "",
  href: product.slug
    ? `/product/${encodeURIComponent(product.slug)}`
    : `/product/${encodeURIComponent(product.id)}`,
  description: product.desc || "",
  capacity: product.capacity || "",
  flow: product.flow || "",
  warranty: product.warranty || "",
  inStock: product.inStock,
});

/**
 * Other catalogue products to show next to a receipt: never one the customer
 * bought, complements to their purchase first, in-stock and pictured first.
 */
export const recommendProducts = (invoice, cataloguePayload, limit = 8) => {
  const purchased = Array.isArray(invoice?.products) ? invoice.products : [];
  const boughtIds = new Set(
    purchased.map((p) => String(p.catalogueProductId || "")).filter(Boolean),
  );
  const boughtNames = new Set(
    purchased.map((p) => normalizeProductName(p.productName)).filter(Boolean),
  );
  const ownedCategories = purchased.map((p) =>
    categoryOf(
      `${p.productCategory || ""} ${p.productSubcategory || ""} ${p.productName || ""}`,
    ),
  );
  const wanted = [
    ...new Set(ownedCategories.flatMap((c) => COMPLEMENTS[c] || [])),
  ];

  const rank = (product) => {
    const complement = wanted.indexOf(product.cat);
    let score = complement === -1 ? 0 : 40 - complement * 8;
    if (ownedCategories.includes(product.cat)) score += 6; // an upgrade/alternative
    if (product.inStock) score += 10;
    if (product.photos.length) score += 8;
    if (product.mrp > product.price) score += 3;
    return score;
  };

  return toArray(cataloguePayload)
    .map((raw) => {
      try {
        return mapReal(raw);
      } catch {
        return null;
      }
    })
    .filter(
      (p) =>
        p &&
        p.id &&
        p.title &&
        p.price > 0 &&
        !boughtIds.has(String(p.raw?.id ?? p.raw?._id ?? p.id)) &&
        !boughtNames.has(normalizeProductName(p.title)),
    )
    .map((p, index) => ({ p, index, score: rank(p) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ p }) => toCard(p));
};

// "Kent Automatic Water Softener 8L | Aquakart" -> "Kent Automatic Water Softener 8L"
export const shortProductName = (name) =>
  String(name || "")
    .replace(/\s*[|–-]\s*aquakart\s*$/i, "")
    .trim();

/** Starter questions about what the customer bought (sent as typed). */
export const ownedProductQuestions = (invoice, limit = 4) => {
  const names = (invoice?.products || [])
    .map((p) => shortProductName(p.productName))
    .filter(Boolean);
  if (!names.length)
    return [
      "How do I claim warranty on my purchase?",
      "How often should my water system be serviced?",
    ];
  const [first, second] = names;
  return [
    `How do I maintain my ${first}?`,
    `How often should my ${first} be serviced?`,
    second
      ? `How do I maintain my ${second}?`
      : `Which spares or filters does my ${first} need?`,
    `How do I claim warranty for my ${first}?`,
  ].slice(0, limit);
};

/** The question asked from an "other product" card. */
export const otherProductQuestion = (product, invoice) => {
  const owned = shortProductName(invoice?.products?.[0]?.productName);
  return owned
    ? `Tell me about ${product.title}. Would it work well with my ${owned}?`
    : `Tell me about ${product.title}. Is it right for my home?`;
};
