"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronLeft,
  Drill,
  Droplets,
  Flame,
  LocateFixed,
  MapPin,
  Search,
  Shirt,
  ShowerHead,
  Sparkles,
  Waves,
} from "lucide-react";
import ArrowScroller from "./ArrowScroller";
import { storage, useReducedMotion } from "./hooks";
import {
  areasInRange,
  CITIES,
  cityPpm,
  FILTER_STEP,
  findPlace,
  GAUGE_MAX,
  gaugePct,
  harderThan,
  level,
  LEVEL_RANGES,
  nearest,
  searchPlaces,
  type Area,
  type City,
  type Place,
  type Supply,
} from "./hardnessData";

const SAVED_KEY = "aqua.hardness";

type Source = "near" | "region" | "picked" | "saved";
type View =
  | { step: "pick"; failed: boolean }
  | { step: "locating" }
  | { step: "area"; city: City; guessed?: boolean }
  | { step: "report"; city: City; area: Area | null; source: Source };

const SUPPLY: Record<Supply, { label: string; Icon: typeof Building2 }> = {
  municipal: { label: "Mostly municipal supply", Icon: Building2 },
  borewell: { label: "Mostly borewell water", Icon: Drill },
  mixed: { label: "Municipal + borewell mix", Icon: Waves },
};

// What the level means at home, mildest to worst (index = level step - 1).
const IMPACT = [
  {
    Icon: Flame,
    title: "Geyser & kettle",
    lines: [
      "Little or no scale",
      "Slow scale build-up",
      "Scale every few months",
      "Heavy scale, more power used",
    ],
  },
  {
    Icon: Sparkles,
    title: "Skin & hair",
    lines: ["Feels soft", "Mostly fine", "Can feel dry", "Dry skin, dull hair"],
  },
  {
    Icon: ShowerHead,
    title: "Taps & tiles",
    lines: ["Stay clean", "Faint spots", "White spots", "Stubborn white crust"],
  },
  {
    Icon: Shirt,
    title: "Soap & laundry",
    lines: [
      "Lathers well",
      "Lathers fine",
      "Needs more soap",
      "Poor lather, stiff clothes",
    ],
  },
];

const card = {
  width: "100%",
  maxWidth: 560,
  textAlign: "left" as const,
  borderRadius: 22,
  // Not clipped, so the search results can hang below the card.
  animation: "aqCardIn .5s cubic-bezier(.22,.8,.24,1) .15s both",
};

// Counts up to the reading so the number lands rather than appears.
function useCountUp(target: number, run: boolean) {
  const [n, setN] = useState(run ? 0 : target);
  useEffect(() => {
    if (!run) return void setN(target);
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 750);
      setN(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return n;
}

function PlaceSearch({
  onPick,
  placeholder,
  cityOnly,
}: {
  onPick: (p: Place) => void;
  placeholder: string;
  cityOnly?: City;
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const results = useMemo(() => {
    if (!cityOnly) return searchPlaces(q);
    const s = q.trim().toLowerCase();
    return s
      ? (cityOnly.areas || [])
          .filter((x) => x.name.toLowerCase().includes(s))
          .map((area) => ({ city: cityOnly, area }))
      : [];
  }, [q, cityOnly]);
  const pick = (p: Place) => {
    setQ("");
    onPick(p);
  };
  return (
    <div className="aq-hard-search">
      <Search size={15} aria-hidden="true" />
      <input
        type="search"
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={listId}
        aria-activedescendant={
          results.length ? `${listId}-${active}` : undefined
        }
        aria-label={placeholder}
        placeholder={placeholder}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (!results.length) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setActive(
              (i) =>
                (i + (e.key === "ArrowDown" ? 1 : results.length - 1)) %
                results.length,
            );
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(results[active]);
          } else if (e.key === "Escape") setQ("");
        }}
      />
      {results.length > 0 && (
        <ul id={listId} role="listbox" className="aq-hard-results">
          {results.map((r, i) => {
            const ppm = r.area?.ppm ?? cityPpm(r.city);
            const lv = level(ppm);
            return (
              <li
                key={`${r.city.name}/${r.area?.name ?? ""}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(r);
                }}
              >
                <MapPin size={13} aria-hidden="true" />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b>{r.area?.name ?? r.city.name}</b>
                  <span style={{ color: "var(--aq-mut)" }}>
                    {r.area
                      ? `, ${r.city.name}`
                      : r.city.areas
                        ? " · pick an area next"
                        : ""}
                  </span>
                </span>
                <span
                  className="aq-hard-pill"
                  style={{ background: lv.tint, color: lv.ink }}
                >
                  ~{ppm}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Legend() {
  return (
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
  );
}

type Range = [number, number];
const FULL_RANGE: Range = [0, GAUGE_MAX];

// Two thumbs on one hardness bar, plus a chip per level that jumps to its band.
function RangeFilter({
  range,
  onChange,
}: {
  range: Range;
  onChange: (r: Range) => void;
}) {
  const [lo, hi] = range;
  // Folded by default so the area list stays close; the arrow opens it.
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const pct = (v: number) => (v / GAUGE_MAX) * 100;
  const fmt = (v: number) => (v >= GAUGE_MAX ? `${GAUGE_MAX}+` : `${v}`);
  const active = lo !== FULL_RANGE[0] || hi !== FULL_RANGE[1];
  return (
    <div className="aq-hard-filter">
      <button
        type="button"
        className="aq-hard-toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className="aq-label"
          style={{ fontSize: 10.5, flex: 1, textAlign: "left" }}
        >
          Filter by hardness
        </span>
        {active && (
          <span className="aq-hard-filter-val">
            {fmt(lo)}–{fmt(hi)} ppm
          </span>
        )}
        <ChevronDown
          size={15}
          aria-hidden="true"
          style={{
            transition: "transform .25s",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>
      <div id={bodyId} className="aq-hard-filter-body" hidden={!open}>
        <div
          className="aq-hard-range"
          style={{
            ["--lo" as string]: `${pct(lo)}%`,
            ["--hi" as string]: `${pct(hi)}%`,
          }}
        >
          <span className="aq-hard-range-track" aria-hidden="true" />
          <input
            type="range"
            min={0}
            max={GAUGE_MAX}
            step={FILTER_STEP}
            value={lo}
            aria-label="Minimum hardness"
            aria-valuetext={`${lo} ppm, ${level(lo).label}`}
            onChange={(e) =>
              onChange([Math.min(Number(e.target.value), hi), hi])
            }
          />
          <input
            type="range"
            min={0}
            max={GAUGE_MAX}
            step={FILTER_STEP}
            value={hi}
            aria-label="Maximum hardness"
            aria-valuetext={`${fmt(hi)} ppm, ${level(hi).label}`}
            onChange={(e) =>
              onChange([lo, Math.max(Number(e.target.value), lo)])
            }
          />
        </div>
        <div className="aq-hard-filter-chips">
          {LEVEL_RANGES.map((r) => {
            const on = lo === r.min && hi === r.max;
            const lv = level(r.min);
            return (
              <button
                key={r.label}
                type="button"
                className="aq-chip aq-chip-soft aq-hard-level-chip"
                aria-pressed={on}
                onClick={() => onChange(on ? FULL_RANGE : [r.min, r.max])}
                style={
                  on
                    ? {
                        background: lv.tint,
                        color: lv.ink,
                        borderColor: lv.ink,
                      }
                    : undefined
                }
              >
                <span
                  className="aq-hard-dot"
                  style={{ background: lv.ink }}
                  aria-hidden="true"
                />
                {r.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// `compact` (phones): the report folds its "at home" details so the composer
// and suggestions stay close.
export default function HardnessCard({
  onAsk,
  compact = false,
}: {
  onAsk: (text: string) => void;
  compact?: boolean;
}) {
  const [view, setView] = useState<View>({ step: "pick", failed: false });
  // Kept across cities so "show me very hard areas" carries over when comparing.
  const [range, setRange] = useState<Range>(FULL_RANGE);
  const reduced = useReducedMotion();

  const show = (place: Place, source: Source) => {
    if (!place.area && place.city.areas?.length && source === "picked")
      return setView({ step: "area", city: place.city });
    setView({ step: "report", city: place.city, area: place.area, source });
    if (source !== "saved")
      storage.set(
        SAVED_KEY,
        JSON.stringify({
          city: place.city.name,
          area: place.area?.name ?? null,
        }),
      );
  };

  // Coordinates are matched to the nearest area in the browser; nothing is sent anywhere.
  const locate = () => {
    if (!("geolocation" in navigator))
      return setView({ step: "pick", failed: true });
    setView({ step: "locating" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const hit = nearest({ lat: coords.latitude, lon: coords.longitude });
        if (hit.area && hit.dist < 6)
          show({ city: hit.city, area: hit.area }, "near");
        else if (hit.dist < 80 && hit.city.areas?.length)
          setView({ step: "area", city: hit.city, guessed: true });
        else
          show(
            { city: hit.city, area: null },
            hit.dist < 80 ? "near" : "region",
          );
      },
      () => setView({ step: "pick", failed: true }),
      { timeout: 9000, maximumAge: 600000 },
    );
  };

  // Last pick first; otherwise locate on load only when permission was already
  // granted, so the page never opens with a permission prompt.
  useEffect(() => {
    try {
      const saved = JSON.parse(storage.get(SAVED_KEY) || "null");
      const place = saved && findPlace(saved.city, saved.area);
      if (place) return show(place, "saved");
    } catch {
      // unreadable: ask again
    }
    navigator.permissions
      ?.query({ name: "geolocation" as PermissionName })
      .then((s) => s.state === "granted" && locate())
      .catch(() => {});
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- pick a city ----------
  if (view.step === "pick" || view.step === "locating") {
    const locating = view.step === "locating";
    const failed = view.step === "pick" && view.failed;
    return (
      <div
        className="aq-glass aq-hard-card"
        data-tour="hardness"
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
                ? "Finding your area…"
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
                ? "Search or pick your city instead."
                : "Search your area, or pick a city. Hardness changes a lot between areas."}
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
        <div style={{ padding: "0 16px 12px" }}>
          <PlaceSearch
            placeholder="Search city or area, e.g. Gachibowli"
            onPick={(p) => show(p, "picked")}
          />
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
              onClick={() => show({ city: c, area: null }, "picked")}
              style={{
                animation: `aqChipIn .35s cubic-bezier(.2,.8,.2,1) ${0.15 + i * 0.03}s both`,
              }}
            >
              <MapPin size={12} aria-hidden="true" />
              {c.name}
              <span
                className="aq-hard-dot"
                style={{ background: level(cityPpm(c)).ink }}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
        <Legend />
      </div>
    );
  }

  // ---------- pick an area ----------
  if (view.step === "area") {
    const { city } = view;
    const avg = cityPpm(city);
    const all = city.areas || [];
    const areas = areasInRange(all, range[0], range[1]);
    const filtered = areas.length !== all.length;
    return (
      <div
        className="aq-glass aq-hard-card"
        data-tour="hardness"
        style={{ ...card, display: "flex", flexDirection: "column" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 16px 10px",
          }}
        >
          <button
            type="button"
            className="aq-icon-btn"
            onClick={() => setView({ step: "pick", failed: false })}
            aria-label="Back to cities"
          >
            <ChevronLeft size={16} />
          </button>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>
              {view.guessed
                ? `Looks like you're in ${city.name}. Which area?`
                : `Which part of ${city.name}?`}
            </span>
            <span
              style={{
                fontSize: 12.5,
                color: "var(--aq-mut)",
                fontWeight: 500,
              }}
            >
              Hardest first. Borewell areas usually run much harder than
              municipal supply.
            </span>
          </span>
        </div>
        <div style={{ padding: "0 16px 10px" }}>
          <PlaceSearch
            placeholder={`Search areas in ${city.name}`}
            cityOnly={city}
            onPick={(p) => show(p, "picked")}
          />
        </div>
        <RangeFilter range={range} onChange={setRange} />
        <div className="aq-hard-filter-count" role="status">
          {filtered
            ? `${areas.length} of ${all.length} areas`
            : `All ${all.length} areas`}
          {filtered && (
            <button
              type="button"
              className="aq-hard-link"
              onClick={() => setRange(FULL_RANGE)}
            >
              Show all
            </button>
          )}
        </div>
        {!areas.length && (
          <p className="aq-hard-filter-empty">
            No {city.name} areas in this range. Widen the slider or pick another
            level.
          </p>
        )}
        <ArrowScroller className="aq-hard-areas" label="areas">
          {areas.map((x, i) => {
            const lv = level(x.ppm);
            return (
              <button
                key={x.name}
                type="button"
                className="aq-hard-area"
                onClick={() => show({ city, area: x }, "picked")}
                style={{
                  animation: `aqChipIn .35s cubic-bezier(.2,.8,.2,1) ${0.05 + i * 0.025}s both`,
                }}
              >
                <span
                  className="aq-hard-dot"
                  style={{ background: lv.ink }}
                  aria-hidden="true"
                />
                <span className="aq-hard-area-name">{x.name}</span>
                <span className="aq-hard-area-ppm" style={{ color: lv.ink }}>
                  ~{x.ppm}
                </span>
              </button>
            );
          })}
        </ArrowScroller>
        <div style={{ padding: "4px 16px 14px" }}>
          <button
            type="button"
            className="aq-hard-link"
            onClick={() => show({ city, area: null }, "region")}
          >
            Area not listed? Use the {city.name} average (~{avg} ppm)
          </button>
        </div>
        <Legend />
      </div>
    );
  }

  return (
    <Report
      key={`${view.city.name}/${view.area?.name ?? ""}`}
      view={view}
      reduced={reduced}
      compact={compact}
      onAsk={onAsk}
      setView={setView}
    />
  );
}

function Report({
  view,
  reduced,
  compact,
  onAsk,
  setView,
}: {
  view: Extract<View, { step: "report" }>;
  reduced: boolean;
  compact: boolean;
  onAsk: (text: string) => void;
  setView: (v: View) => void;
}) {
  const [details, setDetails] = useState(!compact);
  const detailsId = useId();
  const { city, area, source } = view;
  const ppm = area?.ppm ?? cityPpm(city);
  const lv = level(ppm);
  const shown = useCountUp(ppm, !reduced);
  const [marker, setMarker] = useState(reduced ? gaugePct(ppm) : 0);
  const raf = useRef(0);
  useEffect(() => {
    raf.current = requestAnimationFrame(() => setMarker(gaugePct(ppm)));
    return () => cancelAnimationFrame(raf.current);
  }, [ppm]);

  const place = area ? `${area.name}, ${city.name}` : city.name;
  const sourceLabel =
    source === "near"
      ? "Near you"
      : source === "saved"
        ? "Your area"
        : source === "region"
          ? area
            ? "Estimate"
            : "City average"
          : "Estimate";
  const rank = area ? harderThan(city, area) : null;
  const supply = area ? SUPPLY[area.supply] : null;
  const verdict =
    lv.step === 4
      ? {
          title: "A softener is recommended",
          text: "At this hardness, scale builds up fast in geysers, taps and pipes.",
          cta: "Find a softener",
          ask: `I need a water softener for ${place}. Hardness is about ${ppm} ppm.`,
        }
      : lv.step === 3
        ? {
            title: "A softener will help",
            text: "Protects geysers and bathroom fittings from slow scaling.",
            cta: "See softeners",
            ask: `Suggest a water softener for ${place}. Hardness is about ${ppm} ppm.`,
          }
        : {
            title: "A purifier is usually enough",
            text: "Your water is fairly soft. Focus on taste and safety.",
            cta: "See purifiers",
            ask: `Suggest a water purifier for ${place}. Hardness is about ${ppm} ppm.`,
          };

  return (
    <div
      className="aq-glass aq-hard-card aq-hard-report"
      data-tour="hardness"
      style={{
        ...card,
        ["--lv" as string]: lv.ink,
        ["--lvt" as string]: lv.tint,
      }}
    >
      {/* headline */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "16px 16px 10px",
        }}
      >
        <span className="aq-hard-pin" aria-hidden="true">
          <MapPin size={18} />
        </span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <span
            style={{ fontSize: 12, color: "var(--aq-mut)", fontWeight: 600 }}
          >
            Water hardness · {sourceLabel}
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>
            {place}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 2,
            }}
          >
            <span
              className="aq-display"
              style={{
                fontSize: compact ? 26 : 30,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
              aria-hidden="true"
            >
              ~{shown}
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--aq-mut)",
                  marginLeft: 4,
                }}
              >
                ppm
              </span>
            </span>
            <span className="aq-sr-only">About {ppm} ppm.</span>
            <span
              className="aq-hard-pill"
              style={{
                background: lv.tint,
                color: lv.ink,
                fontSize: 11.5,
                padding: "3px 10px",
              }}
            >
              {lv.label}
            </span>
          </span>
        </span>
      </div>

      {/* gauge */}
      <div style={{ padding: "4px 16px 2px" }}>
        <div
          className="aq-hard-gauge"
          role="img"
          aria-label={`${lv.label}: about ${ppm} ppm on a scale to 800`}
        >
          <span
            className="aq-hard-marker"
            style={{ left: `${marker}%`, borderColor: lv.ink }}
          />
        </div>
        <div className="aq-hard-ticks" aria-hidden="true">
          <span style={{ left: "0%" }}>0</span>
          <span style={{ left: `${gaugePct(75)}%` }}>75</span>
          <span style={{ left: `${gaugePct(150)}%` }}>150</span>
          <span style={{ left: `${gaugePct(300)}%` }}>300</span>
          <span style={{ left: "100%" }}>800+</span>
        </div>
      </div>

      {/* facts */}
      {(supply || rank !== null) && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            padding: "10px 16px 0",
          }}
        >
          {supply && (
            <span className="aq-hard-fact">
              <supply.Icon size={13} aria-hidden="true" /> {supply.label}
            </span>
          )}
          {rank !== null && (
            <span className="aq-hard-fact">
              {rank === 100
                ? `Hardest area in ${city.name}`
                : rank === 0
                  ? `Softest area in ${city.name}`
                  : rank >= 50
                    ? `Harder than ${rank}% of ${city.name} areas`
                    : `Softer than ${100 - rank}% of ${city.name} areas`}
            </span>
          )}
        </div>
      )}

      {/* at home */}
      <div style={{ padding: "10px 16px 0" }}>
        <button
          type="button"
          className="aq-hard-toggle"
          aria-expanded={details}
          aria-controls={detailsId}
          onClick={() => setDetails((d) => !d)}
        >
          <span
            className="aq-label"
            style={{ fontSize: 10.5, flex: 1, textAlign: "left" }}
          >
            What it means at home
          </span>
          <span
            className="aq-hard-meter"
            style={{ width: 44, marginTop: 0 }}
            aria-hidden="true"
          >
            {[1, 2, 3, 4].map((s) => (
              <i
                key={s}
                style={s <= lv.step ? { background: lv.ink } : undefined}
              />
            ))}
          </span>
          <ChevronDown
            size={15}
            aria-hidden="true"
            style={{
              transition: "transform .25s",
              transform: details ? "rotate(180deg)" : "none",
            }}
          />
        </button>
        <div id={detailsId} className="aq-hard-impact" hidden={!details}>
          {IMPACT.map(({ Icon, title, lines }, i) => (
            <div
              key={title}
              className="aq-hard-tile"
              style={{ animationDelay: `${0.12 + i * 0.05}s` }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon size={14} aria-hidden="true" style={{ color: lv.ink }} />
                <span style={{ fontSize: 11.5, fontWeight: 700 }}>{title}</span>
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--aq-body)",
                  lineHeight: 1.35,
                }}
              >
                {lines[lv.step - 1]}
              </span>
              <span
                className="aq-hard-meter"
                aria-label={`Impact ${lv.step} of 4`}
              >
                {[1, 2, 3, 4].map((s) => (
                  <i
                    key={s}
                    style={s <= lv.step ? { background: lv.ink } : undefined}
                  />
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* verdict */}
      <div className="aq-hard-verdict">
        <span
          style={{
            flex: 1,
            minWidth: 180,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>
            {verdict.title}
          </span>
          <span style={{ fontSize: 12.5, lineHeight: 1.4, opacity: 0.85 }}>
            {verdict.text}
          </span>
        </span>
        <button
          type="button"
          className="aq-btn aq-hard-cta"
          onClick={() => onAsk(verdict.ask)}
        >
          {verdict.cta} <ArrowRight size={14} />
        </button>
      </div>

      {/* follow-ups + change place */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          padding: "0 16px 12px",
        }}
      >
        {lv.step >= 3 && (
          <button
            type="button"
            className="aq-chip aq-chip-soft"
            onClick={() =>
              onAsk(
                `What size softener does a family of 4 need in ${place}? Hardness is about ${ppm} ppm.`,
              )
            }
          >
            Size a softener for my home
          </button>
        )}
        <button
          type="button"
          className="aq-chip aq-chip-soft"
          onClick={() =>
            onAsk(
              `How can I test the hardness of my water at home in ${place}?`,
            )
          }
        >
          How do I test my water?
        </button>
      </div>
      <div className="aq-hard-foot">
        <span style={{ flex: 1, minWidth: 0 }}>
          Estimate from typical supply here, not a test of your water.
        </span>
        {city.areas?.length ? (
          <button
            type="button"
            className="aq-hard-link"
            onClick={() => setView({ step: "area", city })}
          >
            Change area
          </button>
        ) : null}
        <button
          type="button"
          className="aq-hard-link"
          onClick={() => setView({ step: "pick", failed: false })}
        >
          Change city
        </button>
      </div>
    </div>
  );
}
