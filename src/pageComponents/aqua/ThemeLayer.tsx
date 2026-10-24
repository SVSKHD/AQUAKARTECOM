"use client";

import { memo } from "react";
import { useReducedMotion } from "./hooks";

const BUBBLES: [number, number, number, number][] = [
  [5, 14, 22, 0],
  [14, 8, 17, 3],
  [22, 22, 26, 7],
  [30, 6, 15, 1],
  [38, 12, 21, 9],
  [46, 28, 30, 4],
  [54, 7, 16, 11],
  [62, 16, 24, 2],
  [70, 10, 19, 6],
  [78, 24, 28, 10],
  [86, 8, 14, 5],
  [93, 14, 20, 13],
  [10, 5, 13, 8],
  [42, 18, 25, 12],
  [58, 9, 18, 15],
  [74, 6, 12, 14],
  [26, 11, 23, 16],
  [88, 19, 27, 18],
];

function Wave({ fill, h0 }: { fill: string; h0: number }) {
  const d = `M0 ${h0} C240 ${h0 - 40} 480 ${h0 + 40} 720 ${h0} C960 ${h0 - 40} 1200 ${h0 + 40} 1440 ${h0} C1680 ${h0 - 40} 1920 ${h0 + 40} 2160 ${h0} C2400 ${h0 - 40} 2640 ${h0 + 40} 2880 ${h0} V160 H0 Z`;
  return (
    <svg
      viewBox="0 0 2880 160"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      style={{ display: "block" }}
    >
      <path d={d} style={{ fill }} />
    </svg>
  );
}

const STARS =
  "radial-gradient(1.5px 1.5px at 12% 18%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 28% 9%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 46% 22%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 63% 12%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 79% 26%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 91% 8%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 36% 34%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 70% 40%, #fff 50%, transparent 51%)";

// Background gradient lives on .aq-root; this draws rays, sun/moon, waves and bubbles.
function ThemeLayer() {
  const rm = useReducedMotion();
  const anim = (v: string) => (rm ? "none" : v);
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "8vw",
          top: "-25vh",
          width: "84vw",
          height: "95vh",
          background:
            "repeating-linear-gradient(104deg, rgba(var(--aq-gl),0) 0 70px, rgba(var(--aq-gl),.55) 70px 100px, rgba(var(--aq-gl),0) 100px 190px)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 70% at 50% 0%, #000 10%, transparent 75%)",
          maskImage:
            "radial-gradient(ellipse 60% 70% at 50% 0%, #000 10%, transparent 75%)",
          animation: anim("aqRays 9s ease-in-out infinite"),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "-14vw",
          top: "-16vh",
          width: "60vw",
          height: "60vw",
          maxWidth: 880,
          maxHeight: 880,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(16,191,164,.24) 0%, rgba(16,191,164,.08) 40%, rgba(16,191,164,0) 68%)",
          animation: anim("aqDriftA 26s ease-in-out infinite"),
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "-16vw",
          top: "6vh",
          width: "58vw",
          height: "58vw",
          maxWidth: 840,
          maxHeight: 840,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(118,206,240,.22) 0%, rgba(118,206,240,.07) 42%, rgba(118,206,240,0) 68%)",
          animation: anim("aqDriftB 32s ease-in-out infinite"),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: "var(--aq-stars)" as unknown as number,
          transition: "opacity 1.4s ease",
          backgroundImage: STARS,
        }}
      />
      {/* sun */}
      <div
        style={{
          position: "absolute",
          right: "13vw",
          top: "11vh",
          width: 110,
          height: 110,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 40% 38%, var(--aq-sun1) 0%, var(--aq-sun2) 70%)",
          boxShadow:
            "0 0 60px 18px var(--aq-glow), 0 0 160px 60px var(--aq-glow)",
          transform: "var(--aq-sunT)",
          opacity: "var(--aq-sunO)" as unknown as number,
          transition:
            "transform 1.6s cubic-bezier(.6,0,.3,1), opacity 1.2s ease",
        }}
      />
      {/* moon */}
      <div
        style={{
          position: "absolute",
          right: "13vw",
          top: "11vh",
          width: 92,
          height: 92,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 38% 36%, var(--aq-sun1) 0%, var(--aq-sun2) 85%)",
          boxShadow:
            "inset -16px -8px 0 0 rgba(0,0,0,.12), 0 0 50px 14px var(--aq-glow), 0 0 140px 50px var(--aq-glow)",
          transform: "var(--aq-moonT)",
          opacity: "var(--aq-moonO)" as unknown as number,
          transition:
            "transform 1.6s cubic-bezier(.6,0,.3,1) .15s, opacity 1.2s ease .15s",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 200,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "calc(13vw - 25px)",
            bottom: 30,
            width: 160,
            height: 150,
            background:
              "repeating-linear-gradient(180deg, var(--aq-glow) 0 3px, transparent 3px 11px)",
            WebkitMaskImage:
              "radial-gradient(ellipse 50% 60% at 50% 30%, #000 20%, transparent 75%)",
            maskImage:
              "radial-gradient(ellipse 50% 60% at 50% 30%, #000 20%, transparent 75%)",
            animation: anim("aqRays 4s ease-in-out infinite"),
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 46,
            background:
              "linear-gradient(180deg, transparent 0%, var(--aq-sand) 70%)",
          }}
        />
        {!rm && (
          <>
            <div
              style={{
                position: "absolute",
                left: 0,
                bottom: 0,
                width: "200%",
                height: 200,
                animation: "aqWaveX 30s linear infinite",
              }}
            >
              <Wave fill="rgba(118,206,240,.16)" h0={70} />
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                bottom: 0,
                width: "200%",
                height: 150,
                animation: "aqWaveX 22s linear infinite reverse",
              }}
            >
              <Wave fill="rgba(16,191,164,.14)" h0={80} />
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                bottom: 0,
                width: "200%",
                height: 110,
                animation: "aqWaveX 16s linear infinite",
              }}
            >
              <Wave fill="var(--aq-foam)" h0={90} />
            </div>
          </>
        )}
      </div>
      {!rm &&
        BUBBLES.map(([l, s, d, dl], i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: l + "%",
              bottom: -40,
              width: s,
              height: s,
              borderRadius: "50%",
              opacity: 0,
              background:
                "radial-gradient(circle at 32% 28%, var(--aq-bubHi) 0 16%, var(--aq-bubMid) 38%, var(--aq-bubIn) 70%, var(--aq-bubEdge) 100%)",
              border: "1px solid var(--aq-bubRim)",
              boxShadow:
                "inset 0 0 6px var(--aq-bubEdge), 0 2px 8px var(--aq-bubGlow)",
              animation: `aqRise2 ${d}s linear ${dl}s infinite`,
            }}
          />
        ))}
    </div>
  );
}

export default memo(ThemeLayer);
