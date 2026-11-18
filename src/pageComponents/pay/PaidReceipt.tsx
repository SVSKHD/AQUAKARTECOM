import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Copy,
  FileText,
  MessageCircle,
  Package,
  Phone,
  Printer,
  ReceiptText,
  Truck,
} from "lucide-react";
import type { OfflineStatus, OfflineSummary } from "@/services/offlinePayment";
import { SUPPORT_TEL, supportWhatsAppMessageUrl } from "@/utils/support";
import { displayName, useRollUp } from "./OfflinePayPage";
import { money } from "./payHelpers";
import type { ProductInfo } from "./productInfo";
import styles from "./success.module.css";

// Confetti pieces, spread evenly round the check (no randomness, so the
// burst is the same on every render and in tests).
const COLORS = [
  "#10bfa4",
  "#1565c0",
  "#f5b301",
  "#34d399",
  "#7c3aed",
  "#ef6c57",
];
const PIECES = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * Math.PI * 2 + (i % 2 ? 0.12 : -0.08);
  const reach = 90 + (i % 5) * 26;
  return {
    "--dx": `${Math.round(Math.cos(angle) * reach)}px`,
    "--dy": `${Math.round(Math.sin(angle) * reach - 30)}px`,
    "--rot": `${(i * 47) % 360}deg`,
    "--c": COLORS[i % COLORS.length],
    "--delay": `${(i % 4) * 40}ms`,
  } as CSSProperties;
});

const paidWhen = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      });
};

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked: the value is still on screen to select.
    }
  };
  return (
    <div className={styles.fact}>
      <dt>{label}</dt>
      <dd>
        <span className={styles.factValue}>{value}</span>
        <button
          type="button"
          className={`${styles.copy} ${copied ? styles.copied : ""}`}
          onClick={copy}
          aria-label={copied ? `${label} copied` : `Copy ${label}`}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          <span aria-hidden="true">{copied ? "Copied" : "Copy"}</span>
        </button>
      </dd>
    </div>
  );
}

type Step = { title: string; note: string; state: "done" | "active" | "next" };

function Timeline({ steps }: { steps: Step[] }) {
  const icons = [Check, ReceiptText, Truck];
  return (
    <ol className={styles.timeline} aria-label="What happens next">
      {steps.map((s, i) => {
        const Icon = icons[i];
        return (
          <li
            key={s.title}
            className={`${styles.tStep} ${styles[s.state]}`}
            style={{ "--i": i } as CSSProperties}
            aria-current={s.state === "active" ? "step" : undefined}
          >
            <span className={styles.tDot}>
              {s.state === "active" ? (
                <span className={styles.tSpin} aria-hidden="true" />
              ) : (
                <Icon aria-hidden="true" />
              )}
            </span>
            <span className={styles.tText}>
              <strong>{s.title}</strong>
              <span>{s.note}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function PaidReceipt({
  status,
  summary,
  products,
  firstName,
  invoiceReady,
  gaveUp,
  invoiceHref,
}: {
  status: OfflineStatus;
  summary: OfflineSummary | null;
  products: (ProductInfo | null)[];
  firstName: string;
  invoiceReady: boolean;
  gaveUp: boolean;
  invoiceHref: string | null;
}) {
  const amount = status.amountPaid || status.amount || summary?.total || 0;
  const rolled = useRollUp(amount, 1100);
  const [burst, setBurst] = useState(0);
  const [itemsOpen, setItemsOpen] = useState(true);
  const when = paidWhen(status.paidAt);
  const reference = status.reference || summary?.reference || "";
  const lines = summary?.lines ?? [];

  const steps: Step[] = [
    {
      title: "Payment confirmed",
      note: when ? `Paid via PhonePe · ${when}` : "Paid via PhonePe",
      state: "done",
    },
    invoiceReady
      ? {
          title: "Invoice ready",
          note: `Invoice ${status.invoiceNumber}`,
          state: "done",
        }
      : {
          title: "Invoice",
          note: gaveUp
            ? "It will appear in My purchases as soon as it's ready"
            : "Being prepared, usually within a minute",
          state: gaveUp ? "next" : "active",
        },
    {
      title: "Delivery & installation",
      note: "Our team will call you to schedule a visit",
      state: invoiceReady ? "active" : "next",
    },
  ];

  const whatsapp = supportWhatsAppMessageUrl(
    [
      "Hi Aquakart, I've just paid for my order.",
      reference && `Reference: ${reference}`,
      status.transactionId && `Payment ID: ${status.transactionId}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return (
    <div className={styles.wrap}>
      <section className={styles.hero} aria-labelledby="paid-title">
        <button
          type="button"
          className={styles.seal}
          onClick={() => setBurst((n) => n + 1)}
          aria-label="Celebrate again"
        >
          <span className={styles.ripple} aria-hidden="true" />
          <span
            className={`${styles.ripple} ${styles.ripple2}`}
            aria-hidden="true"
          />
          <svg
            viewBox="0 0 52 52"
            className={styles.checkSvg}
            aria-hidden="true"
          >
            <circle className={styles.checkCircle} cx="26" cy="26" r="24" />
            <path className={styles.checkMark} d="M15 27.5l7 7 15-16" />
          </svg>
          <span key={burst} className={styles.confetti} aria-hidden="true">
            {PIECES.map((style, i) => (
              <i key={i} style={style} />
            ))}
          </span>
        </button>

        <p className={styles.eyebrow}>Payment successful</p>
        <h1 id="paid-title" className={styles.title}>
          {firstName ? `Thank you, ${firstName}!` : "Payment received"}
        </h1>
        <p className={styles.amount}>
          <span aria-hidden="true">{money(rolled)}</span>
          <span className={styles.srOnly}>{money(amount)} paid</span>
        </p>
        <div className={styles.chips}>
          {reference && (
            <span className={styles.chip}>
              <FileText aria-hidden="true" />
              Ref. {reference}
            </span>
          )}
          {when && <span className={styles.chip}>{when}</span>}
        </div>
      </section>

      <section className={styles.card} aria-labelledby="paid-next">
        <h2 id="paid-next" className={styles.cardTitle}>
          What happens next
        </h2>
        <Timeline steps={steps} />
        <p className={styles.srOnly} role="status">
          {invoiceReady
            ? `Invoice ${status.invoiceNumber} is ready.`
            : gaveUp
              ? "Your invoice will appear in My purchases as soon as it's ready."
              : "Your invoice is being prepared. It will appear here shortly."}
        </p>
      </section>

      {lines.length > 0 && (
        <section className={styles.card}>
          <button
            type="button"
            className={styles.cardToggle}
            aria-expanded={itemsOpen}
            aria-controls="paid-items"
            onClick={() => setItemsOpen((o) => !o)}
          >
            <span className={styles.cardTitle}>
              <Package aria-hidden="true" />
              Your order · {lines.length}{" "}
              {lines.length === 1 ? "item" : "items"}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`${styles.chev} ${itemsOpen ? styles.chevOpen : ""}`}
            />
          </button>
          <div
            id="paid-items"
            className={`${styles.collapse} ${itemsOpen ? styles.open : ""}`}
          >
            <ul className={styles.items}>
              {lines.map((l, i) => {
                const p = products[i] ?? null;
                const photo = l.imageUrl || p?.photos[0] || "";
                const name = displayName(p?.title || l.name);
                const body = (
                  <>
                    <span className={styles.thumb}>
                      {photo ? (
                        <img src={photo} alt="" loading="lazy" />
                      ) : (
                        <Package aria-hidden="true" />
                      )}
                    </span>
                    <span className={styles.itemText}>
                      <strong>{name}</strong>
                      {(p?.brand || l.description) && (
                        <span>{p?.brand || l.description}</span>
                      )}
                    </span>
                    <span className={styles.qty}>× {l.quantity}</span>
                  </>
                );
                return (
                  <li
                    key={`${l.name}-${i}`}
                    style={{ "--i": i } as CSSProperties}
                  >
                    {p?.href ? (
                      <a
                        href={p.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.item}
                      >
                        {body}
                      </a>
                    ) : (
                      <div className={styles.item}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      <section className={styles.card} aria-labelledby="paid-receipt">
        <h2 id="paid-receipt" className={styles.cardTitle}>
          <ReceiptText aria-hidden="true" />
          Receipt
        </h2>
        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt>Amount paid</dt>
            <dd>
              <span className={styles.factValue}>{money(amount)}</span>
            </dd>
          </div>
          {reference && <CopyValue label="Reference" value={reference} />}
          {invoiceReady && status.invoiceNumber ? (
            <CopyValue label="Invoice" value={status.invoiceNumber} />
          ) : (
            <div className={styles.fact}>
              <dt>Invoice</dt>
              <dd>
                <span className={styles.pending}>
                  {gaveUp ? "On its way" : "Being prepared…"}
                </span>
              </dd>
            </div>
          )}
          {status.transactionId && (
            <CopyValue label="Payment ID" value={status.transactionId} />
          )}
        </dl>
      </section>

      <div className={styles.actions}>
        {invoiceHref && (
          <Link
            href={invoiceHref}
            className={`${styles.btn} ${styles.primary}`}
          >
            <ReceiptText aria-hidden="true" />
            Download invoice
          </Link>
        )}
        <Link
          href="/invoices"
          className={`${styles.btn} ${invoiceHref ? styles.ghost : styles.primary}`}
        >
          <Package aria-hidden="true" />
          View my purchases
        </Link>
        <button
          type="button"
          className={`${styles.btn} ${styles.ghost}`}
          onClick={() => window.print()}
        >
          <Printer aria-hidden="true" />
          Print receipt
        </button>
      </div>

      <div className={styles.help}>
        <span>Need help with this order?</span>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.helpLink}
        >
          <MessageCircle aria-hidden="true" />
          WhatsApp us
        </a>
        <a href={SUPPORT_TEL} className={styles.helpLink}>
          <Phone aria-hidden="true" />
          Call
        </a>
      </div>
    </div>
  );
}
