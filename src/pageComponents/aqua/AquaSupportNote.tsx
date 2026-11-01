"use client";

import { useId, useState } from "react";
import { ChevronDown, Headset, MessageCircle, Phone } from "lucide-react";
import {
  AI_SUPPORT_NOTE,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_TEL,
  supportWhatsAppUrl,
} from "@/utils/support";

// Under the latest AI answer on /aqua: suggestions only, confirm with support.
// A one-line accordion that opens smoothly onto the note and the call /
// WhatsApp buttons, so it doesn't take the chat's space until it's wanted.
// tel: and the WhatsApp tab don't navigate the Aqua page.
export default function AquaSupportNote({ question }: { question?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <aside
      aria-label="Contact AquaKart support"
      className="aq-support"
      data-open={open}
    >
      <button
        type="button"
        className="aq-support-head"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        <Headset size={16} aria-hidden="true" />
        <span>
          <b>Contact us</b>
          <span className="aq-support-sub"> · confirm with an expert</span>
        </span>
        <ChevronDown size={16} className="aq-support-chev" aria-hidden="true" />
      </button>
      {/* grid rows 0fr → 1fr: the height animates to the content's own. */}
      <div id={id} className="aq-support-body" inert={!open}>
        <div className="aq-support-inner">
          <p>{AI_SUPPORT_NOTE}</p>
          <div className="aq-support-acts">
            <a
              href={SUPPORT_TEL}
              aria-label={`Call AquaKart support on ${SUPPORT_PHONE_DISPLAY}`}
              className="aq-support-btn"
              style={{ background: "rgba(7,26,37,.85)" }}
            >
              <Phone size={14} aria-hidden="true" />
              Call support
            </a>
            <a
              href={supportWhatsAppUrl(question)}
              target="_blank"
              rel="noopener noreferrer"
              className="aq-support-btn"
              style={{ background: "#25D366" }}
            >
              <MessageCircle size={14} aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
