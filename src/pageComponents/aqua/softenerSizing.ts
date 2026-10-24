import { INR } from "./catalogue";
import { descriptionText } from "./productDescription";
import type { Product } from "./types";

// How a softener works and what it treats, read from its title, specs and
// description. Live products carry this only as prose ("Since this is a manual
// softener…", "for your entire household", "Resin Volume 40 L").
export type SoftenerFacts = {
  regen: "automatic" | "manual" | null;
  scope: "whole-home" | "bathroom" | "appliance" | null;
  resinL: number | null;
  flowLph: number | null;
};

const num = (s?: string | null) =>
  s ? Number(s.replace(/,/g, "")) || null : null;

export function softenerFacts(p: Product): SoftenerFacts | null {
  if (p.cat !== "softener") return null;
  const text = `${p.title} ${p.regen || ""} ${p.capacity || ""} ${p.flow || ""} ${p.desc} ${
    p.about ? descriptionText(p.about) : ""
  }`;
  // The catalogue files softeners under "Automatic" / "Manual" sub-categories.
  const sub = String(
    (p.raw as { subCategory?: { title?: string } } | undefined)?.subCategory
      ?.title || "",
  );
  const named = `${p.title} ${p.regen || ""} ${sub}`;
  const regen = /\bauto(matic|softener)?\b/i.test(named)
    ? "automatic"
    : /\bmanual\b/i.test(named) || /\bmanual\b/i.test(text)
      ? "manual"
      : /\bautomatic\b/i.test(text)
        ? "automatic"
        : null;
  const resinL = num(
    text.match(/resin(?: volume)?\s*:?\s*([\d.]+)\s*l\b/i)?.[1] ||
      text.match(/([\d.]+)\s*l\s+resin/i)?.[1],
  );
  const flowLph = num(text.match(/([\d,]+)\s*l\s*\/\s*h/i)?.[1]);
  const scope = /washing/i.test(p.title)
    ? "appliance"
    : /bathroom/i.test(p.title) || (resinL != null && resinL <= 8)
      ? "bathroom"
      : /entire household|whole[- ]?(house|home)|villa|family/i.test(text) ||
          (resinL != null && resinL >= 10)
        ? "whole-home"
        : null;
  return { regen, scope, resinL, flowLph };
}

export const REGEN_LABEL = {
  automatic: "Automatic",
  manual: "Manual",
} as const;
export const SCOPE_LABEL = {
  "whole-home": "Whole home",
  bathroom: "Per bathroom",
  appliance: "Washing machine",
} as const;

// "Automatic · Whole home" for a card's badges.
export const softenerBadges = (p: Product) => {
  const f = softenerFacts(p);
  if (!f) return [];
  const out: string[] = [];
  if (f.regen) out.push(REGEN_LABEL[f.regen]);
  if (f.scope) out.push(SCOPE_LABEL[f.scope]);
  return out;
};

export type Home = { bathrooms?: number; kind?: "house" | "apartment" };

const WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

// "a villa with 5 bathrooms", "independent house, three washrooms", "2bhk flat".
export function readHome(text: string): Home {
  const t = text.toLowerCase();
  const home: Home = {};
  const m = t.match(
    /\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:-|\s)?(?:bath(?:room)?s?|washrooms?|toilets?|restrooms?)\b/,
  );
  if (m) home.bathrooms = WORDS[m[1]] ?? Number(m[1]);
  if (
    /villa|independent (house|home)|duplex|bungalow|row ?house|triplex/.test(t)
  )
    home.kind = "house";
  else if (/apartment|\bflat\b/.test(t)) home.kind = "apartment";
  return home;
}

// A running shower uses about 10 L a minute. Sizing for every bathroom at once
// keeps the pressure up when the whole house showers in the morning.
export const LPH_PER_BATHROOM = 600;

export type Sizing = {
  picks: string[];
  reasons: Record<string, string>;
  // Plain-language summary, used when the AI isn't answering.
  summary: string;
};

const lph = (n: number) => `${n.toLocaleString("en-IN")} L/hr`;

// Whole-home automatic units sized for the home, against fitting one softener per
// bathroom (automatic and manual), so the customer sees both ways of doing it.
export function sizeSofteners(products: Product[], home: Home): Sizing | null {
  if (!home.bathrooms && home.kind !== "house") return null;
  const rows = products
    .map((p) => ({ p, f: softenerFacts(p) }))
    .filter(
      (r): r is { p: Product; f: SoftenerFacts } =>
        !!r.f && r.f.scope !== "appliance",
    );
  if (!rows.length) return null;
  // Flow first, resin as the tie-break (the 40 L and 100 L both list 4,000 L/hr).
  const size = (r: { f: SoftenerFacts }) =>
    (r.f.flowLph ?? (r.f.resinL ?? 0) * 100) * 1000 + (r.f.resinL ?? 0);
  const inStockFirst = <T extends { p: Product }>(list: T[]) => [
    ...list.filter((r) => r.p.inStock),
    ...list.filter((r) => !r.p.inStock),
  ];

  const baths = home.bathrooms;
  const peak = baths ? baths * LPH_PER_BATHROOM : null;
  const whole = rows
    .filter((r) => r.f.scope === "whole-home")
    .sort((a, b) => size(a) - size(b));
  const fits = whole.filter((r) =>
    peak ? (r.f.flowLph ?? 0) >= peak : (r.f.resinL ?? 0) >= 20,
  );
  const best = inStockFirst(fits)[0] || whole[whole.length - 1];
  const bigger = best
    ? whole.filter((r) => size(r) > size(best) && r.p.id !== best.p.id)
    : [];
  const headroom = inStockFirst(bigger)[0];
  const perBath = rows.filter((r) => r.f.scope === "bathroom");
  const autoBath = inStockFirst(
    perBath.filter((r) => r.f.regen === "automatic"),
  )[0];
  const manualBath = inStockFirst(
    perBath.filter((r) => r.f.regen === "manual"),
  )[0];

  const reasons: Record<string, string> = {};
  const covered = baths
    ? `all ${baths} bathrooms at once (${baths} × ${lph(LPH_PER_BATHROOM)} = ${lph(peak!)})`
    : "the whole house";
  if (best) {
    const flow = best.f.flowLph
      ? `Up to ${lph(best.f.flowLph)}`
      : best.p.capacity || "Whole-home size";
    reasons[best.p.id] =
      (peak && (best.f.flowLph ?? 0) < peak
        ? `${flow}, the largest listed, but below ${covered}. Ask an expert about a bigger system.`
        : `${flow}, enough for ${covered}.`) +
      ` ${best.f.regen === "manual" ? "Manual: salt and regeneration by hand." : "Automatic: one unit on the main line regenerates by itself."}`;
  }
  if (headroom) {
    reasons[headroom.p.id] =
      `More headroom${headroom.f.resinL ? ` (${headroom.f.resinL} L resin)` : ""} for very hard borewell water or heavier use, so it regenerates less often.`;
  }
  const n = baths || 1;
  const each = (r: { p: Product }, how: string) =>
    `Treats one bathroom only. ${how}${n > 1 ? ` You'd fit ${n}, about ${INR(r.p.price * n)} in all.` : ""}`;
  if (autoBath)
    reasons[autoBath.p.id] = each(autoBath, "Automatic, so no daily handling.");
  if (manualBath)
    reasons[manualBath.p.id] = each(
      manualBath,
      "Manual: you add salt and regenerate it by hand.",
    );

  const picks = [best, headroom, autoBath, manualBath]
    .filter((r): r is { p: Product; f: SoftenerFacts } => !!r)
    .map((r) => r.p.id)
    .filter((id, i, a) => a.indexOf(id) === i)
    .slice(0, 4);
  if (!picks.length) return null;

  const where = baths
    ? `a home with ${baths} bathrooms`
    : "a villa or independent house";
  const summary = [
    `For ${where}, one automatic whole-home softener is usually simpler than a softener in every bathroom.`,
    peak
      ? `With all ${baths} bathrooms running (a shower uses about ${lph(LPH_PER_BATHROOM)}), you need roughly ${lph(peak)}.`
      : "Tell me how many bathrooms you have and I'll size it.",
    best
      ? `**${best.p.title}** covers that${headroom ? `, and **${headroom.p.title}** adds headroom` : ""}.`
      : "",
    autoBath || manualBath
      ? "Per-bathroom units cost less each, but you'd fit one per bathroom, and manual ones need salt and regeneration by hand."
      : "",
    "A hardness test and a site visit confirm the final size.",
  ]
    .filter(Boolean)
    .join(" ");
  return { picks, reasons, summary };
}
