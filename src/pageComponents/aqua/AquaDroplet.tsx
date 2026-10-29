"use client";

import { useId, type CSSProperties } from "react";
import type { Mood } from "./types";
import { useReducedMotion } from "./hooks";

const AQ = "#10BFA4";

// Light theme: the mint droplet. Dark theme: a white "pearl" droplet that
// glows against the night background; its face stays dark so it reads on white.
const PALETTE = {
  light: {
    body: ["#F7FFFE", "#C2F6ED", "#5EDBC7", "#16B8A1", "#0A8C7C"],
    rim: "rgba(255,255,255,.9)",
    depth: "#005F55",
    depthOpacity: 0.3,
    limb: "#19B39D",
    limbEdge: "rgba(255,255,255,.7)",
    face: "var(--aq-ink)",
    mouth: "#0B4743",
    water: "rgba(0,150,130,.26)",
    bubble: "rgba(255,255,255,.8)",
    shadow: "var(--aq-ink)",
    shadowOpacity: 0.13,
    shine: 0.85,
    glow: "none",
  },
  dark: {
    body: ["#FFFFFF", "#FAFCFD", "#EDF3F6", "#D3E0E7", "#AFC2CE"],
    rim: "rgba(255,255,255,.95)",
    depth: "#4E6878",
    depthOpacity: 0.28,
    limb: "#EEF4F7",
    limbEdge: "rgba(150,178,194,.55)",
    face: "#123039",
    mouth: "#123039",
    water: "rgba(122,154,174,.2)",
    bubble: "rgba(132,164,184,.55)",
    shadow: "#FFFFFF",
    shadowOpacity: 0.14,
    shine: 0.95,
    glow: "drop-shadow(0 0 18px rgba(255,255,255,.22))",
  },
};
const DROP =
  "M60 10 C64 26 102 60 102 90 A42 42 0 0 1 18 90 C18 60 56 26 60 10 Z";
const MINI =
  "M0 -6 C1.8 -2.5 4 0 4 2.4 A4 4 0 0 1 -4 2.4 C-4 0 -1.8 -2.5 0 -6 Z";
const SPARK = "M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z";
const wave = (y: number) =>
  `M-60 ${y} q15 -7 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 V160 H-60 Z`;

const BODY: Record<Mood, string> = {
  idle: "aqFloat 3.6s ease-in-out infinite",
  greeting: "aqHello 1.3s cubic-bezier(.3,1.4,.5,1) 2",
  listening: "aqTilt 2.4s ease-in-out infinite",
  thinking: "aqThink 2.8s ease-in-out infinite",
  speaking: "aqBob .5s ease-in-out infinite",
  happy: "aqHop .8s cubic-bezier(.3,1.5,.5,1) 2",
  success: "aqHop .8s cubic-bezier(.3,1.5,.5,1) 3",
  error: "aqShake .5s ease 2",
};

type Props = {
  mood?: Mood;
  size?: number;
  dark?: boolean;
  still?: boolean;
  label?: string;
};

// Aqua mascot, ported from V4's mascot(). Static when the user prefers reduced motion.
export default function AquaDroplet({
  mood = "idle",
  size = 120,
  dark = false,
  still,
  label,
}: Props) {
  const reduced = useReducedMotion();
  const rm = still || reduced;
  const u = useId().replace(/:/g, "");
  const A = (v: string) => (rm ? "none" : v);
  const box: CSSProperties = {
    transformBox: "fill-box",
    transformOrigin: "center",
  };

  const C = dark ? PALETTE.dark : PALETTE.light;
  const BS = C.body;
  const INK = C.face;
  const joy = mood === "happy" || mood === "success" || mood === "greeting";
  const wide = mood === "listening" || mood === "success";
  const ink = {
    stroke: INK,
    strokeWidth: 3.6,
    fill: "none",
    strokeLinecap: "round" as const,
  };
  const waving = (mood === "greeting" || mood === "success") && !rm;
  const splash = (mood === "happy" || mood === "success") && !rm;
  const sparkles = (mood === "greeting" || mood === "success") && !rm;

  const eyes = joy ? (
    <>
      <path d="M38 89 Q45 80 52 89" {...ink} />
      <path d="M68 89 Q75 80 82 89" {...ink} />
    </>
  ) : (
    <>
      <ellipse cx={45} cy={87} rx={6.6} ry={wide ? 9 : 8} fill={INK} />
      <ellipse cx={75} cy={87} rx={6.6} ry={wide ? 9 : 8} fill={INK} />
      <circle cx={47.6} cy={83.6} r={2.5} fill="#fff" />
      <circle cx={43.4} cy={90.4} r={1.1} fill="#fff" opacity={0.85} />
      <circle cx={77.6} cy={83.6} r={2.5} fill="#fff" />
      <circle cx={73.4} cy={90.4} r={1.1} fill="#fff" opacity={0.85} />
    </>
  );

  let mouth;
  if (mood === "speaking")
    mouth = (
      <ellipse
        cx={60}
        cy={105}
        rx={6}
        ry={5}
        fill={C.mouth}
        style={{ ...box, animation: A("aqTalk .3s ease-in-out infinite") }}
      />
    );
  else if (joy)
    mouth = (
      <g>
        <path
          d="M49 100 Q60 117 71 100 Z"
          fill={C.mouth}
          stroke={C.mouth}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <ellipse cx={60} cy={108.5} rx={4.5} ry={2.4} fill="#FF8FA3" />
      </g>
    );
  else if (mood === "error")
    mouth = <path d="M52 109 Q60 101 68 109" {...ink} strokeWidth={3} />;
  else if (mood === "thinking")
    mouth = <ellipse cx={64} cy={105} rx={3} ry={3.4} fill={C.mouth} />;
  else mouth = <path d="M51 100 Q60 109 69 100" {...ink} strokeWidth={3} />;

  const brows =
    mood === "thinking" ? (
      <path d="M68 73 Q75 68 82 72" {...ink} strokeWidth={2.6} />
    ) : mood === "error" ? (
      <g>
        <path d="M38 75 L51 78" {...ink} strokeWidth={2.6} />
        <path d="M82 75 L69 78" {...ink} strokeWidth={2.6} />
      </g>
    ) : null;

  const LIMB = C.limb;
  const arm = (x: number, side: number, wv: boolean) => (
    <g transform={`translate(${x} 92)`}>
      <ellipse
        cx={0}
        cy={wv ? -10 : 8}
        rx={5}
        ry={10}
        fill={LIMB}
        stroke={C.limbEdge}
        strokeWidth={1}
        style={{
          transformBox: "fill-box",
          transformOrigin: wv ? "50% 100%" : "50% 0%",
          transform: wv ? "none" : `rotate(${side * 18}deg)`,
          animation: wv ? "aqWaveArm .55s ease-in-out infinite" : "none",
        }}
      />
    </g>
  );

  return (
    <svg
      viewBox="-24 -20 168 184"
      width={size}
      height={(size * 184) / 168}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{
        overflow: "visible",
        display: "block",
        filter: C.glow,
        transition: "filter .8s ease",
      }}
    >
      <defs>
        <radialGradient id={`${u}b`} cx="36%" cy="32%" r="80%">
          <stop offset="0%" stopColor={BS[0]} />
          <stop offset="24%" stopColor={BS[1]} />
          <stop offset="54%" stopColor={BS[2]} />
          <stop offset="82%" stopColor={BS[3]} />
          <stop offset="100%" stopColor={BS[4]} />
        </radialGradient>
        <linearGradient id={`${u}d`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="55%" stopColor={C.depth} stopOpacity={0} />
          <stop
            offset="100%"
            stopColor={C.depth}
            stopOpacity={C.depthOpacity}
          />
        </linearGradient>
        <radialGradient id={`${u}q`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.95} />
          <stop offset="60%" stopColor="#C9F5EE" stopOpacity={0.35} />
          <stop offset="100%" stopColor={AQ} stopOpacity={0.35} />
        </radialGradient>
        <clipPath id={`${u}c`}>
          <path d={DROP} />
        </clipPath>
      </defs>

      <ellipse
        cx={60}
        cy={141}
        rx={30}
        ry={4.5}
        fill={C.shadow}
        opacity={C.shadowOpacity}
        style={{
          ...box,
          animation:
            mood === "idle" ? A("aqShadow 3.6s ease-in-out infinite") : "none",
        }}
      />
      {mood === "listening" && !rm && (
        <g>
          {[0, 0.9].map((d) => (
            <ellipse
              key={d}
              cx={60}
              cy={140}
              rx={34}
              ry={7}
              fill="none"
              stroke={AQ}
              strokeWidth={2}
              style={{
                ...box,
                animation: `aqRing 1.8s ease-out ${d}s infinite`,
              }}
            />
          ))}
        </g>
      )}
      {mood === "success" && !rm && (
        <circle
          cx={60}
          cy={86}
          r={54}
          fill="none"
          stroke={AQ}
          strokeWidth={2.5}
          style={{ ...box, animation: "aqRing 1.1s ease-out 3 both" }}
        />
      )}
      {splash && (
        <g transform="translate(60 70)">
          {Array.from({ length: 9 }, (_, i) => {
            const deg = -170 + i * 20;
            const a = (deg * Math.PI) / 180;
            const R = 64 + (i % 3) * 12;
            return (
              <g
                key={i}
                style={
                  {
                    "--dx": (Math.cos(a) * R).toFixed(1) + "px",
                    "--dy": (Math.sin(a) * R).toFixed(1) + "px",
                    animation: `aqSplash .9s cubic-bezier(.2,.7,.3,1) ${(i % 3) * 0.05}s ${mood === "success" ? 3 : 2} both`,
                  } as CSSProperties
                }
              >
                <path
                  d={MINI}
                  fill={i % 2 ? "#5EDBC7" : "#9DE9F5"}
                  transform={`rotate(${deg + 90}) scale(${1 - (i % 3) * 0.2})`}
                />
              </g>
            );
          })}
        </g>
      )}

      <g
        style={{
          transformBox: "fill-box",
          transformOrigin: "50% 100%",
          animation: A(BODY[mood]),
        }}
      >
        <g>
          {[46, 74].map((cx) => (
            <ellipse
              key={cx}
              cx={cx}
              cy={133}
              rx={9.5}
              ry={5.5}
              fill={LIMB}
              stroke={C.limbEdge}
              strokeWidth={1}
            />
          ))}
        </g>
        {arm(18, -1, false)}
        {arm(102, 1, waving)}
        <path d={DROP} fill={`url(#${u}b)`} />
        <g clipPath={`url(#${u}c)`}>
          <g style={{ animation: A("aqSlosh 3.2s linear infinite") }}>
            <path d={wave(104)} fill={C.water} />
          </g>
          <g style={{ animation: A("aqSlosh 4.6s linear infinite reverse") }}>
            <path d={wave(114)} fill="rgba(255,255,255,.24)" />
          </g>
          {!rm && (
            <circle
              cx={74}
              cy={124}
              r={2.6}
              fill={C.bubble}
              style={{ animation: "aqInBub 3s ease-in infinite" }}
            />
          )}
          {!rm && (
            <circle
              cx={46}
              cy={126}
              r={1.8}
              fill={C.bubble}
              style={{ animation: "aqInBub 3.6s ease-in 1.4s infinite" }}
            />
          )}
        </g>
        <path d={DROP} fill={`url(#${u}d)`} />
        <path d={DROP} fill="none" stroke={C.rim} strokeWidth={1.6} />
        <ellipse
          cx={40}
          cy={58}
          rx={7.5}
          ry={15}
          fill="#fff"
          opacity={C.shine}
          transform="rotate(28 40 58)"
          style={{ animation: A("aqShine 4s ease-in-out infinite") }}
        />
        <circle cx={34} cy={80} r={3} fill="#fff" opacity={0.75} />
        <path
          d="M36 117 Q60 131 84 117"
          fill="none"
          stroke="rgba(255,255,255,.5)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <ellipse
          cx={35}
          cy={100}
          rx={6}
          ry={3.4}
          fill="#FF8FA3"
          opacity={joy ? 0.55 : 0.35}
        />
        <ellipse
          cx={85}
          cy={100}
          rx={6}
          ry={3.4}
          fill="#FF8FA3"
          opacity={joy ? 0.55 : 0.35}
        />
        {brows}
        <g
          transform={
            mood === "thinking"
              ? "translate(3 -4)"
              : mood === "listening"
                ? "translate(-2 1)"
                : undefined
          }
        >
          <g
            style={{
              ...box,
              animation: joy ? "none" : A("aqBlink 5s ease-in-out infinite"),
            }}
          >
            {eyes}
          </g>
        </g>
        {mouth}
        {mood === "error" && !rm && (
          <g transform="translate(97 60)">
            <path
              d={MINI}
              fill="#9DE9F5"
              stroke="#fff"
              strokeWidth={0.8}
              style={{ animation: "aqSweat 1s ease-in infinite" }}
            />
          </g>
        )}
      </g>

      {mood === "thinking" && !rm && (
        <g>
          {(
            [
              [106, 58, 5.5, 0],
              [117, 42, 4, 0.45],
              [104, 30, 3, 0.9],
              [119, 20, 4.6, 1.35],
              [96, 46, 2.4, 1.8],
            ] as const
          ).map(([cx, cy, r, d]) => (
            <circle
              key={d}
              cx={cx}
              cy={cy}
              r={r}
              fill={`url(#${u}q)`}
              stroke="rgba(16,191,164,.7)"
              strokeWidth={1.1}
              style={{ animation: `aqBubble 2.2s ease-in-out ${d}s infinite` }}
            />
          ))}
        </g>
      )}
      {sparkles && (
        <g>
          {(
            [
              [6, 44, 0],
              [112, 30, 0.3],
              [118, 98, 0.6],
              [2, 104, 0.9],
            ] as const
          ).map(([x, y, d], i) => (
            <g key={d} transform={`translate(${x} ${y})`}>
              <path
                d={SPARK}
                fill={i % 2 ? "#7FE3D3" : "#B9ECFF"}
                style={{
                  ...box,
                  animation: `aqSparkle 1.3s ease-in-out ${d}s infinite`,
                }}
              />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
