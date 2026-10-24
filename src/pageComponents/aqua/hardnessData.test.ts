import { describe, expect, it } from "vitest";
import {
  CITIES,
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

  it("finds the closest area to coordinates", () => {
    const hit = nearest({ lat: 17.441, lon: 78.349 });
    expect(hit.city.name).toBe("Hyderabad");
    expect(hit.area?.name).toBe("Gachibowli");
    expect(hit.dist).toBeLessThan(2);
  });

  it("ranks an area against the rest of its city", () => {
    const softest = hyd.areas!.find((a) => a.name === "Banjara Hills")!;
    const hardest = hyd.areas!.find((a) => a.name === "Manikonda")!;
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

  it("keeps the gauge marker on the bar", () => {
    expect(gaugePct(0)).toBe(3);
    expect(gaugePct(5000)).toBe(97);
    expect(gaugePct(400)).toBe(50);
  });
});
