"use client";

import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";

// TODO(backend): replace with hardness data by city or PIN. These are rough regional
// estimates carried over from V4 and are labelled as such in the UI.
const CITIES: [string, number][] = [
  ["Hyderabad", 390],
  ["Bengaluru", 460],
  ["Chennai", 480],
  ["Delhi", 410],
  ["Gurugram", 620],
  ["Mumbai", 110],
  ["Pune", 210],
  ["Kolkata", 240],
  ["Ahmedabad", 430],
  ["Kochi", 70],
];

const level = (ppm: number) =>
  ppm < 75
    ? ["Soft", "#0E7C6B", "#DDF7F1"]
    : ppm < 150
      ? ["Moderate", "#8A5A00", "#FEF3C7"]
      : ppm < 300
        ? ["Hard", "#B4410C", "#FFEDD5"]
        : ["Very hard", "#B42318", "#FEE4E2"];

export default function HardnessCard({
  onAsk,
}: {
  onAsk: (text: string) => void;
}) {
  const [city, setCity] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const ppm = CITIES.find(([c]) => c === city)?.[1] ?? 0;
  const [lv, ink, tint] = level(ppm);

  return (
    <div
      className="aq-glass"
      style={{
        width: "100%",
        maxWidth: 520,
        textAlign: "left",
        borderRadius: 22,
        overflow: "hidden",
        animation: "aqCardIn .5s cubic-bezier(.22,.8,.24,1) .15s both",
      }}
    >
      {!city ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: "50%",
                background: "rgba(16,191,164,.16)",
                display: "grid",
                placeItems: "center",
                color: "#0E7C6B",
              }}
            >
              <MapPin size={18} />
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>
                How hard is your water?
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--aq-mut)",
                  fontWeight: 500,
                }}
              >
                Pick your city for an estimate
              </span>
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CITIES.map(([c]) => (
              <button
                key={c}
                type="button"
                className="aq-chip"
                onClick={() => setCity(c)}
                style={{
                  color: "var(--aq-ink)",
                  borderColor: "rgba(var(--aq-gl),.7)",
                  background: "rgba(var(--aq-gl),.3)",
                  fontWeight: 600,
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
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
                style={{
                  fontSize: 12,
                  color: "var(--aq-mut)",
                  fontWeight: 600,
                }}
              >
                Water hardness in {city} · Estimate
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
                onClick={() => setCity(null)}
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
              <button
                type="button"
                className="aq-chip"
                onClick={() =>
                  onAsk(
                    ppm >= 300
                      ? `I need a water softener. Hardness in ${city} is about ${ppm} ppm.`
                      : `Suggest a water purifier for ${city}. Hardness is about ${ppm} ppm.`,
                  )
                }
              >
                {ppm >= 300 ? "Find a softener →" : "See what fits my water →"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
