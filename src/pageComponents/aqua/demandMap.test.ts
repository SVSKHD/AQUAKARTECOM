import { describe, expect, it } from "vitest";
import { heatLabel, placeDemand, projector } from "./demandMap";

const row = (area: string, orders: number) => ({
  area,
  orders,
  lastPurchasedAt: null,
  top: [],
});

describe("placeDemand", () => {
  it("places localities on the city map and scales their heat", () => {
    const map = placeDemand([
      row("Kondapur", 8),
      row("Gachibowli", 4),
      row("Somewhere Unknown", 9),
    ])!;
    expect(map.city.name).toBe("Hyderabad");
    expect(map.spots.map((s) => [s.area, s.orders, s.heat])).toEqual([
      ["Kondapur", 8, 1],
      ["Gachibowli", 4, 0.5],
    ]);
    expect(map.spots[0].lat).toBeGreaterThan(17);
  });

  it("merges two spellings of one area", () => {
    const map = placeDemand([row("Kondapur", 2), row("KONDAPUR", 3)])!;
    expect(map.spots).toHaveLength(1);
    expect(map.spots[0].orders).toBe(5);
  });

  it("is null when nothing can be placed", () => {
    expect(placeDemand([row("Nowhere", 3)])).toBeNull();
    expect(placeDemand([])).toBeNull();
  });
});

describe("projector", () => {
  it("keeps points inside the box, north at the top", () => {
    const pts = [
      { lat: 17.3, lon: 78.3 },
      { lat: 17.5, lon: 78.5 },
    ];
    const p = projector(pts, 300);
    const south = p.at(pts[0]);
    const north = p.at(pts[1]);
    expect(north.y).toBeLessThan(south.y);
    for (const q of [south, north]) {
      expect(q.x).toBeGreaterThan(0);
      expect(q.x).toBeLessThan(300);
      expect(q.y).toBeGreaterThan(0);
      expect(q.y).toBeLessThan(p.height);
    }
  });
});

it("labels heat", () => {
  expect([heatLabel(1), heatLabel(0.5), heatLabel(0.1)]).toEqual([
    "Hot",
    "Warm",
    "Active",
  ]);
});
