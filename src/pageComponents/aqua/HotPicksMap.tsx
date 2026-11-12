"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, MapPin, X } from "lucide-react";
import { getDemandAreas } from "@/services/storefront";
import { cleanProductName, matchProduct } from "@/utils/demandFeed";
import { INR } from "./catalogue";
import {
  heatLabel,
  placeDemand,
  projector,
  type AreaDemand,
  type HotSpot,
} from "./demandMap";
import { useDrawer } from "./useDrawer";
import type { Product } from "./types";

type Props = {
  products: Map<string, Product>;
  // The customer's own locality, picked first when it's on the map.
  area?: string | null;
  onOpen: (id: string) => void;
  onClose: () => void;
};

const WINDOWS = [30, 90] as const;
// Heat blobs grow with orders; the busiest area gets the largest.
const R_MIN = 16;
const R_MAX = 46;
const radius = (heat: number) => R_MIN + (R_MAX - R_MIN) * Math.sqrt(heat);
const tone = (heat: number) =>
  heat >= 0.66 ? "hot" : heat >= 0.33 ? "warm" : "cool";

type Load =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; areas: AreaDemand[] };

// "What's hot near you": orders per locality over the last 30 or 90 days as a
// heatmap of the city, and the most-bought products in the area you tap.
export default function HotPicksMap(p: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const drawer = useDrawer(ref, p.onClose);
  const closeRef = useRef(drawer.close);
  useEffect(() => {
    closeRef.current = drawer.close;
  });
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(90);
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      closeRef.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  useEffect(() => {
    let alive = true;
    getDemandAreas({ days }).then((data) => {
      if (!alive) return;
      const areas = (data?.areas || []) as AreaDemand[];
      setLoad(areas.length ? { status: "ready", areas } : { status: "empty" });
    });
    return () => {
      alive = false;
    };
  }, [days]);

  const map = useMemo(
    () => (load.status === "ready" ? placeDemand(load.areas) : null),
    [load],
  );
  const proj = useMemo(
    () => (map ? projector(map.city.areas || map.spots) : null),
    [map],
  );
  const list = useMemo(() => [...p.products.values()], [p.products]);

  const mine = map?.spots.find(
    (s) => p.area && s.area.toLowerCase() === p.area.toLowerCase(),
  );
  const current: HotSpot | null =
    map?.spots.find((s) => s.area === picked) || mine || map?.spots[0] || null;
  const total = map?.spots.reduce((n, s) => n + s.orders, 0) || 0;

  return (
    <>
      <div
        className="aq-drawer-scrim"
        aria-hidden="true"
        data-leaving={drawer.leaving}
        onClick={drawer.close}
      />
      <div className="aq-drawer-layer">
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby="aq-hm-title"
          tabIndex={-1}
          className="aq-glass aq-drawer aq-pd aq-hm"
          data-leaving={drawer.leaving}
          style={drawer.style}
        >
          <div className="aq-drawer-grip" aria-hidden="true" />
          <header className="aq-pd-head">
            <h2 id="aq-hm-title" className="aq-display aq-pd-title">
              Hot picks near you
            </h2>
            <button
              type="button"
              className="aq-pd-close"
              onClick={drawer.close}
              aria-label="Close hot picks map"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </header>
          <div className="aq-pd-bar">
            <span className="aq-pd-sub">
              {map
                ? `${total} orders across ${map.spots.length} areas of ${map.city.name}`
                : "Where people are buying"}
            </span>
            <div className="aq-hm-days" role="group" aria-label="Time window">
              {WINDOWS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={days === d}
                  onClick={() => {
                    if (d === days) return;
                    setLoad({ status: "loading" });
                    setDays(d);
                  }}
                >
                  {d} days
                </button>
              ))}
            </div>
          </div>

          <div className="aq-hm-body">
            {load.status === "loading" ? (
              <div className="aq-hm-skel" role="status">
                Loading the map…
              </div>
            ) : !map || !proj ? (
              <div className="aq-hm-empty" role="status">
                <MapPin size={20} aria-hidden="true" />
                Not enough orders to map in the last {days} days yet.
              </div>
            ) : (
              <>
                <figure className="aq-hm-map">
                  <svg
                    viewBox={`0 0 ${proj.width} ${proj.height}`}
                    role="img"
                    aria-label={`Heatmap of orders in ${map.city.name}. Busiest: ${map.spots
                      .slice(0, 3)
                      .map((s) => `${s.area} (${s.orders})`)
                      .join(", ")}.`}
                  >
                    <defs>
                      {(["hot", "warm", "cool"] as const).map((t) => (
                        <radialGradient key={t} id={`aq-hm-${t}`}>
                          <stop offset="0%" className={`aq-hm-stop-${t}`} />
                          <stop
                            offset="100%"
                            className={`aq-hm-stop-${t}`}
                            stopOpacity="0"
                          />
                        </radialGradient>
                      ))}
                    </defs>
                    {/* Every area we know: the city's shape, faintly. */}
                    {(map.city.areas || []).map((a) => {
                      const { x, y } = proj.at(a);
                      return (
                        <circle
                          key={a.name}
                          cx={x}
                          cy={y}
                          r={1.6}
                          className="aq-hm-base"
                        />
                      );
                    })}
                    {/* Heat, quietest first so the hottest sits on top. */}
                    <g className="aq-hm-heat">
                      {[...map.spots].reverse().map((s) => {
                        const { x, y } = proj.at(s);
                        return (
                          <circle
                            key={s.area}
                            cx={x}
                            cy={y}
                            r={radius(s.heat)}
                            fill={`url(#aq-hm-${tone(s.heat)})`}
                          />
                        );
                      })}
                    </g>
                    {map.spots.map((s, i) => {
                      const { x, y } = proj.at(s);
                      const on = current?.area === s.area;
                      return (
                        <g
                          key={s.area}
                          className="aq-hm-spot"
                          data-on={on}
                          onClick={() => setPicked(s.area)}
                        >
                          <circle cx={x} cy={y} r={14} className="aq-hm-hit" />
                          <circle
                            cx={x}
                            cy={y}
                            r={on ? 5.5 : 3.5}
                            className="aq-hm-core"
                          />
                          {(on || i < 3) && (
                            <text
                              x={x}
                              y={y - 9}
                              textAnchor="middle"
                              className="aq-hm-label"
                            >
                              {s.area}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                  <figcaption className="aq-hm-legend">
                    <span className="aq-hm-key" data-tone="cool" /> Active
                    <span className="aq-hm-key" data-tone="warm" /> Warm
                    <span className="aq-hm-key" data-tone="hot" /> Hot
                  </figcaption>
                </figure>

                {/* The same areas as a list: the map's keyboard and screen
                    reader way in, and quicker to scan on a phone. */}
                <div
                  className="aq-hm-areas aq-noscroll"
                  role="group"
                  aria-label="Areas by orders"
                >
                  {map.spots.map((s) => (
                    <button
                      key={s.area}
                      type="button"
                      className="aq-hm-area"
                      data-tone={tone(s.heat)}
                      aria-pressed={current?.area === s.area}
                      onClick={() => setPicked(s.area)}
                    >
                      {s.area}
                      <span className="aq-hm-count">{s.orders}</span>
                    </button>
                  ))}
                </div>

                {current && (
                  <section className="aq-hm-picks" aria-live="polite">
                    <h3 className="aq-hm-picks-title">
                      <Flame size={14} aria-hidden="true" />
                      Hot in {current.area}
                      <span
                        className="aq-hm-badge"
                        data-tone={tone(current.heat)}
                      >
                        {heatLabel(current.heat)} · {current.orders}{" "}
                        {current.orders === 1 ? "order" : "orders"}
                      </span>
                      {mine?.area === current.area && (
                        <span className="aq-hm-you">Your area</span>
                      )}
                    </h3>
                    <ol className="aq-demand-list">
                      {current.top.map((item) => {
                        const product = matchProduct(
                          item,
                          list,
                        ) as Product | null;
                        return (
                          <li
                            key={
                              item.productId ||
                              item.productSlug ||
                              item.productName
                            }
                          >
                            <button
                              type="button"
                              className="aq-demand-row"
                              disabled={!product}
                              onClick={() => {
                                if (!product) return;
                                drawer.close();
                                p.onOpen(product.id);
                              }}
                            >
                              <span
                                aria-hidden="true"
                                className="aq-demand-thumb"
                                style={
                                  product?.photos[0]
                                    ? {
                                        background: `var(--aq-surf) center / contain no-repeat url("${product.photos[0]}")`,
                                      }
                                    : undefined
                                }
                              />
                              <span className="aq-demand-row-body">
                                <span className="aq-demand-row-name">
                                  {product?.title ||
                                    cleanProductName(item.productName)}
                                </span>
                                <span className="aq-demand-row-meta">
                                  Bought {item.orders}{" "}
                                  {item.orders === 1 ? "time" : "times"} here
                                </span>
                              </span>
                              {product && (
                                <span className="aq-demand-row-price">
                                  {INR(product.price)}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                )}
                <p className="aq-hm-note">
                  Areas come from delivery addresses; no customer details are
                  shown.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
