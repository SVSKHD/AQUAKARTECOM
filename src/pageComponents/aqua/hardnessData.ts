// TODO(backend): replace with measured hardness by PIN code. These are rough
// estimates from the usual supply in each area (municipal lake/river water vs
// borewell groundwater) and the UI labels them as estimates, never as a test.

export type Supply = "municipal" | "borewell" | "mixed";
export type Area = {
  name: string;
  ppm: number;
  supply: Supply;
  lat: number;
  lon: number;
};
export type City = {
  name: string;
  lat: number;
  lon: number;
  chip?: boolean;
  // Only for cities without areas; otherwise the average of the areas.
  ppm?: number;
  areas?: Area[];
};

const a = (
  name: string,
  ppm: number,
  supply: Supply,
  lat: number,
  lon: number,
): Area => ({ name, ppm, supply, lat, lon });

const RAW_CITIES: City[] = [
  {
    name: "Bengaluru",
    lat: 12.97,
    lon: 77.59,
    chip: true,
    areas: [
      a("Jayanagar", 120, "municipal", 12.93, 77.58),
      a("Malleshwaram", 110, "municipal", 13.0, 77.57),
      a("Indiranagar", 180, "mixed", 12.97, 77.64),
      a("Koramangala", 260, "mixed", 12.93, 77.62),
      a("Hebbal", 380, "mixed", 13.04, 77.59),
      a("HSR Layout", 420, "mixed", 12.91, 77.64),
      a("Yelahanka", 520, "borewell", 13.1, 77.6),
      a("Marathahalli", 560, "borewell", 12.96, 77.7),
      a("Electronic City", 640, "borewell", 12.84, 77.66),
      a("Whitefield", 680, "borewell", 12.97, 77.75),
      a("Sarjapur Road", 720, "borewell", 12.91, 77.68),
    ],
  },
  {
    name: "Chennai",
    lat: 13.08,
    lon: 80.27,
    chip: true,
    areas: [
      a("T. Nagar", 260, "mixed", 13.04, 80.23),
      a("Mylapore", 280, "mixed", 13.03, 80.27),
      a("Anna Nagar", 300, "mixed", 13.09, 80.21),
      a("Adyar", 340, "mixed", 13.0, 80.26),
      a("Velachery", 520, "borewell", 12.98, 80.22),
      a("Porur", 540, "borewell", 13.04, 80.16),
      a("Tambaram", 560, "borewell", 12.92, 80.12),
      a("OMR / Sholinganallur", 680, "borewell", 12.9, 80.23),
    ],
  },
  {
    name: "Hyderabad",
    lat: 17.39,
    lon: 78.49,
    chip: true,
    // Hardest first. The western and outer belts (Narsingi, Kokapet, Tellapur,
    // Bachupally…) live on borewell water from granite; the old city core gets
    // Krishna / Godavari / Manjira supply and is much softer.
    areas: [
      a("Kokapet", 720, "borewell", 17.396, 78.335),
      a("Kollur", 710, "borewell", 17.457, 78.258),
      a("Narsingi", 700, "borewell", 17.385, 78.355),
      a("Tellapur", 700, "borewell", 17.475, 78.285),
      a("Mokila", 700, "borewell", 17.445, 78.235),
      a("Puppalaguda", 690, "borewell", 17.393, 78.371),
      a("Manchirevula", 690, "borewell", 17.37, 78.345),
      a("Bowrampet", 690, "borewell", 17.567, 78.37),
      a("Mallampet", 690, "borewell", 17.57, 78.335),
      a("Gandipet", 680, "borewell", 17.387, 78.3),
      a("Gopanpally", 680, "borewell", 17.457, 78.315),
      a("Bachupally", 680, "borewell", 17.545, 78.38),
      a("Ameenpur", 680, "borewell", 17.52, 78.33),
      a("Dundigal", 680, "borewell", 17.6, 78.4),
      a("Medchal", 680, "borewell", 17.63, 78.48),
      a("Shankarpally", 680, "borewell", 17.455, 78.13),
      a("Adibatla", 680, "borewell", 17.23, 78.57),
      a("Tukkuguda", 680, "borewell", 17.2, 78.48),
      a("Bandlaguda Jagir", 660, "borewell", 17.355, 78.38),
      a("Neknampur", 660, "borewell", 17.395, 78.385),
      a("Beeramguda", 660, "borewell", 17.52, 78.31),
      a("Patancheru", 650, "borewell", 17.53, 78.265),
      a("Alkapur Township", 650, "borewell", 17.39, 78.375),
      a("Nallagandla", 650, "borewell", 17.47, 78.31),
      a("Pragathi Nagar", 650, "borewell", 17.52, 78.395),
      a("Shamirpet", 650, "borewell", 17.595, 78.56),
      a("Shamshabad", 650, "borewell", 17.26, 78.39),
      a("Moinabad", 650, "borewell", 17.33, 78.27),
      a("Manikonda", 640, "borewell", 17.4, 78.38),
      a("Serilingampally", 640, "borewell", 17.49, 78.325),
      a("Nizampet", 640, "borewell", 17.515, 78.385),
      a("Kompally", 640, "borewell", 17.535, 78.48),
      a("Ghatkesar", 640, "borewell", 17.45, 78.68),
      a("Khajaguda", 620, "borewell", 17.415, 78.37),
      a("Lingampally", 620, "borewell", 17.484, 78.317),
      a("Gajularamaram", 620, "borewell", 17.53, 78.43),
      a("Keesara", 620, "borewell", 17.52, 78.66),
      a("Pocharam", 620, "borewell", 17.43, 78.64),
      a("Badangpet", 620, "borewell", 17.3, 78.51),
      a("Balapur", 620, "borewell", 17.31, 78.49),
      a("Nanakramguda", 610, "borewell", 17.42, 78.345),
      a("Hydershakote", 610, "borewell", 17.373, 78.379),
      a("Financial District", 600, "borewell", 17.413, 78.338),
      a("Chandanagar", 600, "borewell", 17.494, 78.335),
      a("Miyapur", 600, "borewell", 17.5, 78.36),
      a("Kothaguda", 600, "borewell", 17.465, 78.37),
      a("Kismatpur", 600, "borewell", 17.343, 78.395),
      a("Hayathnagar", 600, "borewell", 17.33, 78.6),
      a("Hafeezpet", 590, "borewell", 17.48, 78.35),
      a("Kondapur", 580, "borewell", 17.47, 78.36),
      a("Raidurg", 580, "borewell", 17.43, 78.385),
      a("Meerpet", 580, "borewell", 17.32, 78.52),
      a("Gachibowli", 560, "borewell", 17.44, 78.35),
      a("Jeedimetla", 560, "borewell", 17.51, 78.455),
      a("Nagaram", 560, "borewell", 17.48, 78.61),
      a("BN Reddy Nagar", 560, "borewell", 17.315, 78.545),
      a("Rajendranagar", 560, "mixed", 17.32, 78.4),
      a("Ramachandrapuram (BHEL)", 560, "mixed", 17.51, 78.3),
      a("Suchitra", 560, "mixed", 17.5, 78.47),
      a("Hitech City", 540, "mixed", 17.447, 78.38),
      a("Peerzadiguda", 540, "borewell", 17.4, 78.6),
      a("Madhapur", 520, "mixed", 17.45, 78.39),
      a("Boduppal", 520, "borewell", 17.41, 78.58),
      a("Vanasthalipuram", 520, "borewell", 17.33, 78.575),
      a("Yapral", 520, "borewell", 17.505, 78.535),
      a("LB Nagar", 480, "mixed", 17.35, 78.55),
      a("Attapur", 480, "mixed", 17.37, 78.43),
      a("Kapra", 480, "mixed", 17.485, 78.58),
      a("Bolarum", 480, "mixed", 17.535, 78.515),
      a("KPHB Colony", 470, "mixed", 17.485, 78.39),
      a("Moosapet", 460, "mixed", 17.47, 78.425),
      a("Nagole", 460, "mixed", 17.37, 78.57),
      a("Alwal", 460, "mixed", 17.5, 78.51),
      a("Chandrayangutta", 460, "mixed", 17.33, 78.48),
      a("Kukatpally", 450, "mixed", 17.49, 78.4),
      a("Balanagar", 440, "mixed", 17.47, 78.445),
      a("ECIL", 440, "mixed", 17.47, 78.57),
      a("Karmanghat", 440, "mixed", 17.345, 78.535),
      a("Sainikpuri", 430, "mixed", 17.49, 78.55),
      a("AS Rao Nagar", 420, "mixed", 17.478, 78.56),
      a("Uppal", 420, "mixed", 17.4, 78.56),
      a("Nacharam", 420, "mixed", 17.43, 78.56),
      a("Moula Ali", 420, "mixed", 17.457, 78.545),
      a("Neredmet", 420, "mixed", 17.475, 78.535),
      a("Shaikpet", 420, "mixed", 17.405, 78.402),
      a("Langar Houz", 420, "mixed", 17.375, 78.42),
      a("Champapet", 420, "mixed", 17.345, 78.515),
      a("Kothapet", 400, "mixed", 17.365, 78.54),
      a("Saroornagar", 400, "mixed", 17.355, 78.53),
      a("Malkajgiri", 380, "mixed", 17.45, 78.53),
      a("Dilsukhnagar", 380, "mixed", 17.37, 78.525),
      a("Tolichowki", 380, "mixed", 17.4, 78.42),
      a("Borabanda", 380, "mixed", 17.455, 78.415),
      a("Santosh Nagar", 380, "mixed", 17.345, 78.505),
      a("Golconda", 360, "mixed", 17.383, 78.401),
      a("Sanath Nagar", 360, "mixed", 17.457, 78.443),
      a("Ramanthapur", 360, "mixed", 17.39, 78.53),
      a("Habsiguda", 360, "mixed", 17.41, 78.54),
      a("Erragadda", 340, "mixed", 17.453, 78.432),
      a("Bowenpally", 340, "mixed", 17.47, 78.48),
      a("Bahadurpura", 340, "mixed", 17.355, 78.455),
      a("Mehdipatnam", 320, "municipal", 17.395, 78.44),
      a("Trimulgherry", 320, "mixed", 17.465, 78.51),
      a("Tarnaka", 300, "municipal", 17.43, 78.53),
      a("Film Nagar", 300, "municipal", 17.41, 78.41),
      a("Yousufguda", 300, "municipal", 17.435, 78.425),
      a("SR Nagar", 300, "municipal", 17.44, 78.44),
      a("Malakpet", 300, "municipal", 17.375, 78.505),
      a("Ameerpet", 280, "municipal", 17.435, 78.447),
      a("Amberpet", 280, "municipal", 17.39, 78.515),
      a("Masab Tank", 260, "municipal", 17.4, 78.455),
      a("Begumpet", 260, "municipal", 17.445, 78.47),
      a("Charminar", 260, "municipal", 17.36, 78.475),
      a("Khairatabad", 240, "municipal", 17.41, 78.46),
      a("Punjagutta", 240, "municipal", 17.425, 78.45),
      a("Marredpally", 240, "municipal", 17.445, 78.51),
      a("Vidyanagar", 240, "municipal", 17.405, 78.505),
      a("Musheerabad", 240, "municipal", 17.415, 78.495),
      a("Kachiguda", 230, "municipal", 17.385, 78.5),
      a("Secunderabad", 220, "municipal", 17.44, 78.5),
      a("Somajiguda", 220, "municipal", 17.425, 78.46),
      a("Nampally", 220, "municipal", 17.39, 78.465),
      a("Himayatnagar", 200, "municipal", 17.4, 78.485),
      a("Abids", 200, "municipal", 17.39, 78.475),
      a("Koti", 200, "municipal", 17.385, 78.485),
      a("Jubilee Hills", 190, "municipal", 17.43, 78.41),
      a("Banjara Hills", 170, "municipal", 17.41, 78.44),
    ],
  },
  {
    name: "Delhi",
    lat: 28.61,
    lon: 77.21,
    chip: true,
    areas: [
      a("Connaught Place", 180, "municipal", 28.63, 77.22),
      a("Laxmi Nagar", 300, "mixed", 28.63, 77.28),
      a("Saket", 360, "mixed", 28.52, 77.21),
      a("Rohini", 380, "mixed", 28.74, 77.07),
      a("Janakpuri", 420, "mixed", 28.62, 77.08),
      a("Vasant Kunj", 480, "borewell", 28.52, 77.16),
      a("Dwarka", 520, "borewell", 28.59, 77.05),
    ],
  },
  {
    name: "Gurugram",
    lat: 28.46,
    lon: 77.03,
    chip: true,
    areas: [
      a("DLF Phase 1–3", 540, "mixed", 28.49, 77.09),
      a("MG Road", 560, "mixed", 28.48, 77.08),
      a("Sector 56", 580, "mixed", 28.42, 77.1),
      a("Golf Course Road", 600, "mixed", 28.45, 77.1),
      a("Sohna Road", 720, "borewell", 28.4, 77.04),
      a("New Gurugram (Sec 80–95)", 760, "borewell", 28.4, 76.96),
    ],
  },
  {
    name: "Jaipur",
    lat: 26.91,
    lon: 75.79,
    chip: true,
    areas: [
      a("C-Scheme", 440, "municipal", 26.91, 75.8),
      a("Malviya Nagar", 520, "mixed", 26.85, 75.81),
      a("Mansarovar", 580, "borewell", 26.86, 75.76),
      a("Vaishali Nagar", 600, "borewell", 26.91, 75.74),
      a("Sanganer", 620, "borewell", 26.82, 75.79),
      a("Jagatpura", 640, "borewell", 26.83, 75.86),
    ],
  },
  {
    name: "Mumbai",
    lat: 19.08,
    lon: 72.88,
    chip: true,
    areas: [
      a("Bandra", 90, "municipal", 19.06, 72.84),
      a("Borivali", 100, "municipal", 19.23, 72.86),
      a("Andheri", 110, "municipal", 19.12, 72.85),
      a("Powai", 120, "municipal", 19.12, 72.91),
      a("Navi Mumbai", 130, "municipal", 19.03, 73.03),
      a("Thane", 140, "municipal", 19.22, 72.98),
      a("Mira Road", 260, "mixed", 19.28, 72.87),
    ],
  },
  {
    name: "Pune",
    lat: 18.52,
    lon: 73.86,
    chip: true,
    areas: [
      a("Kothrud", 160, "municipal", 18.51, 73.81),
      a("Viman Nagar", 220, "municipal", 18.57, 73.91),
      a("Baner", 280, "mixed", 18.56, 73.79),
      a("Hadapsar", 300, "mixed", 18.5, 73.93),
      a("Kharadi", 340, "mixed", 18.55, 73.94),
      a("Wakad", 380, "mixed", 18.6, 73.76),
      a("Hinjewadi", 420, "borewell", 18.59, 73.74),
    ],
  },
  {
    name: "Kolkata",
    lat: 22.57,
    lon: 88.36,
    chip: true,
    areas: [
      a("Park Street", 160, "municipal", 22.55, 88.35),
      a("Salt Lake", 260, "mixed", 22.58, 88.41),
      a("Dum Dum", 260, "mixed", 22.62, 88.42),
      a("Behala", 280, "mixed", 22.5, 88.31),
      a("New Town", 300, "mixed", 22.58, 88.46),
      a("Howrah", 320, "mixed", 22.59, 88.31),
    ],
  },
  {
    name: "Ahmedabad",
    lat: 23.02,
    lon: 72.57,
    chip: true,
    areas: [
      a("Navrangpura", 340, "municipal", 23.04, 72.56),
      a("Satellite", 380, "mixed", 23.03, 72.52),
      a("Prahlad Nagar", 400, "mixed", 23.01, 72.51),
      a("Maninagar", 420, "mixed", 22.99, 72.6),
      a("Gota", 480, "borewell", 23.1, 72.54),
      a("Bopal", 520, "borewell", 23.03, 72.46),
    ],
  },
  {
    name: "Noida",
    lat: 28.54,
    lon: 77.39,
    areas: [
      a("Sector 18", 480, "mixed", 28.57, 77.32),
      a("Sector 62", 560, "borewell", 28.62, 77.36),
      a("Greater Noida West", 620, "borewell", 28.6, 77.43),
    ],
  },
  { name: "Kochi", ppm: 70, lat: 9.93, lon: 76.27 },
  { name: "Lucknow", ppm: 330, lat: 26.85, lon: 80.95 },
  { name: "Coimbatore", ppm: 380, lat: 11.02, lon: 76.96 },
  { name: "Visakhapatnam", ppm: 300, lat: 17.69, lon: 83.22 },
];

// Every city's areas are listed hardest first (stable, so ties keep their order).
export const CITIES: City[] = RAW_CITIES.map((c) =>
  c.areas ? { ...c, areas: [...c.areas].sort((x, y) => y.ppm - x.ppm) } : c,
);

export const cityPpm = (c: City) =>
  c.areas?.length
    ? Math.round(c.areas.reduce((s, x) => s + x.ppm, 0) / c.areas.length / 10) *
      10
    : (c.ppm ?? 0);

export type Level = {
  label: "Soft" | "Moderate" | "Hard" | "Very hard";
  ink: string;
  tint: string;
  step: 1 | 2 | 3 | 4;
};
export const level = (ppm: number): Level =>
  ppm < 75
    ? { label: "Soft", ink: "#0E7C6B", tint: "#DDF7F1", step: 1 }
    : ppm < 150
      ? { label: "Moderate", ink: "#8A5A00", tint: "#FEF3C7", step: 2 }
      : ppm < 300
        ? { label: "Hard", ink: "#B4410C", tint: "#FFEDD5", step: 3 }
        : { label: "Very hard", ink: "#B42318", tint: "#FEE4E2", step: 4 };

// The gauge runs 0–800 ppm.
export const GAUGE_MAX = 800;
export const gaugePct = (ppm: number) =>
  Math.min(97, Math.max(3, (ppm / GAUGE_MAX) * 100));

// Area filter presets, one per level. Readings are in steps of 10, so these
// bounds line up exactly with the cut-offs in `level`.
export const FILTER_STEP = 10;
export const LEVEL_RANGES: {
  label: Level["label"];
  min: number;
  max: number;
}[] = [
  { label: "Soft", min: 0, max: 70 },
  { label: "Moderate", min: 80, max: 140 },
  { label: "Hard", min: 150, max: 290 },
  { label: "Very hard", min: 300, max: GAUGE_MAX },
];

// Areas whose reading falls inside [min, max]; the top end of the scale is open.
export const areasInRange = (areas: Area[], min: number, max: number) =>
  areas.filter((x) => x.ppm >= min && (max >= GAUGE_MAX || x.ppm <= max));

export const km = (
  p: { lat: number; lon: number },
  q: { lat: number; lon: number },
) => {
  const r = Math.PI / 180;
  const x =
    Math.sin(((q.lat - p.lat) * r) / 2) ** 2 +
    Math.cos(p.lat * r) *
      Math.cos(q.lat * r) *
      Math.sin(((q.lon - p.lon) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
};

// Where coordinates land: an area when one is close, else the nearest city.
export function nearest(here: { lat: number; lon: number }) {
  let best: { city: City; area: Area | null; dist: number } | null = null;
  for (const city of CITIES) {
    for (const area of city.areas || []) {
      const d = km(here, area);
      if (!best || d < best.dist) best = { city, area, dist: d };
    }
    const d = km(here, city);
    if (!best || d < best.dist) best = { city, area: null, dist: d };
  }
  return best!;
}

// Share of the city's other areas that are softer than this one (0–100).
export const harderThan = (city: City, area: Area) => {
  const others = (city.areas || []).filter((x) => x !== area);
  if (!others.length) return null;
  return Math.round(
    (others.filter((x) => x.ppm < area.ppm).length / others.length) * 100,
  );
};

export type Place = { city: City; area: Area | null };

// Search by city or area name, cities first, then areas that start with the text.
export function searchPlaces(query: string, limit = 6): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: (Place & { score: number })[] = [];
  for (const city of CITIES) {
    const cn = city.name.toLowerCase();
    if (cn.includes(q))
      hits.push({ city, area: null, score: cn.startsWith(q) ? 0 : 2 });
    for (const area of city.areas || []) {
      const an = area.name.toLowerCase();
      if (an.includes(q))
        hits.push({ city, area, score: an.startsWith(q) ? 1 : 3 });
    }
  }
  return hits
    .sort((x, y) => x.score - y.score)
    .slice(0, limit)
    .map(({ city, area }) => ({ city, area }));
}

export const findPlace = (
  cityName: string,
  areaName?: string | null,
): Place | null => {
  const city = CITIES.find((c) => c.name === cityName);
  if (!city) return null;
  const area = areaName
    ? city.areas?.find((x) => x.name === areaName) || null
    : null;
  return { city, area };
};
