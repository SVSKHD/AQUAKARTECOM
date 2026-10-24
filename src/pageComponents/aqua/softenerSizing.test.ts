import { describe, expect, it } from "vitest";
import { mapReal } from "./catalogue";
import {
  readHome,
  sizeSofteners,
  softenerBadges,
  softenerFacts,
} from "./softenerSizing";

// The live softener range, as /all-products returns it (descriptions trimmed).
const facts = (pairs: [string, string][]) =>
  pairs.map(([k, v]) => `<h4>${k}</h4><p>${v}</p>`).join("");
const live = [
  {
    _id: "bath55",
    title: "Kent Bathroom Water Softener 5.5L | Aquakart",
    category: { title: "Softeners" },
    price: 18000,
    discountPrice: 14500,
    discountPriceStatus: true,
    stock: 3,
    description:
      "<p>Designed for bathrooms.</p>" +
      facts([
        ["Resin Volume", "5.5 L"],
        ["Ideal place for installation", "For flats & individual bathrooms"],
      ]) +
      "<p>Since this is a manual softener, it's necessary to add salt and perform regeneration.</p>",
  },
  {
    _id: "auto8",
    title: "Kent Automatic 8L | Aquakart",
    category: { title: "Softeners" },
    price: 36000,
    discountPrice: 31500,
    discountPriceStatus: true,
    stock: 5,
    description:
      "<p>Unlike manual bathroom softeners, it adjusts to usage.</p>" +
      facts([
        ["Resin Volume", "8 L"],
        ["Flow Rate", "1200 L/H"],
      ]),
  },
  {
    _id: "auto25",
    title: "Kent Automatic Water Softener 25 | Aquakart",
    category: { title: "Softeners" },
    price: 80000,
    discountPrice: 71000,
    discountPriceStatus: true,
    stock: 2,
    description:
      "<p>Soft water for your entire household.</p>" +
      facts([
        ["Resin Volume", "25 L"],
        ["Flow Rate", "Up to 3000 L/hr"],
      ]),
  },
  {
    _id: "auto40",
    title: "Kent Automatic Water Softener 40 | Aquakart",
    category: { title: "Softeners" },
    price: 100000,
    discountPrice: 95000,
    discountPriceStatus: true,
    stock: 2,
    description:
      "<p>Soft water for your entire household.</p>" +
      facts([
        ["Resin Volume", "40 L"],
        ["Flow Rate", "Up to 4000 L/hr"],
      ]),
  },
  {
    _id: "auto100",
    title: "Kent Automatic Water Softener 100L | Aquakart",
    category: { title: "Softeners" },
    price: 135000,
    discountPrice: 129500,
    discountPriceStatus: true,
    stock: 1,
    description:
      "<p>Designed for whole-house usage.</p>" +
      facts([
        ["Resin Volume", "100 L"],
        ["Flow Rate", "Max. 4000 L/hr"],
      ]),
  },
  {
    _id: "wash",
    title: "kent Washing Water Softener",
    category: { title: "Softeners" },
    price: 7000,
    stock: 9,
    description: "&lt;p&gt;Softener for washing machines.&lt;/p&gt;",
  },
].map(mapReal);
const byId = Object.fromEntries(live.map((p) => [p.id, p]));

describe("softener facts", () => {
  it("tells automatic from manual and what each treats", () => {
    expect(softenerBadges(byId.bath55)).toEqual(["Manual", "Per bathroom"]);
    expect(softenerBadges(byId.auto8)).toEqual(["Automatic", "Per bathroom"]);
    expect(softenerBadges(byId.auto25)).toEqual(["Automatic", "Whole home"]);
    expect(softenerBadges(byId.auto100)).toEqual(["Automatic", "Whole home"]);
    expect(softenerFacts(byId.wash)?.scope).toBe("appliance");
    expect(softenerFacts(byId.auto40)).toMatchObject({
      resinL: 40,
      flowLph: 4000,
    });
  });
});

describe("readHome", () => {
  it("reads bathrooms and the kind of home", () => {
    expect(readHome("We have a villa with 5 bathrooms")).toEqual({
      bathrooms: 5,
      kind: "house",
    });
    expect(readHome("independent house, three washrooms")).toEqual({
      bathrooms: 3,
      kind: "house",
    });
    expect(readHome("2 bhk flat")).toEqual({ kind: "apartment" });
    expect(readHome("what is TDS?")).toEqual({});
  });
});

describe("sizeSofteners", () => {
  it("sizes a 5-bathroom villa: whole-home automatic first, per-bathroom options to compare", () => {
    const s = sizeSofteners(live, { bathrooms: 5, kind: "house" })!;
    // 5 × 600 L/hr = 3,000 L/hr: the 25 fits, the 40 adds headroom.
    expect(s.picks).toEqual(["auto25", "auto40", "auto8", "bath55"]);
    expect(s.picks).not.toContain("wash");
    expect(s.reasons.auto25).toMatch(
      /Up to 3,000 L\/hr, enough for all 5 bathrooms at once \(5 × 600 L\/hr = 3,000 L\/hr\)/,
    );
    expect(s.reasons.auto8).toMatch(/You'd fit 5, about ₹1,57,500 in all/);
    expect(s.reasons.bath55).toMatch(
      /Manual: you add salt and regenerate it by hand/,
    );
    expect(s.summary).toMatch(
      /\*\*Kent Automatic Water Softener 25\*\* covers that, and \*\*Kent Automatic Water Softener 40\*\* adds headroom/,
    );
  });

  it("goes up a size when the bathrooms need more flow", () => {
    expect(sizeSofteners(live, { bathrooms: 6 })!.picks.slice(0, 2)).toEqual([
      "auto40",
      "auto100",
    ]);
  });

  it("needs a home to size", () => {
    expect(sizeSofteners(live, {})).toBeNull();
    expect(
      sizeSofteners(
        live.filter((p) => p.cat !== "softener"),
        { bathrooms: 3 },
      ),
    ).toBeNull();
  });
});
