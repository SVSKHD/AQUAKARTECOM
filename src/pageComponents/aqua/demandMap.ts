import { CITIES, type Area, type City } from "./hardnessData";

// Orders per locality from GET /v1/storefront/demand-areas.
export type AreaPick = {
  productName: string;
  productSlug: string | null;
  productId: string | null;
  orders: number;
};
export type AreaDemand = {
  area: string;
  orders: number;
  lastPurchasedAt: string | null;
  top: AreaPick[];
};
// A locality placed on the map, with its heat (0–1, 1 = the busiest area).
export type HotSpot = AreaDemand & { lat: number; lon: number; heat: number };
export type DemandMap = { city: City; spots: HotSpot[] };

const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// The area in our map data that a locality from an address names: the same
// name, else the only area whose name starts with it ("Kukatpally" →
// "Kukatpally Housing Board" only when nothing else starts that way).
function locate(name: string): { city: City; area: Area } | null {
  const k = key(name);
  if (k.length < 3) return null;
  const all = CITIES.flatMap((city) =>
    (city.areas || []).map((area) => ({ city, area, k: key(area.name) })),
  );
  const exact = all.find((x) => x.k === k);
  if (exact) return exact;
  const loose = all.filter((x) => x.k.startsWith(k) || k.startsWith(x.k));
  return loose.length === 1 ? loose[0] : null;
}

// Places each locality on the map and keeps the city with the most orders
// (the map shows one city). null when nothing can be placed.
export function placeDemand(areas: AreaDemand[]): DemandMap | null {
  const placed = areas
    .map((a) => ({ a, at: locate(a.area) }))
    .filter((x): x is { a: AreaDemand; at: { city: City; area: Area } } =>
      Boolean(x.at && x.a.orders > 0),
    );
  if (!placed.length) return null;
  const byCity = new Map<string, number>();
  for (const { a, at } of placed)
    byCity.set(at.city.name, (byCity.get(at.city.name) || 0) + a.orders);
  const cityName = [...byCity.entries()].sort((x, y) => y[1] - x[1])[0][0];
  const inCity = placed.filter((x) => x.at.city.name === cityName);
  const max = Math.max(...inCity.map((x) => x.a.orders));
  // Two addresses can name one area differently ("Kondapur", "kondapur"):
  // merge them on the map's area.
  const spots = new Map<string, HotSpot>();
  for (const { a, at } of inCity) {
    const prev = spots.get(at.area.name);
    if (prev) {
      prev.orders += a.orders;
      continue;
    }
    spots.set(at.area.name, {
      ...a,
      area: at.area.name,
      lat: at.area.lat,
      lon: at.area.lon,
      heat: 0,
    });
  }
  const list = [...spots.values()].sort((x, y) => y.orders - x.orders);
  const top = Math.max(max, ...list.map((s) => s.orders));
  list.forEach((s) => (s.heat = s.orders / top));
  return { city: inCity[0].at.city, spots: list };
}

// Projects lat/lon into a box of the given width, keeping the map's real
// proportions (a degree of longitude is shorter than one of latitude).
export function projector(points: { lat: number; lon: number }[], width = 320) {
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  const pad = 0.02;
  const minLat = Math.min(...lats) - pad;
  const maxLat = Math.max(...lats) + pad;
  const minLon = Math.min(...lons) - pad;
  const maxLon = Math.max(...lons) + pad;
  const mid = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const spanX = (maxLon - minLon) * Math.cos(mid);
  const spanY = maxLat - minLat;
  const height = Math.round((width * spanY) / spanX);
  return {
    width,
    height,
    at: (p: { lat: number; lon: number }) => ({
      x: (((p.lon - minLon) * Math.cos(mid)) / spanX) * width,
      y: ((maxLat - p.lat) / spanY) * height,
    }),
  };
}

// "Hot", "Warm" or "Active" for a spot's heat, as the legend reads.
export const heatLabel = (heat: number) =>
  heat >= 0.66 ? "Hot" : heat >= 0.33 ? "Warm" : "Active";
