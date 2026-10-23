"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Droplets, LocateFixed, MapPin } from "lucide-react";

// TODO(backend): replace with hardness data by city or PIN. These are rough regional
// estimates carried over from V4 and are labelled as such in the UI.
type City = {
  name: string;
  ppm: number;
  lat: number;
  lon: number;
  chip?: boolean;
};
const CITIES: City[] = [
  { name: "Bengaluru", ppm: 460, lat: 12.97, lon: 77.59, chip: true },
  { name: "Chennai", ppm: 480, lat: 13.08, lon: 80.27, chip: true },
  { name: "Hyderabad", ppm: 390, lat: 17.39, lon: 78.49, chip: true },
  { name: "Delhi", ppm: 410, lat: 28.61, lon: 77.21, chip: true },
  { name: "Gurugram", ppm: 620, lat: 28.46, lon: 77.03, chip: true },
  { name: "Jaipur", ppm: 560, lat: 26.91, lon: 75.79, chip: true },
  { name: "Mumbai", ppm: 110, lat: 19.08, lon: 72.88, chip: true },
  { name: "Pune", ppm: 210, lat: 18.52, lon: 73.86, chip: true },
  { name: "Kolkata", ppm: 240, lat: 22.57, lon: 88.36, chip: true },
  { name: "Ahmedabad", ppm: 430, lat: 23.02, lon: 72.57, chip: true },
  { name: "Kochi", ppm: 70, lat: 9.93, lon: 76.27 },
  { name: "Lucknow", ppm: 330, lat: 26.85, lon: 80.95 },
  { name: "Noida", ppm: 520, lat: 28.54, lon: 77.39 },
  { name: "Coimbatore", ppm: 380, lat: 11.02, lon: 76.96 },
  { name: "Visakhapatnam", ppm: 300, lat: 17.69, lon: 83.22 },
];

const km = (
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) => {
  const r = Math.PI / 180;
  const x =
    Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
    Math.cos(a.lat * r) *
      Math.cos(b.lat * r) *
      Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
};

const level = (ppm: number) =>
  ppm < 75
    ? ["Soft", "#0E7C6B", "#DDF7F1"]
    : ppm < 150
      ? ["Moderate", "#8A5A00", "#FEF3C7"]
      : ppm < 300
        ? ["Hard", "#B4410C", "#FFEDD5"]
        : ["Very hard", "#B42318", "#FEE4E2"];

type Geo =
  | { status: "ask"; failed: boolean }
  | { status: "locating" }
  | { status: "ok"; city: City; source: "near" | "region" | "picked" };

export default function HardnessCard({
  onAsk,
}: {
  onAsk: (text: string) => void;
}) {
  const [geo, setGeo] = useState<Geo>({ status: "ask", failed: false });
  const [open, setOpen] = useState(false);

  // Coordinates are matched to the nearest city in the browser; nothing is sent anywhere.
  const locate = () => {
    if (!("geolocation" in navigator))
      return setGeo({ status: "ask", failed: true });
    setGeo({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const here = { lat: coords.latitude, lon: coords.longitude };
        const [city, dist] = CITIES.map((c) => [c, km(here, c)] as const).sort(
          (a, b) => a[1] - b[1],
        )[0];
        setGeo({ status: "ok", city, source: dist < 80 ? "near" : "region" });
      },
      () => setGeo({ status: "ask", failed: true }),
      { timeout: 9000, maximumAge: 600000 },
    );
  };

  // Only locate on load when permission was already granted, so the page never
  // opens with a permission prompt.
  useEffect(() => {
    navigator.permissions
      ?.query({ name: "geolocation" as PermissionName })
      .then((s) => {
        if (s.state === "granted") locate();
      })
      .catch(() => {});
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const card = {
    width: "100%",
    maxWidth: 560,
    textAlign: "left" as const,
    borderRadius: 22,
    overflow: "hidden",
    animation: "aqCardIn .5s cubic-bezier(.22,.8,.24,1) .15s both",
  };

  if (geo.status !== "ok") {
    const locating = geo.status === "locating";
    const failed = geo.status === "ask" && geo.failed;
    return (
      <div
        className="aq-glass aq-hard-card"
        style={{ ...card, display: "flex", flexDirection: "column" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            padding: "16px 16px 12px",
          }}
        >
          <span className="aq-hard-icon" aria-hidden="true">
            <Droplets size={20} />
          </span>
          <span
            style={{
              flex: "1 1 200px",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span
              role={locating ? "status" : undefined}
              style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}
            >
              {locating
                ? "Checking water hardness near you…"
                : failed
                  ? "Couldn't get your location"
                  : "How hard is your water?"}
            </span>
            <span
              style={{
                fontSize: 12.5,
                color: "var(--aq-mut)",
                fontWeight: 500,
              }}
            >
              {failed
                ? "Pick your city instead. Readings are regional estimates."
                : "Pick your city or use your location for an estimate."}
            </span>
          </span>
          <button
            type="button"
            className="aq-btn aq-locate-btn"
            onClick={locate}
            disabled={locating}
          >
            <LocateFixed
              size={15}
              style={
                locating
                  ? { animation: "aqSpin 1.2s linear infinite" }
                  : undefined
              }
            />
            {locating ? "Locating…" : "Use my location"}
          </button>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            padding: "0 16px 14px",
          }}
        >
          {CITIES.filter((c) => c.chip).map((c, i) => (
            <button
              key={c.name}
              type="button"
              className="aq-chip aq-chip-soft aq-city-chip"
              onClick={() =>
                setGeo({ status: "ok", city: c, source: "picked" })
              }
              style={{
                animation: `aqChipIn .35s cubic-bezier(.2,.8,.2,1) ${0.15 + i * 0.03}s both`,
              }}
            >
              <MapPin size={12} aria-hidden="true" />
              {c.name}
            </button>
          ))}
        </div>
        <div className="aq-hard-legend" aria-hidden="true">
          <span className="aq-hard-bar" />
          <span
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: ".04em",
              color: "var(--aq-mut)",
            }}
          >
            <span>SOFT</span>
            <span>MODERATE</span>
            <span>HARD</span>
            <span>VERY HARD</span>
          </span>
        </div>
      </div>
    );
  }

  const { city, source } = geo;
  const ppm = city.ppm;
  const [lv, ink, tint] = level(ppm);
  const sourceLabel =
    source === "near"
      ? "Near you"
      : source === "region"
        ? "Nearest city, estimate"
        : "Estimate";

  return (
    <div className="aq-glass aq-hard-card" style={card}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          border: 0,
          background: "transparent",
          color: "inherit",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: "50%",
            background: tint,
            color: ink,
            display: "grid",
            placeItems: "center",
          }}
        >
          <MapPin size={18} />
        </span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <span
            style={{ fontSize: 12, color: "var(--aq-mut)", fontWeight: 600 }}
          >
            Water hardness in {city.name} · {sourceLabel}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              className="aq-display"
              style={{ fontSize: 24, fontWeight: 700 }}
            >
              ~{ppm} ppm
            </span>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 800,
                padding: "3px 9px",
                borderRadius: 999,
                background: tint,
                color: ink,
              }}
            >
              {lv}
            </span>
          </span>
        </span>
        <ChevronDown
          size={18}
          style={{
            color: "var(--aq-mut)",
            transition: "transform .25s",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>
      <div
        style={{
          padding: "0 16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            position: "relative",
            height: 8,
            borderRadius: 999,
            background:
              "linear-gradient(90deg, #10BFA4 0%, #10BFA4 12%, #EAB308 25%, #F97316 50%, #DC2626 100%)",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: `${Math.min(97, Math.max(3, (ppm / 600) * 100))}%`,
              width: 16,
              height: 16,
              margin: "-8px 0 0 -8px",
              borderRadius: "50%",
              background: "#fff",
              border: `3px solid ${ink}`,
              boxShadow: "0 2px 6px rgba(0,0,0,.2)",
              transition: "left .6s cubic-bezier(.22,.8,.24,1)",
            }}
          />
        </div>
        {open && (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--aq-body)",
            }}
          >
            {ppm >= 300
              ? `Around ${ppm} ppm, water leaves white scale on taps, geysers and tiles. A softener is usually recommended.`
              : ppm >= 150
                ? `Around ${ppm} ppm you may see some scaling over time. A softener helps protect geysers and fittings.`
                : `Around ${ppm} ppm your water is fairly soft. A purifier for taste and safety is usually enough.`}{" "}
            This is a regional estimate, not a test of your supply.
          </p>
        )}
        {ppm >= 300 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              padding: "10px 12px",
              borderRadius: 14,
              background: "#FEE4E2",
              color: "#7A1A12",
            }}
          >
            <span
              style={{
                flex: 1,
                minWidth: 180,
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.4,
              }}
            >
              Hardness is high here. A softener is usually recommended.
            </span>
            <button
              type="button"
              className="aq-btn"
              onClick={() =>
                onAsk(
                  `I need a water softener. Hardness in ${city.name} is about ${ppm} ppm.`,
                )
              }
              style={{
                height: 36,
                fontSize: 12.5,
                background: "#B42318",
                color: "#fff",
              }}
            >
              Find a softener →
            </button>
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="aq-chip"
            onClick={() => setGeo({ status: "ask", failed: false })}
            style={{
              border: 0,
              background: "transparent",
              color: "var(--aq-mut)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              padding: "6px 0",
            }}
          >
            Not your city? Change
          </button>
          <div style={{ flex: 1 }} />
          {ppm < 300 && (
            <button
              type="button"
              className="aq-chip aq-chip-soft"
              onClick={() =>
                onAsk(
                  `Suggest a water purifier for ${city.name}. Hardness is about ${ppm} ppm.`,
                )
              }
            >
              See what fits my water →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
