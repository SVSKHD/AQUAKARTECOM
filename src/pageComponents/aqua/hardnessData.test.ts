import { describe, expect, it } from "vitest";
import {
  addressHardness,
  areasInRange,
  CITIES,
  LEVEL_RANGES,
  cityPpm,
  findPlace,
  gaugePct,
  harderThan,
  level,
  nearest,
  searchPlaces,
} from "./hardnessData";

const hyd = CITIES.find((c) => c.name === "Hyderabad")!;

describe("hardnessData", () => {
  it("bands ppm into the four levels", () => {
    expect([40, 100, 200, 450].map((p) => level(p).label)).toEqual([
      "Soft",
      "Moderate",
      "Hard",
      "Very hard",
    ]);
    expect(level(75).label).toBe("Moderate");
    expect(level(300).label).toBe("Very hard");
  });

  it("averages a city's areas, or uses its own reading when it has none", () => {
    expect(
      cityPpm({
        name: "X",
        lat: 0,
        lon: 0,
        areas: [
          { name: "a", ppm: 100, supply: "mixed", lat: 0, lon: 0 },
          { name: "b", ppm: 300, supply: "mixed", lat: 0, lon: 0 },
        ],
      }),
    ).toBe(200);
    expect(cityPpm(CITIES.find((c) => c.name === "Kochi")!)).toBe(70);
  });

  it("every chip city has areas to pick from", () => {
    for (const c of CITIES.filter((x) => x.chip))
      expect(c.areas?.length).toBeGreaterThan(3);
  });

  it("lists every city's areas hardest first", () => {
    for (const c of CITIES.filter((x) => x.areas?.length)) {
      const ppm = c.areas!.map((x) => x.ppm);
      expect(ppm).toEqual([...ppm].sort((x, y) => y - x));
    }
  });

  it("covers Hyderabad's outer belt as well as the core, with unique names", () => {
    const names = hyd.areas!.map((x) => x.name);
    expect(names.length).toBeGreaterThan(100);
    expect(new Set(names).size).toBe(names.length);
    for (const n of ["Narsingi", "Kokapet", "Tellapur", "Bachupally", "Abids"])
      expect(names).toContain(n);
    expect(names[0]).toBe("Kokapet");
    expect(names.at(-1)).toBe("Banjara Hills");
  });

  it("finds the closest area to coordinates", () => {
    const hit = nearest({ lat: 17.441, lon: 78.349 });
    expect(hit.city.name).toBe("Hyderabad");
    expect(hit.area?.name).toBe("Gachibowli");
    expect(hit.dist).toBeLessThan(2);
  });

  it("ranks an area against the rest of its city", () => {
    const softest = hyd.areas!.find((a) => a.name === "Banjara Hills")!;
    const hardest = hyd.areas!.find((a) => a.name === "Kokapet")!;
    expect(harderThan(hyd, softest)).toBe(0);
    expect(harderThan(hyd, hardest)).toBe(100);
  });

  it("searches cities and areas, prefix matches first", () => {
    expect(searchPlaces("gachi")[0]).toMatchObject({
      city: { name: "Hyderabad" },
      area: { name: "Gachibowli" },
    });
    expect(searchPlaces("pune")[0]).toMatchObject({
      city: { name: "Pune" },
      area: null,
    });
    expect(searchPlaces("  ")).toEqual([]);
  });

  it("restores a saved pick by name, and ignores unknown ones", () => {
    expect(findPlace("Hyderabad", "Kondapur")?.area?.ppm).toBe(580);
    expect(findPlace("Hyderabad", null)?.area).toBeNull();
    expect(findPlace("Atlantis")).toBeNull();
  });

  it("filters areas by a ppm range, open at the top of the scale", () => {
    const xs = [
      { ...hyd.areas![0], name: "a", ppm: 70 },
      { ...hyd.areas![0], name: "b", ppm: 150 },
      { ...hyd.areas![0], name: "c", ppm: 300 },
      { ...hyd.areas![0], name: "d", ppm: 900 },
    ];
    const names = (min: number, max: number) =>
      areasInRange(xs, min, max).map((x) => x.name);
    expect(names(0, 800)).toEqual(["a", "b", "c", "d"]);
    expect(names(150, 300)).toEqual(["b", "c"]);
    expect(names(310, 790)).toEqual([]);
    expect(names(300, 800)).toEqual(["c", "d"]);
  });

  it("level presets match the level bands exactly", () => {
    for (const r of LEVEL_RANGES) {
      expect(level(r.min).label).toBe(r.label);
      expect(level(r.max).label).toBe(r.label);
    }
  });

  it("keeps the gauge marker on the bar", () => {
    expect(gaugePct(0)).toBe(3);
    expect(gaugePct(5000)).toBe(97);
    expect(gaugePct(400)).toBe(50);
  });
});

describe("addressHardness", () => {
  it("finds a known area in the street, with its reading", () => {
    const h = addressHardness({
      street: "Flat 402, My Home Avatar, Narsingi",
      city: "Hyderabad",
      postalCode: "500075",
    });
    expect(h).toMatchObject({ basis: "area", ppm: 700 });
    expect(h?.area?.name).toBe("Narsingi");
    expect(h?.city.name).toBe("Hyderabad");
  });

  it("prefers the longest area name and reads city aliases", () => {
    expect(
      addressHardness({ street: "Bandlaguda Jagir road", city: "Secunderabad" })
        ?.area?.name,
    ).toBe("Bandlaguda Jagir");
    expect(
      addressHardness({ street: "12 MG Road", city: "Bangalore" }),
    ).toMatchObject({ basis: "city", area: null });
  });

  it("falls back to the city average, and gives up on unknown cities", () => {
    const h = addressHardness({
      street: "janapriya utopia",
      city: "Hyderabad",
      state: "Telangana",
    });
    expect(h?.basis).toBe("city");
    expect(h?.ppm).toBe(cityPpm(h!.city));
    expect(addressHardness({ street: "Main road", city: "Shimla" })).toBeNull();
    expect(addressHardness(null)).toBeNull();
  });
});
