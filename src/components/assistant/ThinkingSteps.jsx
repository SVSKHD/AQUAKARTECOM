import { useState } from "react";
import { Brain, ChevronRight } from "lucide-react";
import { thoughtSubsteps } from "@/services/ai";
import { renderInline } from "./AssistantReply";

const VISIBLE_SUBSTEPS = 2;

function Step({ step, index, active, isLast }) {
  const [open, setOpen] = useState(false);
  const subs = thoughtSubsteps(step.text);
  const shown = open ? subs : subs.slice(0, VISIBLE_SUBSTEPS);
  const hidden = subs.length - shown.length;
  return (
    <li className="relative pl-8">
      {/* timeline rail + numbered node */}
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute -bottom-3 left-[11px] top-6 w-px bg-emerald-200"
        />
      )}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-0 grid h-6 w-6 place-items-center rounded-full text-[11px] font-black ${
          active
            ? "bg-emerald-500 text-white ring-4 ring-emerald-100 motion-safe:animate-pulse"
            : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {index + 1}
      </span>
      <p className="pt-0.5 text-[13px] font-bold leading-5 text-slate-900">
        {renderInline(step.title || `Step ${index + 1}`, `t${index}`)}
      </p>
      {shown.length > 0 && (
        <ul className="mt-1.5 space-y-1.5 border-l border-dashed border-slate-200 pl-3">
          {shown.map((sub, j) => (
            <li key={j} className="relative text-xs leading-5 text-slate-500">
              <span
                aria-hidden="true"
                className="absolute -left-[15px] top-2 h-1.5 w-1.5 rounded-full bg-slate-300"
              />
              <span className={open ? "" : "line-clamp-2"}>
                {renderInline(sub, `s${index}-${j}`)}
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
          className="mt-1 min-h-8 pl-3 text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
        >
          {open ? "Show less" : `Show ${hidden} more`}
        </button>
      )}
    </li>
  );
}

// Thinking steps for one answer. `live` while the answer is still being worked
// out (expanded, last step pulsing); afterwards a "Thought for N steps" toggle.
export default function ThinkingSteps({
  steps = [],
  live = false,
  expanded,
  onToggle,
  id,
}) {
  const list = steps.filter(Boolean);
  if (live && !list.length) {
    return (
      <div
        role="status"
        className="flex items-center gap-2 text-xs font-bold text-slate-500"
      >
        <Brain
          size={15}
          className="text-emerald-600 motion-safe:animate-pulse"
          aria-hidden="true"
        />
        Thinking
        <span aria-hidden="true" className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1 w-1 animate-bounce rounded-full bg-emerald-500 motion-reduce:animate-none"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      </div>
    );
  }
  if (!list.length) return null;

  const open = live || expanded;
  return (
    <div className="w-full">
      {live ? (
        <p
          role="status"
          className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-500"
        >
          <Brain
            size={15}
            className="text-emerald-600 motion-safe:animate-pulse"
            aria-hidden="true"
          />
          Thinking…
        </p>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          className="mb-2 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
        >
          <Brain size={13} aria-hidden="true" />
          Thought for {list.length} {list.length === 1 ? "step" : "steps"}
          <ChevronRight
            size={13}
            aria-hidden="true"
            className={`transition-transform ${open ? "rotate-90" : ""}`}
          />
        </button>
      )}
      {open && (
        <ol
          id={id}
          className="mb-3 space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3"
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
