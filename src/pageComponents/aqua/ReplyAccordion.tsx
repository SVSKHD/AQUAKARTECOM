"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";
import ReplyActions from "./ReplyActions";

// Collapsed, a reply shows this much (px) under a fade.
const PREVIEW = 96;

// A finished reply as an accordion: a header with Copy / Listen and a
// Show more / Show less toggle, and the reply below, folded to a preview when
// closed. Replies short enough to fit the preview don't fold at all.
export default function ReplyAccordion({
  id,
  text,
  defaultOpen,
  lead,
  children,
}: {
  id: string;
  text: string;
  defaultOpen: boolean;
  // Shares the header row, on the left (the "Thought for N steps" chip).
  lead?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  // The reply's full height, measured (null until then). Opening and closing
  // ease max-height between the preview and this, both real pixel values.
  const [full, setFull] = useState<number | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bodyId = useId();

  // Re-measured as the reply reflows (panel resize, fonts, images).
  useLayoutEffect(() => {
    const el = bodyRef.current?.firstElementChild as HTMLElement | null;
    if (!el) return;
    const check = () => setFull(el.scrollHeight);
    check();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const long = full === null || full > PREVIEW + 24;
  const folded = long && !open;
  const maxHeight = folded ? PREVIEW : long && full ? full : undefined;

  return (
    <div className="aq-acc" data-open={!folded} data-lead={!!lead}>
      {/* With a lead (product pill, thinking chip): one row, the lead left and
          Copy / Listen / More right. Without one there's no row: the tools sit
          in the top-right corner and the reply wraps around them. */}
      <div className="aq-acc-head">
        {lead && <div className="aq-acc-lead">{lead}</div>}
        <div className="aq-acc-tools" data-long={long}>
          <ReplyActions id={id} text={text} />
          {long && (
            <button
              type="button"
              className="aq-acc-toggle"
              aria-expanded={open}
              aria-controls={bodyId}
              aria-label={open ? "Show less" : "Show more"}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="aq-ra-label">{open ? "Less" : "More"}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <div
        id={bodyId}
        ref={bodyRef}
        className="aq-acc-body"
        style={maxHeight !== undefined ? { maxHeight } : undefined}
        // A tap on the folded preview opens it too.
        onClick={folded ? () => setOpen(true) : undefined}
      >
        <div>
          {!lead && (
            <span className="aq-acc-gap" data-long={long} aria-hidden="true" />
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
