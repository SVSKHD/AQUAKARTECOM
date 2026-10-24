"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import {
  Brain,
  ChevronRight,
  Compass,
  ExternalLink,
  Eye,
  Receipt,
  LogOut,
  MessageCircle,
  MessageSquare,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { INR } from "./catalogue";
import { Avatar, openExpert } from "./AquaHeader";
import { snapAway } from "./snapDust";
import type { AiChatSummary } from "@/services/ai";
import type { ChatSession } from "./useAquaChat";
import type { Product } from "./types";

type Props = {
  open: boolean;
  locked: boolean;
  sessions: ChatSession[];
  // Conversations saved to the account (logged in), most recent first.
  savedChats: AiChatSummary[];
  onOpenSaved: (id: string) => void;
  viewed: Product[];
  // Invoices on the signed-in account; null while loading (or signed out).
  purchases: Purchase[] | null;
  canView: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onRestore: (id: string) => void;
  onStartTour: () => void;
  onDeleteSaved: (id: string) => Promise<boolean>;
  onDeleteSession: (id: string) => boolean;
  onView: (id: string) => void;
  userName: string | null;
  authBusy: boolean;
  authError: string;
  onSignIn: () => void;
  onSignOut: () => void;
  thinking: boolean;
  onToggleThinking?: () => void;
};

type Tab = "chats" | "viewed" | "purchases";
const TABS: Tab[] = ["chats", "viewed", "purchases"];

// One invoice linked to the customer's account (GET /invoices/public/mine).
export type Purchase = {
  id: string;
  invoiceNo: string;
  date?: string;
  paidStatus?: string;
  itemCount: number;
  total_price: number;
  canView?: boolean;
  items: string[];
};

const shortDate = (d?: string) => {
  const t = d ? new Date(d) : null;
  return t && !Number.isNaN(t.getTime())
    ? t.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
};
const isPaid = (s?: string) =>
  /^(paid|completed|success)/i.test(String(s || "").trim());

// How long the row's space takes to close after the snap starts (matches the
// .aq-dock-item transition), before the delete is applied.
const COLLAPSE_MS = 520;
// A first click on the bin arms it; it disarms on its own after this.
const ARM_MS = 3500;

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (!Number.isFinite(m)) return "";
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Staggers the entrance when a tab opens (capped so long lists don't drag).
const stagger = (i: number) => ({ "--i": Math.min(i, 8) }) as CSSProperties;

// Long titles slide sideways on hover / keyboard focus so the whole name can be
// read, then ease back. Measured after the hover padding (room for the bin) has
// applied; titles that already fit don't move.
const startMarquee = (item: HTMLElement) =>
  requestAnimationFrame(() => {
    const box = item.querySelector<HTMLElement>(".aq-dock-row-title");
    if (!box) return;
    const over = box.scrollWidth - box.clientWidth;
    if (over <= 2) return;
    box.style.setProperty("--aq-shift", `${-over - 8}px`);
    // Travel is 84% of the run: ~65px a second, comfortable to read along.
    box.style.setProperty("--aq-dur", `${Math.max(2, over / 55).toFixed(2)}s`);
    box.dataset.marquee = "true";
  });
const stopMarquee = (item: HTMLElement) => {
  const box = item.querySelector<HTMLElement>(".aq-dock-row-title");
  if (box) delete box.dataset.marquee;
};

function ChatRow(p: {
  title: string;
  meta: string;
  index: number;
  disabled: boolean;
  going: boolean;
  armed: boolean;
  onClick: () => void;
  onDelete: (row: HTMLElement | null) => void;
}) {
  return (
    <div className="aq-dock-item" data-going={p.going} style={stagger(p.index)}>
      <div
        className="aq-dock-item-inner"
        onPointerEnter={(e) =>
          e.pointerType === "mouse" && startMarquee(e.currentTarget)
        }
        onPointerLeave={(e) => stopMarquee(e.currentTarget)}
        onFocus={(e) => startMarquee(e.currentTarget)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null))
            stopMarquee(e.currentTarget);
        }}
      >
        <button
          type="button"
          className="aq-dock-row"
          title={p.title}
          onClick={p.onClick}
          disabled={p.disabled || p.going}
        >
          <span className="aq-dock-row-icon" aria-hidden="true">
            <MessageSquare size={15} />
          </span>
          <span className="aq-dock-row-text">
            <span className="aq-dock-row-title">
              <span className="aq-marquee-text">{p.title}</span>
            </span>
            <span className="aq-dock-row-meta">{p.meta}</span>
          </span>
          <ChevronRight
            size={15}
            className="aq-dock-row-chev"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          className="aq-dock-del"
          data-armed={p.armed}
          disabled={p.disabled || p.going}
          aria-label={
            p.armed ? `Confirm: delete "${p.title}"` : `Delete "${p.title}"`
          }
          title={p.armed ? "Click again to delete" : "Delete chat"}
          onClick={(e) =>
            p.onDelete(
              e.currentTarget.closest<HTMLElement>(".aq-dock-item-inner"),
            )
          }
        >
          <Trash2 size={14} aria-hidden="true" />
          {p.armed && <span>Delete</span>}
        </button>
      </div>
    </div>
  );
}

function Empty(p: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="aq-dock-empty" style={stagger(0)}>
      <span className="aq-dock-empty-icon" aria-hidden="true">
        {p.icon}
      </span>
      <span style={{ fontWeight: 700, fontSize: 13.5 }}>{p.title}</span>
      <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--aq-mut)" }}>
        {p.text}
      </span>
    </div>
  );
}

// Overlay dock. Top: new chat + Chats / Viewed tabs (chats saved to the account
// plus this visit's earlier chats; products the customer opened). Bottom, always
// in reach: settings, expert help and the account.
export default function HistoryDock(p: Props) {
  const { open, onClose } = p;
  const [tab, setTab] = useState<Tab>("chats");
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    chats: null,
    viewed: null,
    purchases: null,
  });
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ---------- delete (arm, then snap) ----------
  const [armed, setArmed] = useState<string | null>(null);
  const [going, setGoing] = useState<ReadonlySet<string>>(new Set());
  const [deleteError, setDeleteError] = useState("");
  const armT = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(armT.current), []);

  const mark = (key: string, on: boolean) =>
    setGoing((g) => {
      const next = new Set(g);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  const remove = async (
    key: string,
    row: HTMLElement | null,
    run: () => Promise<boolean> | boolean,
  ) => {
    clearTimeout(armT.current);
    if (armed !== key) {
      setArmed(key);
      armT.current = setTimeout(
        () => setArmed((k) => (k === key ? null : k)),
        ARM_MS,
      );
      return;
    }
    setArmed(null);
    if (!row) return;
    setDeleteError("");
    // The row turns to dust first; once its space has closed the delete is
    // applied, so the rows below slide up instead of jumping.
    await new Promise<void>((started) => {
      void snapAway(row, () => {
        mark(key, true);
        started();
      });
    });
    await new Promise((r) => setTimeout(r, COLLAPSE_MS));
    const ok = await Promise.resolve(run()).catch(() => false);
    if (!ok) {
      row.style.visibility = "";
      setDeleteError(
        "Couldn't delete that chat. Check your connection and try again.",
      );
    }
    mark(key, false);
  };

  // ---------- tabs ----------
  const chatCount = p.savedChats.length + p.sessions.length;
  const counts: Record<Tab, number> = {
    chats: chatCount,
    viewed: p.viewed.length,
    purchases: p.purchases?.length ?? 0,
  };
  const labels: Record<Tab, string> = {
    chats: "Chats",
    viewed: "Viewed",
    purchases: "Purchases",
  };
  const tabIndex = TABS.indexOf(tab);
  const onTabKey = (e: ReactKeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const step = e.key === "ArrowRight" ? 1 : TABS.length - 1;
    const next = TABS[(tabIndex + step) % TABS.length];
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <>
      {p.open && (
        <div
          onClick={p.onClose}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(7,26,37,.24)",
            zIndex: 70,
            animation: "aqIn .25s ease both",
          }}
        />
      )}
      <aside
        aria-label="History"
        aria-hidden={!p.open}
        inert={!p.open}
        className="aq-glass"
        style={{
          // Rendered at the root (not inside <main>) so it spans the full page height
          // and sits above the header and its scrim.
          position: "absolute",
          top: 8,
          left: 8,
          bottom: 8,
          width: "min(320px, calc(100% - 16px))",
          borderRadius: 26,
          zIndex: 71,
          background: "rgba(var(--aq-gl),.78)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transform: p.open ? "none" : "translateX(calc(-100% - 24px))",
          opacity: p.open ? 1 : 0,
          transition:
            "transform .45s cubic-bezier(.22,.8,.24,1), opacity .3s ease",
        }}
      >
        {/* ---------- header ---------- */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "16px 14px 12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{ fontWeight: 700, fontSize: 16, flex: 1, paddingLeft: 4 }}
            >
              History
            </span>
            <button
              type="button"
              className="aq-icon-btn"
              onClick={p.onClose}
              aria-label="Close history"
            >
              <X size={16} />
            </button>
          </div>
          <button
            type="button"
            className="aq-btn aq-btn-primary"
            onClick={p.onNewChat}
            disabled={p.locked}
            style={{ width: "100%", fontSize: 13.5 }}
          >
            <Plus size={16} /> New chat
          </button>
          <div
            role="tablist"
            aria-label="History"
            className="aq-dock-tabs"
            style={{ "--ti": tabIndex, "--tabs": TABS.length } as CSSProperties}
            onKeyDown={onTabKey}
          >
            <span className="aq-dock-tab-pill" aria-hidden="true" />
            {TABS.map((t) => (
              <button
                key={t}
                ref={(el) => {
                  tabRefs.current[t] = el;
                }}
                type="button"
                role="tab"
                id={`aq-dock-tab-${t}`}
                aria-selected={tab === t}
                aria-controls={`aq-dock-panel-${t}`}
                tabIndex={tab === t ? 0 : -1}
                className="aq-dock-tab"
                onClick={() => setTab(t)}
              >
                {labels[t]}
                <span className="aq-dock-count">{counts[t]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ---------- lists: the panels sit side by side and slide ---------- */}
        <div className="aq-dock-viewport">
          <div
            className="aq-dock-track"
            style={{ "--ti": tabIndex, "--tabs": TABS.length } as CSSProperties}
          >
            <div
              className="aq-dock-panel aq-noscroll"
              role="tabpanel"
              id="aq-dock-panel-chats"
              aria-labelledby="aq-dock-tab-chats"
              data-active={tab === "chats"}
              inert={tab !== "chats"}
            >
              {deleteError && (
                <span role="alert" className="aq-dock-error">
                  {deleteError}
                </span>
              )}
              {chatCount ? (
                <>
                  {!!p.savedChats.length && (
                    <div className="aq-dock-group">
                      <span className="aq-label aq-dock-group-label">
                        Saved to your account
                      </span>
                      {p.savedChats.map((s, i) => {
                        const key = `s:${s.id}`;
                        return (
                          <ChatRow
                            key={key}
                            index={i}
                            title={s.title}
                            meta={[
                              s.messageCount
                                ? plural(s.messageCount, "message")
                                : "",
                              ago(Date.parse(s.lastMessageAt)),
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                            disabled={p.locked}
                            going={going.has(key)}
                            armed={armed === key}
                            onClick={() => p.onOpenSaved(s.id)}
                            onDelete={(row) =>
                              remove(key, row, () => p.onDeleteSaved(s.id))
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                  {!!p.sessions.length && (
                    <div className="aq-dock-group">
                      <span className="aq-label aq-dock-group-label">
                        {p.userName ? "Earlier this visit" : "This visit only"}
                      </span>
                      {p.sessions.map((s, i) => {
                        const key = `l:${s.id}`;
                        return (
                          <ChatRow
                            key={key}
                            index={p.savedChats.length + i}
                            title={s.title}
                            meta={`${plural(s.messages.length, "message")} · ${ago(s.at)}`}
                            disabled={p.locked}
                            going={going.has(key)}
                            armed={armed === key}
                            onClick={() => p.onRestore(s.id)}
                            onDelete={(row) =>
                              remove(key, row, () => p.onDeleteSession(s.id))
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Empty
                  icon={<MessageSquare size={18} />}
                  title="No chats yet"
                  text={
                    p.userName
                      ? "Start a chat with Aqua. It's saved to your account and shows up here."
                      : "Chats from this visit show up here. Sign in to keep them after you leave."
                  }
                />
              )}
            </div>

            <div
              className="aq-dock-panel aq-noscroll"
              role="tabpanel"
              id="aq-dock-panel-viewed"
              aria-labelledby="aq-dock-tab-viewed"
              data-active={tab === "viewed"}
              inert={tab !== "viewed"}
            >
              {p.viewed.length ? (
                <div className="aq-dock-grid">
                  {p.viewed.map((v, i) => (
                    <button
                      key={v.id}
                      type="button"
                      className="aq-dock-product"
                      style={stagger(i)}
                      disabled={!p.canView}
                      onClick={() => p.onView(v.id)}
                    >
                      <span
                        aria-hidden="true"
                        className="aq-dock-product-img"
                        style={{
                          background: v.photos[0]
                            ? `center / contain no-repeat url("${v.photos[0]}"), #fff`
                            : "repeating-linear-gradient(135deg, var(--aq-mint) 0 6px, var(--aq-tint) 6px 12px)",
                        }}
                      />
                      <span className="aq-dock-product-title">{v.title}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                        {INR(v.price)}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: v.inStock ? "var(--aq-mintink)" : "#B42318",
                        }}
                      >
                        {v.stock}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <Empty
                  icon={<Eye size={18} />}
                  title="Nothing viewed yet"
                  text="Products you open or compare with Aqua show up here, so you can get back to them."
                />
              )}
            </div>

            <div
              className="aq-dock-panel aq-noscroll"
              role="tabpanel"
              id="aq-dock-panel-purchases"
              aria-labelledby="aq-dock-tab-purchases"
              data-active={tab === "purchases"}
              inert={tab !== "purchases"}
            >
              {!p.userName ? (
                <Empty
                  icon={<Receipt size={18} />}
                  title="Your purchases live here"
                  text="Sign in with Google to see your invoices and past orders from Aquakart."
                />
              ) : p.purchases === null ? (
                <div
                  className="aq-dock-group"
                  role="status"
                  aria-label="Loading your purchases"
                >
                  {[0, 1, 2].map((n) => (
                    <span key={n} className="aq-dock-skeleton" />
                  ))}
                </div>
              ) : p.purchases.length ? (
                <div className="aq-dock-group">
                  <span className="aq-label aq-dock-group-label">
                    Invoices on your account
                  </span>
                  {p.purchases.map((inv, i) => {
                    const title = inv.items.length
                      ? `${inv.items[0]}${inv.itemCount > 1 ? ` + ${inv.itemCount - 1} more` : ""}`
                      : `Invoice ${inv.invoiceNo}`;
                    const paid = isPaid(inv.paidStatus);
                    return (
                      <div
                        key={inv.id}
                        className="aq-dock-item"
                        style={stagger(i)}
                      >
                        <div
                          className="aq-dock-item-inner"
                          onPointerEnter={(e) =>
                            e.pointerType === "mouse" &&
                            startMarquee(e.currentTarget)
                          }
                          onPointerLeave={(e) => stopMarquee(e.currentTarget)}
                          onFocus={(e) => startMarquee(e.currentTarget)}
                          onBlur={(e) => stopMarquee(e.currentTarget)}
                        >
                          {/* Opens in a new tab so this chat stays where it is; the
                              invoice page verifies with Google before showing it. */}
                          <a
                            className="aq-dock-row aq-dock-purchase"
                            href={`/invoice/${encodeURIComponent(inv.id)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`${title} · Invoice ${inv.invoiceNo}`}
                          >
                            <span
                              className="aq-dock-row-icon"
                              aria-hidden="true"
                            >
                              <Receipt size={15} />
                            </span>
                            <span className="aq-dock-row-text">
                              <span className="aq-dock-row-title">
                                <span className="aq-marquee-text">{title}</span>
                              </span>
                              {/* Status leads the details line so the product name
                                  keeps the full width above it. */}
                              <span className="aq-dock-row-meta">
                                {inv.paidStatus &&
                                  inv.paidStatus !== "Not available" && (
                                    <span
                                      className="aq-dock-status"
                                      data-paid={paid}
                                    >
                                      {paid ? "Paid" : inv.paidStatus}
                                    </span>
                                  )}
                                {[INR(inv.total_price), shortDate(inv.date)]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </span>
                            <ExternalLink
                              size={13}
                              className="aq-dock-row-chev"
                              aria-hidden="true"
                            />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty
                  icon={<Receipt size={18} />}
                  title="No purchases yet"
                  text="Invoices for products you buy from Aquakart, online or in store, show up here."
                />
              )}
            </div>
          </div>
        </div>

        {/* ---------- footer: settings, help, account ---------- */}
        <div className="aq-dock-footer">
          {p.onToggleThinking && (
            <button
              type="button"
              role="switch"
              aria-checked={p.thinking}
              onClick={p.onToggleThinking}
              className="aq-dock-row"
            >
              <span className="aq-dock-row-icon" aria-hidden="true">
                <Brain size={15} color={p.thinking ? "#10BFA4" : undefined} />
              </span>
              <span className="aq-dock-row-text">
                <span className="aq-dock-row-title">Show thinking</span>
                <span className="aq-dock-row-meta">
                  {p.thinking
                    ? "See the steps behind each answer"
                    : "Off for faster replies"}
                </span>
              </span>
              <span
                className="aq-dock-switch"
                data-on={p.thinking}
                aria-hidden="true"
              >
                <span />
              </span>
            </button>
          )}
          <button type="button" className="aq-dock-row" onClick={openExpert}>
            <span className="aq-dock-row-icon" aria-hidden="true">
              <MessageCircle size={15} />
            </span>
            <span className="aq-dock-row-text">
              <span className="aq-dock-row-title">Talk to an expert</span>
              <span className="aq-dock-row-meta">
                Get help from the AquaKart team
              </span>
            </span>
            <ChevronRight
              size={15}
              className="aq-dock-row-chev"
              aria-hidden="true"
            />
          </button>
          <button type="button" className="aq-dock-row" onClick={p.onStartTour}>
            <span className="aq-dock-row-icon" aria-hidden="true">
              <Compass size={15} />
            </span>
            <span className="aq-dock-row-text">
              <span className="aq-dock-row-title">Take the tour</span>
              <span className="aq-dock-row-meta">
                A 30-second look at what Aqua can do
              </span>
            </span>
            <ChevronRight
              size={15}
              className="aq-dock-row-chev"
              aria-hidden="true"
            />
          </button>

          {p.userName ? (
            <div className="aq-dock-account">
              <Avatar name={p.userName} size={32} />
              <span className="aq-dock-row-text">
                <span className="aq-dock-row-title">{p.userName}</span>
                <span
                  className="aq-dock-row-meta"
                  style={{ color: "var(--aq-mintink)" }}
                >
                  Chats, cart and favourites synced
                </span>
              </span>
              <button
                type="button"
                className="aq-icon-btn"
                onClick={p.onSignOut}
                disabled={p.authBusy || p.locked}
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div
              className="aq-dock-account"
              style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}
            >
              <span
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  color: "var(--aq-body)",
                }}
              >
                <b style={{ color: "var(--aq-ink)" }}>
                  Save your chats and picks.
                </b>{" "}
                Keep chats, viewed products, cart and favourites, and pay with
                saved addresses.
              </span>
              <button
                type="button"
                className="aq-btn aq-btn-dark"
                onClick={p.onSignIn}
                disabled={p.authBusy}
                style={{ height: 38, fontSize: 13 }}
              >
                {p.authBusy ? "Signing in…" : "Sign in with Google"}
              </button>
              {p.authError && (
                <span role="alert" style={{ fontSize: 12, color: "#B42318" }}>
                  {p.authError}
                </span>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
