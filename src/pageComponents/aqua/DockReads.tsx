"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import ArrowScroller from "./ArrowScroller";
import { speakingNow, stopSpeaking } from "./ReplyActions";
import { MoreReads, Read } from "./WhileYouWait";
import type { BlogRead } from "./blogReads";

// Phones: the blog reads live in the history sidebar instead of a floating
// bar. One collapsible "Water reads" section; each read opens in place to read
// in full or play as a podcast. The list scrolls inside a capped height so the
// account and settings rows below stay on screen.
export default function DockReads({ reads }: { reads: BlogRead[] }) {
  const [open, setOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const listId = useId();

  // A podcast from this list stops when the sidebar unmounts (sign-out, new
  // layout). Closing the drawer keeps it playing while the chat continues.
  const readsRef = useRef(reads);
  readsRef.current = reads;
  useEffect(
    () => () => {
      const now = speakingNow();
      if (now && readsRef.current.some((r) => now === `blog:${r.id}`))
        stopSpeaking();
    },
    [],
  );

  if (!reads.length) return null;
  return (
    <section className="aq-dock-reads" aria-label="Water reads">
      <button
        type="button"
        className="aq-dock-row"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="aq-dock-row-icon" aria-hidden="true">
          <BookOpen size={15} />
        </span>
        <span className="aq-dock-row-text">
          <span className="aq-dock-row-title">Water reads</span>
          <span className="aq-dock-row-meta">
            Latest {reads.length} · read or listen
          </span>
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          style={{
            flexShrink: 0,
            color: "var(--aq-mut)",
            transition: "transform .25s",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>
      <div id={listId} hidden={!open}>
        {open && (
          <ArrowScroller className="aq-dock-reads-list" label="water reads">
            {reads.map((r) => (
              <Read
                key={r.id}
                read={r}
                full
                open={openId === r.id}
                onToggle={() => setOpenId((o) => (o === r.id ? null : r.id))}
                onListen={() => setOpenId(r.id)}
              />
            ))}
            <MoreReads />
          </ArrowScroller>
        )}
      </div>
    </section>
  );
}
