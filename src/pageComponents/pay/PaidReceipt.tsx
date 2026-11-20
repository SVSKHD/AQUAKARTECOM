import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Copy,
  FileText,
  MessageCircle,
  Package,
  Phone,
  Printer,
  ReceiptText,
  Sparkles,
  Truck,
} from "lucide-react";
import logo from "@/assests/logo.png";
import type { OfflineStatus, OfflineSummary } from "@/services/offlinePayment";
import { SUPPORT_TEL, supportWhatsAppMessageUrl } from "@/utils/support";
import InvoiceDrawer, {
  DownloadButton,
  useInvoice,
  usePurchases,
  type DrawerTab,
  type PurchasesState,
} from "./InvoiceDrawer";
import { CardWaves, displayName, useRollUp } from "./OfflinePayPage";
import { money } from "./payHelpers";
import type { ProductInfo } from "./productInfo";
import { timeAgo, useRecentChats, type AiChatSummary } from "./recentChats";
import pay from "./pay.module.css";
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
const PIECES = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * Math.PI * 2 + (i % 2 ? 0.12 : -0.08);
  const reach = 70 + (i % 5) * 20;
  return {
    "--dx": `${Math.round(Math.cos(angle) * reach)}px`,
    "--dy": `${Math.round(Math.sin(angle) * reach - 24)}px`,
    "--rot": `${(i * 47) % 360}deg`,
    "--c": COLORS[i % COLORS.length],
    "--delay": `${(i % 4) * 40}ms`,
  } as CSSProperties;
});

// "PAID · AQUAKART ·" twice round the logo, one glyph per step.
const RING = Array.from("PAID • AQUAKART • PAID • AQUAKART • ");
const RING_STEP = 360 / RING.length;

// The drawer opens by itself once, after the celebration settles.
const AUTO_OPEN_MS = 1600;
const shownKey = (id: string) => `aq-pay-invoice-shown:${id}`;

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

const delay = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

function Fact({
  label,
  value,
  pending,
}: {
  label: string;
  value: string;
  pending?: string;
}) {
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
        {pending ? (
          <span className={styles.pending}>{pending}</span>
        ) : (
          <>
            <span className={styles.factValue} title={value}>
              {value}
            </span>
            <button
              type="button"
              className={`${styles.copy} ${copied ? styles.copied : ""}`}
              onClick={copy}
              aria-label={copied ? `${label} copied` : `Copy ${label}`}
            >
              {copied ? (
                <Check aria-hidden="true" />
              ) : (
                <Copy aria-hidden="true" />
              )}
            </button>
          </>
        )}
      </dd>
    </div>
  );
}

type Step = { title: string; note: string; state: "done" | "active" | "next" };

// Three steps across: compact enough to leave the page on one screen.
function Stepper({ steps }: { steps: Step[] }) {
  const icons = [Check, ReceiptText, Truck];
  return (
    <ol
      className={styles.steps}
      aria-label="What happens next"
      style={delay(0.55)}
    >
      {steps.map((s, i) => {
        const Icon = icons[i];
        return (
          <li
            key={s.title}
            className={`${styles.step} ${styles[s.state]}`}
            style={{ "--i": i } as CSSProperties}
            aria-current={s.state === "active" ? "step" : undefined}
          >
            <span className={styles.dot}>
              {s.state === "active" ? (
                <span className={styles.dotSpin} aria-hidden="true" />
              ) : (
                <Icon aria-hidden="true" />
              )}
            </span>
            <strong>{s.title}</strong>
            <span>{s.note}</span>
          </li>
        );
      })}
    </ol>
  );
}

// The Aquakart logo pressed inside a round "PAID" stamp, with a check badge.
function PaidStamp() {
  return (
    <>
      <svg viewBox="0 0 120 120" className={styles.ring} aria-hidden="true">
        <circle className={styles.ringOuter} cx="60" cy="60" r="57" />
        <circle className={styles.ringInner} cx="60" cy="60" r="41" />
        <g className={styles.ringText}>
          {RING.map((c, i) => (
            <text
              key={i}
              x="60"
              y="15.5"
              textAnchor="middle"
              transform={`rotate(${i * RING_STEP} 60 60)`}
            >
              {c}
            </text>
          ))}
        </g>
      </svg>
      <span className={styles.logoDisc} aria-hidden="true">
        <img src={logo.src} alt="" width={44} height={44} />
      </span>
      <svg viewBox="0 0 26 26" className={styles.badgeCheck} aria-hidden="true">
        <path className={styles.checkMark} d="M7.5 13.5l3.6 3.6 7.4-8" />
      </svg>
    </>
  );
}

function SideRow({
  icon,
  title,
  meta,
  tag,
  amount,
  onClick,
}: {
  icon: "chat" | "order";
  title: string;
  meta: string;
  tag?: string;
  amount?: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button type="button" className={styles.row} onClick={onClick}>
        <span
          className={`${styles.rowIcon} ${icon === "chat" ? styles.rowChat : ""}`}
        >
          {icon === "chat" ? (
            <MessageCircle aria-hidden="true" />
          ) : (
            <FileText aria-hidden="true" />
          )}
        </span>
        <span className={styles.rowText}>
          <strong>{title}</strong>
          <span>
            {tag && <em className={styles.rowTag}>{tag}</em>}
            {meta}
          </span>
        </span>
        {amount && <span className={styles.rowAmt}>{amount}</span>}
        <ChevronRight aria-hidden="true" className={styles.rowGo} />
      </button>
    </li>
  );
}

// Beside the receipt, like checkout's summary column: the customer's recent
// Aqua chats and orders, each opening in the drawer.
function SideColumn({
  chats,
  purchases,
  currentId,
  onChat,
  onAllChats,
  onOrder,
  onAllOrders,
}: {
  chats: AiChatSummary[] | null;
  purchases: PurchasesState;
  currentId: string | null;
  onChat: (id: string) => void;
  onAllChats: () => void;
  onOrder: (id: string) => void;
  onAllOrders: () => void;
}) {
  const recentChats = chats?.slice(0, 4) ?? [];
  const orders = purchases.list?.slice(0, 3) ?? [];
  return (
    <aside className={styles.side} aria-label="Your recent activity">
      <section className={styles.sideCard} style={delay(0.5)}>
        <header className={styles.sideHead}>
          <h2>
            <Sparkles aria-hidden="true" />
            Recent chats
          </h2>
          {recentChats.length > 0 && (
            <button
              type="button"
              className={styles.sideLink}
              onClick={onAllChats}
            >
              See all
            </button>
          )}
        </header>
        {chats === null ? (
          <div className={styles.sideSkel} aria-hidden="true">
            <span />
            <span />
          </div>
        ) : recentChats.length ? (
          <ul className={styles.rows} aria-label="Recent chats">
            {recentChats.map((c) => (
              <SideRow
                key={c.id}
                icon="chat"
                title={c.title}
                meta={timeAgo(c.lastMessageAt) || "Saved chat"}
                onClick={() => onChat(c.id)}
              />
            ))}
          </ul>
        ) : (
          <p className={styles.sideEmpty}>
            Questions about installation, filters or servicing? Ask Aqua: your
            chats are saved here.
          </p>
        )}
        <Link href="/" className={styles.askAqua}>
          <MessageCircle aria-hidden="true" />
          Ask Aqua about this order
        </Link>
      </section>

      <section className={styles.sideCard} style={delay(0.6)}>
        <header className={styles.sideHead}>
          <h2>
            <Package aria-hidden="true" />
            Recent orders
          </h2>
          {orders.length > 0 && (
            <button
              type="button"
              className={styles.sideLink}
              onClick={onAllOrders}
            >
              See all
            </button>
          )}
        </header>
        {purchases.list === null && !purchases.failed ? (
          <div className={styles.sideSkel} aria-hidden="true">
            <span />
            <span />
          </div>
        ) : orders.length ? (
          <ul className={styles.rows} aria-label="Recent orders">
            {orders.map((p) => (
              <SideRow
                key={p.id}
                icon="order"
                title={
                  p.items.length
                    ? `${displayName(p.items[0])}${p.itemCount > 1 ? ` + ${p.itemCount - 1}` : ""}`
                    : `Invoice ${p.invoiceNo}`
                }
                tag={p.id === currentId ? "This order" : undefined}
                meta={p.invoiceNo}
                amount={money(p.total_price)}
                onClick={() => onOrder(p.id)}
              />
            ))}
          </ul>
        ) : (
          <p className={styles.sideEmpty}>
            {purchases.failed
              ? "Your orders couldn't be loaded just now."
              : "This order appears here as soon as its invoice is issued."}
          </p>
        )}
      </section>
    </aside>
  );
}

export default function PaidReceipt({
  status,
  summary,
  products,
  firstName,
  invoiceReady,
  gaveUp,
  invoiceId,
  sessionToken,
}: {
  status: OfflineStatus;
  summary: OfflineSummary | null;
  products: (ProductInfo | null)[];
  firstName: string;
  invoiceReady: boolean;
  gaveUp: boolean;
  invoiceId: string | null;
  sessionToken: string;
}) {
  const amount = status.amountPaid || status.amount || summary?.total || 0;
  const rolled = useRollUp(amount, 1100);
  const [burst, setBurst] = useState(0);
  const [drawer, setDrawer] = useState<{ open: boolean; tab: DrawerTab }>({
    open: false,
    tab: "invoice",
  });
  const [opens, setOpens] = useState(0);
  // Another purchase, or a saved chat, opened in the drawer.
  const [picked, setPicked] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const chats = useRecentChats(sessionToken);
  const when = paidWhen(status.paidAt);
  const reference = status.reference || summary?.reference || "";
  const lines = summary?.lines ?? [];
  const invoiceNumber = (invoiceReady && status.invoiceNumber) || "";

  // Purchases on the account: listed in the drawer, and how this order's
  // invoice is found when the status doesn't carry its id.
  const purchases = usePurchases(sessionToken, `${invoiceNumber}|${opens}`);
  const currentId =
    invoiceId ||
    (invoiceNumber &&
      purchases.list?.find((p) => p.invoiceNo === invoiceNumber)?.id) ||
    null;
  // Fetched the moment it's known, so View and Download are instant.
  const invoice = useInvoice(currentId);

  const openDrawer = useCallback(
    (
      tab: DrawerTab,
      open: { order?: string | null; chat?: string | null } = {},
    ) => {
      setPicked(open.order ?? null);
      setChatId(open.chat ?? null);
      setDrawer({ open: true, tab });
      setOpens((n) => n + 1);
    },
    [],
  );
  const closeDrawer = useCallback(
    () => setDrawer((d) => ({ ...d, open: false })),
    [],
  );
  const setTab = useCallback(
    (tab: DrawerTab) => setDrawer((d) => ({ ...d, tab })),
    [],
  );

  // Show the invoice once it's found, a single time per invoice.
  useEffect(() => {
    if (!currentId) return;
    try {
      if (window.sessionStorage.getItem(shownKey(currentId))) return;
    } catch {
      // Storage blocked: open it anyway.
    }
    const t = setTimeout(() => {
      setDrawer({ open: true, tab: "invoice" });
      try {
        window.sessionStorage.setItem(shownKey(currentId), "1");
      } catch {
        // Ignored: at worst it opens again after a reload.
      }
    }, AUTO_OPEN_MS);
    return () => clearTimeout(t);
  }, [currentId]);

  const steps: Step[] = [
    { title: "Payment confirmed", note: "Paid via PhonePe", state: "done" },
    invoiceReady
      ? { title: "Invoice ready", note: invoiceNumber, state: "done" }
      : {
          title: "Invoice",
          note: gaveUp ? "On its way" : "Being prepared",
          state: gaveUp ? "next" : "active",
        },
    {
      title: "Delivery & installation",
      note: "We'll call you",
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

  const first = lines[0];
  const firstProduct = products[0] ?? null;
  const thumbs = lines.slice(0, 3).map((l, i) => ({
    key: `${l.name}-${i}`,
    src: l.imageUrl || products[i]?.photos[0] || "",
  }));
  const units = lines.reduce((n, l) => n + (l.quantity || 0), 0);

  return (
    <div className={styles.layout}>
      <div className={`${pay.card} ${styles.main}`}>
        <CardWaves />
        <div className={styles.wrap}>
          <section className={styles.hero} aria-labelledby="paid-title">
            <button
              type="button"
              className={styles.seal}
              onClick={() => setBurst((n) => n + 1)}
              aria-label="Celebrate again"
            >
              <span className={styles.ripple} aria-hidden="true" />
              <PaidStamp />
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
            {when && <p className={styles.when}>{when}</p>}
          </section>

          <Stepper steps={steps} />

          <section
            className={styles.tile}
            aria-label="Order summary"
            style={delay(0.65)}
          >
            {first && (
              <div className={styles.strip}>
                <span className={styles.thumbs}>
                  {thumbs.map((t) => (
                    <span key={t.key} className={styles.thumb}>
                      {t.src ? (
                        <img src={t.src} alt="" loading="lazy" />
                      ) : (
                        <Package aria-hidden="true" />
                      )}
                    </span>
                  ))}
                </span>
                <span className={styles.stripText}>
                  <strong>
                    {displayName(firstProduct?.title || first.name)}
                  </strong>
                  <span>
                    {lines.length > 1
                      ? `+ ${lines.length - 1} more`
                      : firstProduct?.brand ||
                        first.description ||
                        "Your order"}
                  </span>
                </span>
                <span className={styles.qty}>
                  {lines.length === 1
                    ? `× ${first.quantity}`
                    : `${units} ${units === 1 ? "unit" : "units"}`}
                </span>
              </div>
            )}
            <dl className={styles.facts}>
              {reference && <Fact label="Reference" value={reference} />}
              {status.transactionId && (
                <Fact label="Payment ID" value={status.transactionId} />
              )}
              <Fact
                label="Invoice"
                value={invoiceNumber}
                pending={
                  invoiceNumber
                    ? undefined
                    : gaveUp
                      ? "On its way"
                      : "Being prepared…"
                }
              />
            </dl>
            {lines.length > 0 && (
              <span className={styles.count}>
                {lines.length} {lines.length === 1 ? "item" : "items"}
              </span>
            )}
          </section>

          {/* Both, always, without leaving the page. */}
          <div className={styles.actions} style={delay(0.75)}>
            <button
              type="button"
              className={`${styles.btn} ${styles.primary}`}
              onClick={() => openDrawer("invoice")}
            >
              <FileText aria-hidden="true" />
              View invoice
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.ghost}`}
              onClick={() => openDrawer("purchases")}
            >
              <Package aria-hidden="true" />
              View purchases
            </button>
          </div>

          <div className={styles.extras} style={delay(0.85)}>
            {currentId && (
              <DownloadButton invoice={invoice} className={styles.chip} />
            )}
            <button
              type="button"
              className={styles.chip}
              onClick={() => window.print()}
            >
              <Printer aria-hidden="true" />
              Print receipt
            </button>
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.chip}
            >
              <MessageCircle aria-hidden="true" />
              WhatsApp us
            </a>
            <a href={SUPPORT_TEL} className={styles.chip}>
              <Phone aria-hidden="true" />
              Call
            </a>
          </div>

          <p className={styles.srOnly} role="status">
            {invoiceReady
              ? `Invoice ${invoiceNumber} is ready.`
              : gaveUp
                ? "Your invoice will appear in your purchases as soon as it's ready."
                : "Preparing your invoice. It will appear here shortly."}
          </p>
        </div>
      </div>

      <SideColumn
        chats={chats}
        purchases={purchases}
        currentId={currentId}
        onChat={(id) => openDrawer("chats", { chat: id })}
        onAllChats={() => openDrawer("chats")}
        onOrder={(id) =>
          openDrawer("invoice", { order: id === currentId ? null : id })
        }
        onAllOrders={() => openDrawer("purchases")}
      />

      <InvoiceDrawer
        open={drawer.open}
        onClose={closeDrawer}
        tab={drawer.tab}
        onTab={setTab}
        invoiceNumber={invoiceNumber}
        currentId={currentId}
        current={invoice}
        receipt={{ status, summary, products, amount, gaveUp }}
        purchases={purchases}
        picked={picked}
        onPick={setPicked}
        chats={chats}
        chatId={chatId}
        onChat={setChatId}
        token={sessionToken}
      />
    </div>
  );
}
