import { Info, MessageCircle, Phone } from "lucide-react";
import {
  AI_SUPPORT_NOTE,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_TEL,
  supportWhatsAppUrl,
} from "@/utils/support";

// Shown under the latest AI answer: suggestions only, confirm with support.
export default function SupportNote({ question }) {
  return (
    <aside
      aria-label="Confirm with AquaKart support"
      className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-3.5 py-3 text-xs leading-5 text-amber-900"
    >
      <p className="flex gap-2">
        <Info
          size={15}
          className="mt-0.5 flex-none text-amber-600"
          aria-hidden="true"
        />
        <span>{AI_SUPPORT_NOTE}</span>
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2 pl-[23px]">
        <a
          href={SUPPORT_TEL}
          aria-label={`Call AquaKart support on ${SUPPORT_PHONE_DISPLAY}`}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-slate-950 px-3.5 text-xs font-black text-white no-underline transition hover:bg-slate-800"
        >
          <Phone size={14} aria-hidden="true" />
          Call support
        </a>
        <a
          href={supportWhatsAppUrl(question)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 text-xs font-black text-white no-underline transition hover:bg-[#1ebe5a]"
        >
          <MessageCircle size={14} aria-hidden="true" />
          WhatsApp
        </a>
      </div>
    </aside>
  );
}
