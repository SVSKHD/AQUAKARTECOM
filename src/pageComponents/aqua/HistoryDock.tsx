"use client";

import { MessageCircle, Plus, X } from "lucide-react";
import { INR } from "./catalogue";
import { openExpert } from "./AquaHeader";
import type { ChatSession } from "./useAquaChat";
import type { Product } from "./types";

type Props = {
  open: boolean;
  locked: boolean;
  sessions: ChatSession[];
  viewed: Product[];
  canView: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onRestore: (id: string) => void;
  onView: (id: string) => void;
};

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1
    ? "just now"
    : m < 60
      ? `${m} min ago`
      : `${Math.round(m / 60)} h ago`;
};

// Overlay dock: earlier chats from this tab and products opened in this conversation.
export default function HistoryDock(p: Props) {
  return (
    <>
      {p.open && (
        <div
          onClick={p.onClose}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(7,26,37,.16)",
            zIndex: 41,
          }}
        />
      )}
      <aside
        aria-label="History"
        aria-hidden={!p.open}
        inert={!p.open}
        className="aq-glass"
        style={{
          position: "absolute",
          top: 0,
          left: 12,
          bottom: 12,
          width: "min(300px, calc(100% - 24px))",
          borderRadius: 26,
          zIndex: 42,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transform: p.open ? "none" : "translateX(calc(-100% - 24px))",
          opacity: p.open ? 1 : 0,
          transition:
            "transform .45s cubic-bezier(.22,.8,.24,1), opacity .3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 14px 10px 18px",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>
            History
          </span>
          <button
            type="button"
            className="aq-btn aq-btn-glass"
            onClick={p.onNewChat}
            disabled={p.locked}
            style={{ height: 32, padding: "0 12px", fontSize: 12 }}
          >
            <Plus size={14} /> New chat
          </button>
          <button
            type="button"
            className="aq-icon-btn"
            onClick={p.onClose}
            aria-label="Close history"
          >
            <X size={16} />
          </button>
        </div>
        <div
          className="aq-noscroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "4px 12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="aq-label" style={{ padding: "0 6px 4px" }}>
              Recent chats
            </span>
            {p.sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => p.onRestore(s.id)}
                disabled={p.locked}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  padding: "10px 12px",
                  minHeight: 44,
                  border: 0,
                  borderRadius: 14,
                  background: "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "var(--aq-ink)",
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                >
                  {s.title}
                </span>
                <span style={{ fontSize: 11, color: "var(--aq-mut)" }}>
                  {s.messages.length} messages · {ago(s.at)}
                </span>
              </button>
            ))}
            {!p.sessions.length && (
              <span
                style={{
                  fontSize: 12.5,
                  color: "var(--aq-mut)",
                  padding: "0 6px",
                }}
              >
                Earlier chats from this tab appear here when you start a new
                one.
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="aq-label" style={{ padding: "0 6px 2px" }}>
              Products you opened
            </span>
            {p.viewed.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={!p.canView}
                onClick={() => p.onView(v.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 8,
                  minHeight: 44,
                  borderRadius: 14,
                  border: "1px solid rgba(var(--aq-gl),.9)",
                  background: "rgba(var(--aq-gl),.6)",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "var(--aq-ink)",
                }}
              >
                <span
                  style={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    borderRadius: 10,
                    background: v.photos[0]
                      ? `center / cover no-repeat url("${v.photos[0]}")`
                      : "repeating-linear-gradient(135deg, var(--aq-mint) 0 6px, var(--aq-tint) 6px 12px)",
                  }}
                />
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
                      fontSize: 12.5,
                      fontWeight: 700,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {v.title}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--aq-mut)" }}>
                    {INR(v.price)} · {v.stock}
                  </span>
                </span>
              </button>
            ))}
            {!p.viewed.length && (
              <span
                style={{
                  fontSize: 12.5,
                  color: "var(--aq-mut)",
                  lineHeight: 1.5,
                  padding: "0 6px",
                }}
              >
                Products you open or compare with Aqua collect here.
              </span>
            )}
          </div>

          <button
            type="button"
            className="aq-btn aq-btn-glass"
            onClick={openExpert}
            style={{ alignSelf: "flex-start", fontSize: 13 }}
          >
            <MessageCircle size={15} /> Talk to an expert
          </button>
        </div>
      </aside>
    </>
  );
}
