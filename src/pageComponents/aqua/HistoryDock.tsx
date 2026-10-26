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
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Compass,
  ExternalLink,
  Eye,
  Receipt,
  LogOut,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { CHAT_TITLE_MAX } from "@/services/ai";
import type { BlogRead } from "./blogReads";
import { INR } from "./catalogue";
import { Avatar, openExpert } from "./AquaHeader";
import { snapAway } from "./snapDust";
import { bestCoupon, type ActiveCoupon } from "./coupons";
import MiniProductCard from "./MiniProductCard";
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
  // Lets each viewed product show its favourite / cart state and the coupon
  // that saves the most on it.
  favIds: string[];
  cartIds: string[];
  coupons: ActiveCoupon[];
  onToggleFav: (id: string) => void;
  onAddToCart: (id: string) => void;
  onUseCoupon: (code: string) => void;
  // Invoices on the signed-in account; null while loading (or signed out).
  purchases: Purchase[] | null;
  canView: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onRestore: (id: string) => void;
  onStartTour: () => void;
  onDeleteSaved: (id: string) => Promise<boolean>;
  onDeleteSession: (id: string) => boolean;
  onRenameSaved: (id: string, title: string) => Promise<boolean>;
  onPinSaved: (id: string, pinned: boolean) => Promise<boolean>;
  onRenameSession: (id: string, title: string) => boolean;
  onPinSession: (id: string, pinned: boolean) => boolean;
  onView: (id: string) => void;
  userName: string | null;
  authBusy: boolean;
  authError: string;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenProfile: (tab?: "profile" | "addresses" | "purchases") => void;
  // Blog reads; listed here once the floating reads bar is closed (docked).
  reads: BlogRead[];
  readsDocked: boolean;
  // Floats the reads bar again, opened on this read if one is given.
  onFloatReads: (readId?: string) => void;
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

const LONG_PRESS_MS = 480;

// Where the chat menu opens: under the ⋯ button, or at the pointer for a
// right-click / long-press.
type MenuAt = { key: string; x: number; y: number; from: HTMLElement | null };

function ChatRow(p: {
  rowKey: string;
  title: string;
  meta: string;
  pinned: boolean;
  index: number;
  disabled: boolean;
  going: boolean;
  menuOpen: boolean;
  renaming: boolean;
  onClick: () => void;
  onMenu: (at: Omit<MenuAt, "key">) => void;
  onRenameDone: (title: string | null) => void;
}) {
  const press = useRef<{
    t: ReturnType<typeof setTimeout>;
    x: number;
    y: number;
  } | null>(null);
  const suppressClick = useRef(false);
  const cancelPress = () => {
    if (press.current) clearTimeout(press.current.t);
    press.current = null;
  };
  useEffect(() => cancelPress, []);

  return (
    <div className="aq-dock-item" data-going={p.going} style={stagger(p.index)}>
      <div
        className="aq-dock-item-inner"
        data-row-key={p.rowKey}
        data-menu-open={p.menuOpen}
        onPointerEnter={(e) =>
          e.pointerType === "mouse" &&
          !p.renaming &&
          startMarquee(e.currentTarget)
        }
        onPointerLeave={(e) => stopMarquee(e.currentTarget)}
        onFocus={(e) => !p.renaming && startMarquee(e.currentTarget)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null))
            stopMarquee(e.currentTarget);
        }}
        // Right-click: our menu instead of the browser's.
        onContextMenu={(e) => {
          if (p.disabled || p.going || p.renaming) return;
          e.preventDefault();
          p.onMenu({ x: e.clientX, y: e.clientY, from: null });
        }}
        // Long-press on touch opens the same menu.
        onPointerDown={(e) => {
          if (e.pointerType !== "touch" || p.disabled || p.going || p.renaming)
            return;
          const { clientX: x, clientY: y } = e;
          press.current = {
            x,
            y,
            t: setTimeout(() => {
              press.current = null;
              suppressClick.current = true;
              navigator.vibrate?.(10);
              p.onMenu({ x, y, from: null });
            }, LONG_PRESS_MS),
          };
        }}
        onPointerMove={(e) => {
          const s = press.current;
          if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 8)
            cancelPress();
        }}
        onPointerUp={cancelPress}
        onPointerCancel={cancelPress}
      >
        {p.renaming ? (
          <div className="aq-dock-row aq-dock-row-editing">
            <span className="aq-dock-row-icon" aria-hidden="true">
              <Pencil size={14} />
            </span>
            <RenameField title={p.title} onDone={p.onRenameDone} />
          </div>
        ) : (
          <button
            type="button"
            className="aq-dock-row"
            title={p.title}
            onClick={() => {
              if (suppressClick.current)
                return void (suppressClick.current = false);
              p.onClick();
            }}
            disabled={p.disabled || p.going}
          >
            <span className="aq-dock-row-icon" aria-hidden="true">
              <MessageSquare size={15} />
            </span>
            <span className="aq-dock-row-text">
              <span className="aq-dock-row-title">
                {p.pinned && (
                  <Pin
                    size={11}
                    className="aq-dock-pin-mark"
                    aria-label="Pinned"
                  />
                )}
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
        )}
        {!p.renaming && (
          <button
            type="button"
            className="aq-dock-more"
            aria-label={`More for "${p.title}"`}
            aria-haspopup="menu"
            aria-expanded={p.menuOpen}
            disabled={p.disabled || p.going}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              p.onMenu({ x: r.right, y: r.bottom + 4, from: e.currentTarget });
            }}
          >
            <MoreHorizontal size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

// Inline rename: Enter or clicking away saves, Esc cancels; empty = no change.
function RenameField({
  title,
  onDone,
}: {
  title: string;
  onDone: (title: string | null) => void;
}) {
  const [value, setValue] = useState(title);
  const done = useRef(false);
  const finish = (save: boolean) => {
    if (done.current) return;
    done.current = true;
    const clean = value.replace(/\s+/g, " ").trim();
    onDone(save && clean && clean !== title ? clean : null);
  };
  return (
    <input
      className="aq-dock-rename"
      aria-label="Chat name"
      value={value}
      maxLength={CHAT_TITLE_MAX}
      autoFocus
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finish(true);
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation(); // Esc cancels the rename, not the whole dock
          finish(false);
        }
      }}
      onBlur={() => finish(true)}
    />
  );
}

type MenuItem = {
  id: string;
  label: string;
  Icon: typeof Pin;
  danger?: boolean;
  run: () => void;
};

// The chat context menu. Arrow keys move, Enter picks, Esc / outside click /
// scrolling closes; focus goes back to where it came from.
function ChatMenu({
  at,
  items,
  host,
  onClose,
}: {
  at: MenuAt;
  items: MenuItem[];
  host: Element;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: at.x, top: at.y, ready: false });

  // Keep it on screen: flip left / up when it would overflow.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const pad = 8;
    const left = Math.max(
      pad,
      Math.min(at.from ? at.x - w : at.x, innerWidth - w - pad),
    );
    const top =
      at.y + h > innerHeight - pad
        ? Math.max(
            pad,
            (at.from ? at.from.getBoundingClientRect().top - 4 : at.y) - h,
          )
        : at.y;
    setPos({ left, top, ready: true });
    el.querySelector<HTMLElement>("[role=menuitem]")?.focus();
  }, [at]);

  useEffect(() => {
    const close = (e: Event) => {
      const t = e.target as Node;
      // Inside the menu, or on the ⋯ that opened it (its click toggles it shut).
      if (
        e.type === "pointerdown" &&
        (ref.current?.contains(t) || at.from?.contains(t))
      )
        return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        at.from?.focus();
      }
    };
    window.addEventListener("pointerdown", close, true);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("pointerdown", close, true);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [at, onClose]);

  const move = (e: ReactKeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const list = [
      ...(ref.current?.querySelectorAll<HTMLElement>("[role=menuitem]") || []),
    ];
    const i = list.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? list.length - 1
          : (i + (e.key === "ArrowDown" ? 1 : list.length - 1)) % list.length;
    list[next]?.focus();
  };

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label="Chat options"
      className="aq-dock-menu"
      data-ready={pos.ready}
      style={{ left: pos.left, top: pos.top }}
      onKeyDown={move}
    >
      {items.map(({ id, label, Icon, danger, run }) => (
        <button
          key={id}
          type="button"
          role="menuitem"
          className="aq-dock-menu-item"
          data-danger={danger}
          onClick={run}
        >
          <Icon size={15} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>,
    host,
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
  const [actionError, setActionError] = useState("");
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
    setActionError("");
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
      setActionError(
        "Couldn't delete that chat. Check your connection and try again.",
      );
    }
    mark(key, false);
  };

  // ---------- chat rows: pinned first, then saved, then this visit ----------
  type Row = {
    key: string;
    kind: "saved" | "local";
    id: string;
    title: string;
    meta: string;
    pinned: boolean;
  };
  const savedRows: Row[] = p.savedChats.map((s) => ({
    key: `s:${s.id}`,
    kind: "saved",
    id: s.id,
    title: s.title,
    meta: [
      s.messageCount ? plural(s.messageCount, "message") : "",
      ago(Date.parse(s.lastMessageAt)),
    ]
      .filter(Boolean)
      .join(" · "),
    pinned: s.pinned,
  }));
  const localRows: Row[] = p.sessions.map((s) => ({
    key: `l:${s.id}`,
    kind: "local",
    id: s.id,
    title: s.title,
    meta: `${plural(s.messages.length, "message")} · ${ago(s.at)}`,
    pinned: !!s.pinned,
  }));
  const groups = [
    {
      label: "Pinned",
      rows: [...savedRows, ...localRows].filter((r) => r.pinned),
    },
    {
      label: "Saved to your account",
      rows: savedRows.filter((r) => !r.pinned),
    },
    {
      label: p.userName ? "Earlier this visit" : "This visit only",
      rows: localRows.filter((r) => !r.pinned),
    },
  ].filter((g) => g.rows.length);
  const rowByKey = new Map([...savedRows, ...localRows].map((r) => [r.key, r]));

  // ---------- chat menu: pin / rename / delete ----------
  const asideRef = useRef<HTMLElement>(null);
  const [menu, setMenu] = useState<MenuAt | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  // The menu renders into .aq-root (theme variables) rather than inside the
  // dock, whose backdrop-filter would re-anchor a fixed-position popup.
  const [host, setHost] = useState<Element | null>(null);
  useEffect(() => {
    setHost(asideRef.current?.closest(".aq-root") ?? document.body);
  }, []);
  useEffect(() => {
    if (open) return;
    setMenu(null);
    setRenaming(null);
  }, [open]);
  const closeMenu = () => {
    setMenu(null);
    setArmed(null);
  };

  const togglePin = async (r: Row) => {
    closeMenu();
    setActionError("");
    const ok =
      r.kind === "saved"
        ? await p.onPinSaved(r.id, !r.pinned)
        : p.onPinSession(r.id, !r.pinned);
    if (!ok)
      setActionError(
        `Couldn't ${r.pinned ? "unpin" : "pin"} that chat. Try again.`,
      );
  };
  const finishRename = async (r: Row, title: string | null) => {
    setRenaming(null);
    // Back to the row, so keyboard users keep their place.
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>(
          `[data-row-key="${CSS.escape(r.key)}"] .aq-dock-row`,
        )
        ?.focus({ preventScroll: true }),
    );
    if (!title) return;
    setActionError("");
    const ok =
      r.kind === "saved"
        ? await p.onRenameSaved(r.id, title)
        : p.onRenameSession(r.id, title);
    if (!ok) setActionError("Couldn't rename that chat. Try again.");
  };
  // First click arms (the item turns into a confirm); the second snaps it away.
  const deleteRow = (r: Row) => {
    const run = () =>
      r.kind === "saved" ? p.onDeleteSaved(r.id) : p.onDeleteSession(r.id);
    if (armed !== r.key) return void remove(r.key, null, run);
    setMenu(null);
    void remove(
      r.key,
      document.querySelector<HTMLElement>(
        `[data-row-key="${CSS.escape(r.key)}"]`,
      ),
      run,
    );
  };
  const menuRow = menu ? rowByKey.get(menu.key) : undefined;
  const menuItems: MenuItem[] = menuRow
    ? [
        {
          id: "pin",
          label: menuRow.pinned ? "Unpin" : "Pin to top",
          Icon: menuRow.pinned ? PinOff : Pin,
          run: () => void togglePin(menuRow),
        },
        {
          id: "rename",
          label: "Rename",
          Icon: Pencil,
          run: () => {
            closeMenu();
            setRenaming(menuRow.key);
          },
        },
        {
          id: "delete",
          label: armed === menuRow.key ? "Click again to delete" : "Delete",
          Icon: Trash2,
          danger: true,
          run: () => deleteRow(menuRow),
        },
      ]
    : [];

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
        ref={asideRef}
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
              {actionError && (
                <span role="alert" className="aq-dock-error">
                  {actionError}
                </span>
              )}
              {chatCount ? (
                groups.map((g, gi) => (
                  <div key={g.label} className="aq-dock-group">
                    <span className="aq-label aq-dock-group-label">
                      {gi === 0 && g.label === "Pinned" && (
                        <Pin
                          size={10}
                          aria-hidden="true"
                          style={{ marginRight: 4, verticalAlign: -1 }}
                        />
                      )}
                      {g.label}
                    </span>
                    {g.rows.map((r, i) => (
                      <ChatRow
                        key={r.key}
                        rowKey={r.key}
                        index={i}
                        title={r.title}
                        meta={r.meta}
                        pinned={r.pinned}
                        disabled={p.locked}
                        going={going.has(r.key)}
                        menuOpen={menu?.key === r.key}
                        renaming={renaming === r.key}
                        onClick={() =>
                          r.kind === "saved"
                            ? p.onOpenSaved(r.id)
                            : p.onRestore(r.id)
                        }
                        onMenu={(at) => {
                          if (menu?.key === r.key && at.from)
                            return closeMenu();
                          setArmed(null);
                          setMenu({ key: r.key, ...at });
                        }}
                        onRenameDone={(title) => void finishRename(r, title)}
                      />
                    ))}
                  </div>
                ))
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
                    <MiniProductCard
                      key={v.id}
                      product={v}
                      isFav={p.favIds.includes(v.id)}
                      inCart={p.cartIds.includes(v.id)}
                      canView={p.canView}
                      deal={bestCoupon(v, p.coupons)}
                      style={stagger(i)}
                      onView={p.onView}
                      onToggleFav={p.onToggleFav}
                      onAddToCart={p.onAddToCart}
                      onUseCoupon={p.onUseCoupon}
                    />
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
          {p.readsDocked && p.reads.length > 0 && (
            <section className="aq-dock-reads" aria-label="Water reads">
              <div className="aq-dock-reads-head">
                <span className="aq-label">Water reads</span>
                <button
                  type="button"
                  className="aq-hard-link"
                  onClick={() => p.onFloatReads()}
                >
                  Float again
                </button>
              </div>
              {p.reads.slice(0, 4).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="aq-dock-row"
                  onClick={() => p.onFloatReads(r.id)}
                >
                  <span className="aq-dock-row-icon" aria-hidden="true">
                    <BookOpen size={15} />
                  </span>
                  <span className="aq-dock-row-text">
                    <span className="aq-dock-row-title">{r.title}</span>
                    <span className="aq-dock-row-meta">
                      {r.minutes} min read · read or listen
                    </span>
                  </span>
                  <ChevronRight
                    size={15}
                    className="aq-dock-row-chev"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </section>
          )}
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
          {/* The full catalogue with filters (a Pages Router route). */}
          <a className="aq-dock-row" href="/shop">
            <span className="aq-dock-row-icon" aria-hidden="true">
              <Store size={15} />
            </span>
            <span className="aq-dock-row-text">
              <span className="aq-dock-row-title">Shop all products</span>
              <span className="aq-dock-row-meta">
                Browse and filter the whole catalogue
              </span>
            </span>
            <ChevronRight
              size={15}
              className="aq-dock-row-chev"
              aria-hidden="true"
            />
          </a>
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
              <button
                type="button"
                className="aq-dock-account-open"
                onClick={() => p.onOpenProfile()}
                aria-label={`${p.userName}: profile, addresses and purchases`}
              >
                <Avatar name={p.userName} size={32} />
                <span className="aq-dock-row-text">
                  <span className="aq-dock-row-title">{p.userName}</span>
                  <span
                    className="aq-dock-row-meta"
                    style={{ color: "var(--aq-mintink)" }}
                  >
                    Profile, addresses and purchases
                  </span>
                </span>
              </button>
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

      {menu && menuRow && host && (
        <ChatMenu at={menu} items={menuItems} host={host} onClose={closeMenu} />
      )}
    </>
  );
}
