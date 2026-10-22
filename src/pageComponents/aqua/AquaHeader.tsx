"use client";

import { Clock, Heart, Moon, Plus, ShoppingCart, Sun } from "lucide-react";
import type { Flow } from "@/utils/aquaFlow";
import logo from "@/assests/logo.png";
import AquaDroplet from "./AquaDroplet";
import { aquaConfig } from "./config";
import type { Mood } from "./types";
import type { ShopTab } from "./ShopPopover";

type Props = {
  flow: Flow;
  mood: Mood;
  dark: boolean;
  statusText: string;
  catalogueLabel: string;
  isMobile: boolean;
  locked: boolean;
  cartCount: number;
  favCount: number;
  historyCount: number;
  dockOpen: boolean;
  onToggleDock: () => void;
  onLogo: () => void;
  onToggleTheme: () => void;
  onOpenShop: (tab: ShopTab) => void;
  onNewChat: () => void;
};

// Opens WhatsApp in a new tab: no in-app navigation.
export const openExpert = () => {
  const text = encodeURIComponent(
    "Hi Aquakart, I'd like to talk to an expert about water softeners and purifiers.",
  );
  window.open(
    `https://wa.me/${aquaConfig.expertWhatsApp}?text=${text}`,
    "_blank",
    "noopener,noreferrer",
  );
};

export default function AquaHeader(p: Props) {
  const isWelcome = p.flow.state === "welcome";
  return (
    <div
      style={{
        position: "relative",
        zIndex: 40,
        flexShrink: 0,
        margin: "8px auto 6px",
        width: "calc(100% - 24px)",
      }}
    >
      <header
        className="aq-glass"
        style={{
          height: p.isMobile ? 52 : 44,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 5px",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          className="aq-icon-btn"
          onClick={p.onToggleDock}
          aria-label="Toggle history"
          aria-expanded={p.dockOpen}
          style={{ background: p.dockOpen ? "var(--aq-mint)" : undefined }}
        >
          <Clock size={17} />
          {p.historyCount > 0 && (
            <span className="aq-badge" style={{ background: "#008B68" }}>
              {p.historyCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={p.onLogo}
          disabled={p.locked}
          aria-label="Aquakart home"
          title={
            p.locked ? "Finish or wait for the payment first" : "Start screen"
          }
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            color: "var(--aq-ink)",
            border: 0,
            background: "transparent",
            padding: "0 4px",
            cursor: p.locked ? "default" : "pointer",
            flexShrink: 0,
            minHeight: p.isMobile ? 44 : 32,
            minWidth: p.isMobile ? 44 : undefined,
          }}
        >
          <img
            src={logo.src}
            alt=""
            width={26}
            height={26}
            style={{ display: "block" }}
          />
          {!p.isMobile && (
            <span
              className="aq-display"
              style={{ fontWeight: 700, fontSize: 16 }}
            >
              Aquakart
            </span>
          )}
        </button>
        {!p.isMobile && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "#008B68",
              background: "rgba(var(--aq-mintrgb),.9)",
              padding: "3px 8px",
              borderRadius: 999,
              whiteSpace: "nowrap",
            }}
          >
            Aqua AI
          </span>
        )}

        {!isWelcome && p.isMobile ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <span aria-live="polite" className="aq-sr-only">
              {p.statusText}
            </span>
          </div>
        ) : !isWelcome ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
              paddingLeft: 8,
              marginLeft: 2,
              borderLeft: "1px solid rgba(var(--aq-ln),.08)",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: 28,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <AquaDroplet mood={p.mood} size={24} dark={p.dark} />
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", minWidth: 0 }}
            >
              <span style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.1 }}>
                Aqua
              </span>
              <span
                aria-live="polite"
                style={{
                  fontSize: 11.5,
                  color: "var(--aq-mut)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {p.statusText}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: 0 }} />
        )}

        {p.catalogueLabel && !p.isMobile && (
          <span
            className="aq-mono"
            title="Live catalogue API not reachable. Products, prices and delivery checks are demo data."
            style={{
              fontSize: 11,
              color: "var(--aq-mut)",
              border: "1px dashed #B9CFCB",
              padding: "3px 8px",
              borderRadius: 999,
              whiteSpace: "nowrap",
            }}
          >
            {p.catalogueLabel}
          </span>
        )}
        {!p.isMobile && (
          <button
            type="button"
            onClick={openExpert}
            className="aq-btn aq-btn-ghost"
            style={{
              height: 32,
              padding: "0 8px",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Talk to an expert
          </button>
        )}
        <button
          type="button"
          className="aq-icon-btn"
          onClick={p.onToggleTheme}
          aria-label={p.dark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {p.dark ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button
          type="button"
          className="aq-icon-btn"
          onClick={() => p.onOpenShop("fav")}
          aria-label={`Favourites, ${p.favCount} items`}
        >
          <Heart size={16} />
          {p.favCount > 0 && (
            <span className="aq-badge" style={{ background: "#E0476B" }}>
              {p.favCount}
            </span>
          )}
        </button>
        <button
          type="button"
          className="aq-icon-btn"
          onClick={() => p.onOpenShop("cart")}
          aria-label={`Cart, ${p.cartCount} items`}
        >
          <ShoppingCart size={16} />
          {p.cartCount > 0 && (
            <span className="aq-badge" style={{ background: "#008B68" }}>
              {p.cartCount}
            </span>
          )}
        </button>
        <button
          type="button"
          className="aq-btn aq-btn-dark"
          onClick={p.onNewChat}
          disabled={p.locked}
          aria-label="New chat"
          style={{
            height: p.isMobile ? 44 : 32,
            minWidth: p.isMobile ? 44 : undefined,
            padding: "0 12px",
            fontSize: 12.5,
          }}
        >
          <Plus size={15} />
          {!p.isMobile && <span>New chat</span>}
        </button>
      </header>
    </div>
  );
}
