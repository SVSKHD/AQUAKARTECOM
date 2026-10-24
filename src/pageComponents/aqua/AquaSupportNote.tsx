"use client";

import { Info, MessageCircle, Phone } from "lucide-react";
import {
  AI_SUPPORT_NOTE,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_TEL,
  supportWhatsAppUrl,
} from "@/utils/support";

// Shown under the latest AI answer on /aqua: suggestions only, confirm with support.
// tel: and the WhatsApp tab don't navigate the Aqua page.
export default function AquaSupportNote({ question }: { question?: string }) {
  const btn = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    padding: "0 14px",
    borderRadius: 999,
    fontSize: 12.5,
    fontWeight: 800,
    color: "#fff",
    textDecoration: "none",
  } as const;
  return (
    <aside
      aria-label="Confirm with AquaKart support"
      style={{
        width: "100%",
        maxWidth: 560,
        borderRadius: 16,
        border: "1px solid #F2E2C2",
        background: "rgba(255,248,236,.92)",
        color: "#5C4413",
        padding: "10px 14px 12px",
        fontSize: 13,
        lineHeight: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        animation: "aqCardIn .4s ease both",
      }}
    >
      <p style={{ margin: 0, display: "flex", gap: 8 }}>
        <Info
          size={16}
          color="#B7791F"
          aria-hidden="true"
          style={{ flexShrink: 0, marginTop: 2 }}
        />
        <span>{AI_SUPPORT_NOTE}</span>
      </p>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingLeft: 24 }}
      >
        <a
          href={SUPPORT_TEL}
          aria-label={`Call AquaKart support on ${SUPPORT_PHONE_DISPLAY}`}
          style={{ ...btn, background: "rgba(7,26,37,.85)" }}
        >
          <Phone size={14} aria-hidden="true" />
          Call support
        </a>
        <a
          href={supportWhatsAppUrl(question)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...btn, background: "#25D366" }}
        >
          <MessageCircle size={14} aria-hidden="true" />
          WhatsApp
        </a>
      </div>
    </aside>
  );
}
