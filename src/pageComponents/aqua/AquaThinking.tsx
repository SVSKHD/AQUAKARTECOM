"use client";

import { useId, useState } from "react";
import { Brain, ChevronRight } from "lucide-react";
import { thoughtSubsteps } from "@/services/ai";
import { inline } from "./AquaReply";

type Thought = { title: string | null; text: string };
const VISIBLE_SUBSTEPS = 2;

const clamp = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical" as const,
  overflow: "hidden",
};

function Step({
  step,
  index,
  active,
  isLast,
}: {
  step: Thought;
  index: number;
  active: boolean;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const subs = thoughtSubsteps(step.text);
  const shown = open ? subs : subs.slice(0, VISIBLE_SUBSTEPS);
  const hidden = subs.length - shown.length;
  return (
    <li style={{ position: "relative", paddingLeft: 34, listStyle: "none" }}>
      {!isLast && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 11,
            top: 26,
            bottom: -14,
            width: 1.5,
            background: "var(--aq-mintbd)",
          }}
        />
      )}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 24,
          height: 24,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          fontSize: 11,
          fontWeight: 800,
          background: active ? "#10BFA4" : "var(--aq-mint)",
          color: active ? "#fff" : "var(--aq-mintink)",
          boxShadow: active ? "0 0 0 4px rgba(16,191,164,.18)" : "none",
          animation: active ? "aqPulse 1.4s ease-in-out infinite" : "none",
        }}
      >
        {index + 1}
      </span>
      <p
        style={{
          margin: 0,
          paddingTop: 2,
          fontSize: 13.5,
          fontWeight: 700,
          lineHeight: 1.4,
          color: "var(--aq-ink)",
        }}
      >
        {inline(step.title || `Step ${index + 1}`, `t${index}`)}
      </p>
      {shown.length > 0 && (
        <ul
          style={{
            margin: "6px 0 0",
            padding: "0 0 0 12px",
            borderLeft: "1.5px dashed var(--aq-bd)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {shown.map((sub, j) => (
            <li
              key={j}
              style={{
                position: "relative",
                listStyle: "none",
                fontSize: 12.5,
                lineHeight: 1.5,
                color: "var(--aq-mut)",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: -16,
                  top: 7,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--aq-mut2)",
                }}
              />
              <span style={open ? undefined : clamp}>
                {inline(sub, `s${index}-${j}`)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {(hidden > 0 || (open && subs.length > VISIBLE_SUBSTEPS)) && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{
            border: 0,
            background: "transparent",
            padding: "4px 0 0 12px",
            minHeight: 28,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--aq-mintink)",
          }}
        >
          {open ? "Show less" : `Show ${hidden} more`}
        </button>
      )}
    </li>
  );
}

// Thinking steps for one Aqua answer: live (expanded, last step pulsing) while
// the steps arrive, then a "Thought for N steps" toggle, collapsed by default.
export default function AquaThinking({
  steps = [],
  live = false,
}: {
  steps?: Thought[];
  live?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const list = steps.filter(Boolean);

  if (live && !list.length) {
    return (
      <div
        role="status"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          fontWeight: 700,
          color: "var(--aq-mut)",
        }}
      >
        <Brain
          size={16}
          color="#10BFA4"
          aria-hidden="true"
          style={{ animation: "aqPulse 1.4s ease-in-out infinite" }}
        />
        Thinking
        <span aria-hidden="true" style={{ display: "flex", gap: 3 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#10BFA4",
                animation: `aqDropHop 1.1s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </span>
      </div>
    );
  }
  if (!list.length) return null;

  const open = live || expanded;
  return (
    <div style={{ width: "100%" }}>
      {live ? (
        <p
          role="status"
          style={{
            margin: "0 0 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
            color: "var(--aq-mut)",
          }}
        >
          <Brain
            size={16}
            color="#10BFA4"
            aria-hidden="true"
            style={{ animation: "aqPulse 1.4s ease-in-out infinite" }}
          />
          Thinking…
        </p>
      ) : (
        <button
          type="button"
          className="aq-chip aq-chip-soft"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={open}
          aria-controls={id}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 10,
            fontSize: 12.5,
          }}
        >
          <Brain size={14} aria-hidden="true" />
          Thought for {list.length} {list.length === 1 ? "step" : "steps"}
          <ChevronRight
            size={14}
            aria-hidden="true"
            style={{
              transition: "transform .2s",
              transform: open ? "rotate(90deg)" : "none",
            }}
          />
        </button>
      )}
      {open && (
        <ol
          id={id}
          style={{
            margin: "0 0 12px",
            padding: 14,
            borderRadius: 16,
            border: "1px solid var(--aq-mintbd)",
            background: "rgba(var(--aq-mintrgb),.35)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            animation: "aqCardIn .3s ease both",
          }}
        >
          {list.map((step, i) => (
            <Step
              key={i}
              step={step}
              index={i}
              isLast={i === list.length - 1}
              active={live && i === list.length - 1}
            />
          ))}
        </ol>
      )}
    </div>
  );
}
