import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Download,
  FileText,
  MessageCircle,
  Package,
  RotateCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assests/logo.png";
import { getFirebaseAuth } from "@/lib/firebase/client";
import InvoiceServiceOperations, { getMyInvoices } from "@/services/invoice";
import type { OfflineStatus, OfflineSummary } from "@/services/offlinePayment";
import { getDocumentKind, isPaidStatus } from "@/utils/invoice/documentKind";
import { mapInvoiceFromApi } from "@/utils/invoice/normalizeInvoice";
import {
  closePdfDownloadTarget,
  preparePdfDownloadTarget,
} from "@/utils/pdfDownload";
import priceUtils from "@/utils/priceUtils";
import { displayName } from "./OfflinePayPage";
import { money } from "./payHelpers";
import type { ProductInfo } from "./productInfo";
import {
  plainText,
  timeAgo,
  useSavedChat,
  type AiChatSummary,
} from "./recentChats";
import styles from "./invoiceDrawer.module.css";

type InvoiceLine = {
  id: string;
  productName: string;
  productQuantity: number;
  productPrice: number;
  productImage?: string;
};

export type DrawerInvoice = {
  id: string;
  invoice_no: string;
  date: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  gst: boolean;
  gst_name: string | null;
  gst_no: string | null;
  paid_status: string;
  payment_type: string;
  products: InvoiceLine[];
  [key: string]: unknown;
};

// One invoice on the customer's account (GET /invoices/public/mine).
export type Purchase = {
  id: string;
  invoiceNo: string;
  date?: string;
  paidStatus?: string;
  itemCount: number;
  total_price: number;
  items: string[];
};

type Load =
  | { state: "loading" }
  | { state: "ready"; invoice: DrawerInvoice }
  | { state: "failed" };

const statusOf = (e: unknown) =>
  (e as { response?: { status?: number } })?.response?.status || 0;

const fetchInvoice = async (id: string, signal: AbortSignal) =>
  mapInvoiceFromApi(
    await InvoiceServiceOperations.getInvoiceById(id, signal),
  ) as DrawerInvoice | null;

// The customer is signed in with Google on /pay, but the invoice gateway keeps
// its own access cookie. On 401/403 trade the Firebase ID token for it once.
async function loadInvoice(id: string, signal: AbortSignal) {
  try {
    return await fetchInvoice(id, signal);
  } catch (e) {
    const code = statusOf(e);
    if (code !== 401 && code !== 403) throw e;
    const fb = getFirebaseAuth();
    await fb.authStateReady?.();
    const idToken = await fb.currentUser?.getIdToken();
    if (!idToken || signal.aborted) throw e;
    await InvoiceServiceOperations.loginDirectInvoiceAccess(id, idToken);
    return await fetchInvoice(id, signal);
  }
}

const dateText = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

function Skeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <span style={{ width: "46%" }} />
      <span style={{ width: "30%" }} />
      <span className={styles.skBlock} />
      <span style={{ width: "70%" }} />
      <span style={{ width: "55%" }} />
      <span className={styles.skBlock} />
      <span style={{ width: "40%", marginLeft: "auto" }} />
    </div>
  );
}

function PaperHead({ title, paid }: { title: string; paid: boolean }) {
  return (
    <header className={styles.paperHead}>
      <span className={styles.paperBrand}>
        <img src={logo.src} alt="" width={34} height={34} />
        <span>
          <strong>Aquakart</strong>
          <small>{title}</small>
        </span>
      </span>
      {paid && <span className={styles.stamp}>Paid</span>}
    </header>
  );
}

function InvoicePreview({ invoice }: { invoice: DrawerInvoice }) {
  const kind = getDocumentKind(invoice);
  const paid = isPaidStatus(invoice.paid_status);
  const amounts = priceUtils.getInvoiceAmounts(invoice);
  const issued = dateText(invoice.date);
  const billedTo = invoice.gst_name || invoice.customer_name;
  return (
    <article className={styles.paper} aria-label={`${kind.name} preview`}>
      <PaperHead title={kind.title} paid={paid} />

      <dl className={styles.meta}>
        <div>
          <dt>{kind.name} no.</dt>
          <dd>{invoice.invoice_no || "-"}</dd>
        </div>
        {issued && (
          <div>
            <dt>Date</dt>
            <dd>{issued}</dd>
          </div>
        )}
        <div>
          <dt>Status</dt>
          <dd>{paid ? "Paid in full" : "Payment due"}</dd>
        </div>
      </dl>

      {(billedTo || invoice.customer_address) && (
        <section className={styles.party}>
          <h3>Billed to</h3>
          {billedTo && <strong>{billedTo}</strong>}
          {invoice.gst_no && <span>GSTIN {invoice.gst_no}</span>}
          {invoice.customer_phone && <span>{invoice.customer_phone}</span>}
          {invoice.customer_address && <span>{invoice.customer_address}</span>}
        </section>
      )}

      <section>
        <h3 className={styles.secTitle}>Items</h3>
        <ul className={styles.lines}>
          {invoice.products.map((p, i) => {
            const line = priceUtils.getLineAmounts(p);
            return (
              <li key={`${p.id}-${i}`}>
                <span className={styles.lineThumb}>
                  {p.productImage ? (
                    <img src={p.productImage} alt="" loading="lazy" />
                  ) : (
                    <Package aria-hidden="true" />
                  )}
                </span>
                <span className={styles.lineText}>
                  <strong>{displayName(p.productName)}</strong>
                  <span>
                    {p.productQuantity} × {money(p.productPrice)}
                  </span>
                </span>
                <span className={styles.lineAmt}>
                  {line.hasDiscount && <s>{money(line.originalTotal)}</s>}
                  {money(line.offerTotal)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <dl className={styles.totals}>
        {amounts.hasDiscount && (
          <>
            <div>
              <dt>Items total</dt>
              <dd>{money(amounts.originalTotal)}</dd>
            </div>
            <div className={styles.saving}>
              <dt>Discount</dt>
              <dd>− {money(amounts.discountTotal)}</dd>
            </div>
          </>
        )}
        <div>
          <dt>Taxable value</dt>
          <dd>{money(amounts.basePrice)}</dd>
        </div>
        {invoice.gst ? (
          <>
            <div>
              <dt>CGST 9%</dt>
              <dd>{money(amounts.cgstValue)}</dd>
            </div>
            <div>
              <dt>SGST 9%</dt>
              <dd>{money(amounts.sgstValue)}</dd>
            </div>
          </>
        ) : (
          <div>
            <dt>GST 18% (included)</dt>
            <dd>{money(amounts.gstValue)}</dd>
          </div>
        )}
        <div className={styles.grand}>
          <dt>{paid ? "Amount paid" : "Total"}</dt>
          <dd>{money(amounts.grandTotal)}</dd>
        </div>
      </dl>
    </article>
  );
}

export type ReceiptData = {
  status: OfflineStatus;
  summary: OfflineSummary | null;
  products: (ProductInfo | null)[];
  amount: number;
  gaveUp: boolean;
};

// Until the tax invoice exists: the payment itself, as a receipt. Swapped for
// the invoice the moment it's found.
function ReceiptPreview({ data }: { data: ReceiptData }) {
  const { status, summary, products, amount, gaveUp } = data;
  const reference = status.reference || summary?.reference || "";
  const paidOn = dateText(status.paidAt);
  const lines = summary?.lines ?? [];
  return (
    <article className={styles.paper} aria-label="Payment receipt">
      <PaperHead title="Payment receipt" paid />
      <p className={styles.notice} role="status">
        {!gaveUp && <span className={styles.spin} aria-hidden="true" />}
        {gaveUp
          ? "Your tax invoice is taking a little longer. It will appear here and in your purchases."
          : "Preparing your tax invoice. It replaces this receipt automatically."}
      </p>
      <dl className={styles.meta}>
        {reference && (
          <div>
            <dt>Reference</dt>
            <dd>{reference}</dd>
          </div>
        )}
        {paidOn && (
          <div>
            <dt>Paid on</dt>
            <dd>{paidOn}</dd>
          </div>
        )}
        {status.transactionId && (
          <div>
            <dt>Payment ID</dt>
            <dd>{status.transactionId}</dd>
          </div>
        )}
      </dl>
      {lines.length > 0 && (
        <section>
          <h3 className={styles.secTitle}>Items</h3>
          <ul className={styles.lines}>
            {lines.map((l, i) => {
              const p = products[i] ?? null;
              const photo = l.imageUrl || p?.photos[0] || "";
              return (
                <li key={`${l.name}-${i}`}>
                  <span className={styles.lineThumb}>
                    {photo ? (
                      <img src={photo} alt="" loading="lazy" />
                    ) : (
                      <Package aria-hidden="true" />
                    )}
                  </span>
                  <span className={styles.lineText}>
                    <strong>{displayName(p?.title || l.name)}</strong>
                    {(p?.brand || l.description) && (
                      <span>{p?.brand || l.description}</span>
                    )}
                  </span>
                  <span className={styles.lineAmt}>× {l.quantity}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <dl className={styles.totals}>
        <div className={styles.grand}>
          <dt>Amount paid</dt>
          <dd>{money(amount)}</dd>
        </div>
      </dl>
    </article>
  );
}

export type InvoiceHandle = {
  load: Load;
  retry: () => void;
  downloading: boolean;
  download: () => void;
};

// An invoice, fetched as soon as its id is known (so View and Download are
// instant), plus its PDF download.
export function useInvoice(invoiceId: string | null): InvoiceHandle {
  const [result, setResult] = useState<{ key: string; load: Load } | null>(
    null,
  );
  const [attempt, setAttempt] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const loadKey = invoiceId ? `${invoiceId}|${attempt}` : "";
  const load: Load =
    result && result.key === loadKey ? result.load : { state: "loading" };
  useEffect(() => {
    if (!loadKey || !invoiceId) return;
    const ctl = new AbortController();
    loadInvoice(invoiceId, ctl.signal).then(
      (invoice) => {
        if (ctl.signal.aborted) return;
        setResult({
          key: loadKey,
          load: invoice ? { state: "ready", invoice } : { state: "failed" },
        });
      },
      () => {
        if (!ctl.signal.aborted)
          setResult({ key: loadKey, load: { state: "failed" } });
      },
    );
    return () => ctl.abort();
  }, [loadKey, invoiceId]);

  const download = async () => {
    if (downloading || load.state !== "ready") return;
    // Opened inside the tap so iOS keeps the download (see InvoicePage).
    const target = preparePdfDownloadTarget();
    setDownloading(true);
    try {
      const { downloadPublicInvoicePdf } =
        await import("@/utils/invoice/generatePublicInvoicePdf");
      const res = await downloadPublicInvoicePdf(load.invoice, {
        preparedTarget: target,
      });
      toast.success(
        res?.mode === "viewer"
          ? "Invoice opened - use Share/Save to keep it"
          : "Invoice downloaded",
      );
    } catch (error) {
      closePdfDownloadTarget(target);
      console.error("Invoice PDF download failed", error);
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return {
    load,
    retry: () => setAttempt((n) => n + 1),
    downloading,
    download: () => void download(),
  };
}

export type PurchasesState = { list: Purchase[] | null; failed: boolean };

// The customer's purchases, newest first. Reloaded whenever `refresh` changes
// (the invoice turning up, the drawer opening).
export function usePurchases(token: string, refresh: string): PurchasesState {
  const [state, setState] = useState<{
    list: Purchase[] | null;
    failed: boolean;
  } | null>(null);
  const key = token ? `${token}|${refresh}` : "";
  useEffect(() => {
    if (!key) return;
    let alive = true;
    getMyInvoices(token).then(
      (list: Purchase[]) => {
        if (alive) setState({ list, failed: false });
      },
      () => {
        if (alive)
          setState((prev) => ({ list: prev?.list ?? null, failed: true }));
      },
    );
    return () => {
      alive = false;
    };
  }, [key, token]);
  // The last list stays on screen while it refreshes.
  return { list: state?.list ?? null, failed: !!state?.failed };
}

export function DownloadButton({
  invoice,
  className,
  label = "Download PDF",
}: {
  invoice: InvoiceHandle;
  className: string;
  label?: string;
}) {
  const busy = invoice.downloading || invoice.load.state === "loading";
  return (
    <button
      type="button"
      className={className}
      onClick={invoice.download}
      disabled={invoice.load.state !== "ready" || invoice.downloading}
      aria-busy={busy}
    >
      {busy ? (
        <span className={styles.spin} aria-hidden="true" />
      ) : (
        <Download aria-hidden="true" />
      )}
      {invoice.downloading ? "Preparing PDF…" : label}
    </button>
  );
}

function PurchaseList({
  purchases,
  currentId,
  onPick,
}: {
  purchases: PurchasesState;
  currentId: string | null;
  onPick: (id: string) => void;
}) {
  if (!purchases.list)
    return purchases.failed ? (
      <div className={styles.failed} role="alert">
        <AlertTriangle aria-hidden="true" />
        <strong>We couldn&apos;t load your purchases</strong>
        <p>Your payment is safe. Please try again in a moment.</p>
      </div>
    ) : (
      <div className={styles.skeleton} aria-hidden="true">
        <span className={styles.skBlock} />
        <span className={styles.skBlock} />
        <span className={styles.skBlock} />
      </div>
    );
  if (!purchases.list.length)
    return (
      <div className={styles.failed} role="status">
        <Package aria-hidden="true" />
        <strong>No purchases yet</strong>
        <p>This order will show up here as soon as its invoice is issued.</p>
      </div>
    );
  return (
    <ul className={styles.purchases} aria-label="Your purchases">
      {purchases.list.map((p, i) => {
        const title = p.items.length
          ? `${displayName(p.items[0])}${p.itemCount > 1 ? ` + ${p.itemCount - 1} more` : ""}`
          : `Invoice ${p.invoiceNo}`;
        const paid = isPaidStatus(p.paidStatus);
        const meta = [p.invoiceNo, dateText(p.date)].filter(Boolean);
        return (
          <li key={p.id} style={{ animationDelay: `${i * 40}ms` }}>
            <button
              type="button"
              className={`${styles.purchase} ${p.id === currentId ? styles.current : ""}`}
              onClick={() => onPick(p.id)}
            >
              <span className={styles.pIcon}>
                <FileText aria-hidden="true" />
              </span>
              <span className={styles.pText}>
                <strong>{title}</strong>
                <span>
                  {p.id === currentId && (
                    <em className={styles.thisOrder}>This order</em>
                  )}
                  {meta.join(" · ")}
                </span>
              </span>
              <span className={styles.pAmt}>
                {money(p.total_price)}
                {p.paidStatus && (
                  <small className={paid ? styles.pPaid : ""}>
                    {paid ? "Paid" : p.paidStatus}
                  </small>
                )}
              </span>
              <ChevronRight aria-hidden="true" className={styles.pGo} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ChatList({
  chats,
  onOpen,
}: {
  chats: AiChatSummary[] | null;
  onOpen: (id: string) => void;
}) {
  if (!chats)
    return (
      <div className={styles.skeleton} aria-hidden="true">
        <span className={styles.skBlock} />
        <span className={styles.skBlock} />
      </div>
    );
  if (!chats.length)
    return (
      <div className={styles.failed} role="status">
        <MessageCircle aria-hidden="true" />
        <strong>No saved chats yet</strong>
        <p>
          Ask Aqua about installation, filters or servicing. Your chats are
          saved here.
        </p>
      </div>
    );
  return (
    <ul className={styles.purchases} aria-label="Your chats">
      {chats.map((c, i) => (
        <li key={c.id} style={{ animationDelay: `${i * 40}ms` }}>
          <button
            type="button"
            className={styles.purchase}
            onClick={() => onOpen(c.id)}
          >
            <span className={`${styles.pIcon} ${styles.chatIcon}`}>
              <MessageCircle aria-hidden="true" />
            </span>
            <span className={styles.pText}>
              <strong>{c.title}</strong>
              <span>
                {[
                  c.messageCount > 0 &&
                    `${c.messageCount} ${c.messageCount === 1 ? "message" : "messages"}`,
                  timeAgo(c.lastMessageAt),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <ChevronRight aria-hidden="true" className={styles.pGo} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function ChatTranscript({ id, token }: { id: string; token: string }) {
  const load = useSavedChat(id, token);
  if (load.state === "loading")
    return (
      <>
        <Skeleton />
        <p className={styles.srOnly} role="status">
          Loading your chat…
        </p>
      </>
    );
  if (load.state === "failed")
    return (
      <div className={styles.failed} role="alert">
        <AlertTriangle aria-hidden="true" />
        <strong>We couldn&apos;t open this chat</strong>
        <p>It may have been deleted. You can still find it in Aqua.</p>
      </div>
    );
  return (
    <ol className={styles.chat} aria-label={`Chat: ${load.chat.title}`}>
      {load.chat.messages.map((m, i) => (
        <li
          key={i}
          className={m.role === "user" ? styles.me : styles.bot}
          style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
        >
          <span className={styles.srOnly}>
            {m.role === "user" ? "You: " : "Aqua: "}
          </span>
          {plainText(m.text)}
        </li>
      ))}
    </ol>
  );
}

export type DrawerTab = "invoice" | "purchases" | "chats";
const TABS: DrawerTab[] = ["invoice", "purchases", "chats"];

// Floating glass panel beside the page (a sheet on phones) with this order's
// invoice and every purchase on the account, so nothing needs another page.
export default function InvoiceDrawer({
  open,
  onClose,
  tab,
  onTab,
  invoiceNumber,
  currentId,
  current,
  receipt,
  purchases,
  picked,
  onPick,
  chats,
  chatId,
  onChat,
  token,
}: {
  open: boolean;
  onClose: () => void;
  tab: DrawerTab;
  onTab: (tab: DrawerTab) => void;
  invoiceNumber: string;
  /** This order's invoice id, once known (status or purchases). */
  currentId: string | null;
  current: InvoiceHandle;
  receipt: ReceiptData;
  purchases: PurchasesState;
  /** Another purchase opened from the list (null: this order). */
  picked: string | null;
  onPick: (id: string | null) => void;
  chats: AiChatSummary[] | null;
  /** The saved chat open in the Chats tab (null: the list). */
  chatId: string | null;
  onChat: (id: string | null) => void;
  token: string;
}) {
  // Mounted on first open, then kept so closing can animate.
  const [mounted, setMounted] = useState(false);
  if (open && !mounted) setMounted(true);
  const pickedId = picked && picked !== currentId ? picked : null;
  const other = useInvoice(pickedId);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Esc closes; focus moves in on open and back out on close; the page
  // behind doesn't scroll.
  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => closeRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, [open, onClose]);

  if (!(open || mounted) || typeof document === "undefined") return null;

  const shown = pickedId ? other : currentId ? current : null;
  const pickedNo =
    purchases.list?.find((p) => p.id === pickedId)?.invoiceNo || "";
  const count = purchases.list?.length;
  const chatTitle = chats?.find((c) => c.id === chatId)?.title || "Chat";
  const subtitle =
    tab === "chats"
      ? chatId
        ? chatTitle
        : chats
          ? `${chats.length} saved with Aqua`
          : "Saved with Aqua"
      : tab === "purchases"
        ? count === undefined
          ? "On your account"
          : `${count} on your account`
        : pickedId
          ? `Invoice ${pickedNo}`
          : invoiceNumber
            ? `Invoice ${invoiceNumber}`
            : "Payment receipt";

  return createPortal(
    <div
      className={`${styles.root} ${open ? styles.isOpen : ""}`}
      inert={!open}
      aria-hidden={!open}
    >
      <div className={styles.backdrop} onClick={onClose} />
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-drawer-title"
      >
        <span className={styles.grip} aria-hidden="true" />
        <header className={styles.head}>
          <span className={styles.headText}>
            <h2 id="invoice-drawer-title">
              {tab === "chats" ? "Your chats" : "Your invoice"}
            </h2>
            <span>{subtitle}</span>
          </span>
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close invoice"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={styles.tabs} role="tablist" aria-label="Show">
          <span
            className={styles.tabPill}
            style={{ "--tab": TABS.indexOf(tab) } as CSSProperties}
            aria-hidden="true"
          />
          <button
            type="button"
            role="tab"
            aria-selected={tab === "invoice"}
            className={styles.tab}
            onClick={() => onTab("invoice")}
          >
            <FileText aria-hidden="true" />
            Invoice
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "purchases"}
            className={styles.tab}
            onClick={() => onTab("purchases")}
          >
            <Package aria-hidden="true" />
            Purchases
            {count ? <span className={styles.badge}>{count}</span> : null}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "chats"}
            className={styles.tab}
            onClick={() => {
              onChat(null);
              onTab("chats");
            }}
          >
            <MessageCircle aria-hidden="true" />
            Chats
          </button>
        </div>

        <div
          className={styles.body}
          key={`${tab}|${pickedId || ""}|${chatId || ""}`}
        >
          {tab === "chats" ? (
            chatId ? (
              <>
                <button
                  type="button"
                  className={styles.back}
                  onClick={() => onChat(null)}
                >
                  <ArrowLeft aria-hidden="true" />
                  All chats
                </button>
                <ChatTranscript id={chatId} token={token} />
              </>
            ) : (
              <ChatList chats={chats} onOpen={onChat} />
            )
          ) : tab === "purchases" ? (
            <PurchaseList
              purchases={purchases}
              currentId={currentId}
              onPick={(id) => {
                onPick(id);
                onTab("invoice");
              }}
            />
          ) : (
            <>
              {pickedId && (
                <button
                  type="button"
                  className={styles.back}
                  onClick={() => onPick(null)}
                >
                  <ArrowLeft aria-hidden="true" />
                  Back to this order
                </button>
              )}
              {!shown && <ReceiptPreview data={receipt} />}
              {shown?.load.state === "loading" && (
                <>
                  <Skeleton />
                  <p className={styles.srOnly} role="status">
                    Loading your invoice…
                  </p>
                </>
              )}
              {shown?.load.state === "ready" && (
                <InvoicePreview invoice={shown.load.invoice} />
              )}
              {shown?.load.state === "failed" && (
                <div className={styles.failed} role="alert">
                  <AlertTriangle aria-hidden="true" />
                  <strong>We couldn&apos;t load the invoice</strong>
                  <p>Your payment is safe. Please try again in a moment.</p>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.ghost}`}
                    onClick={shown.retry}
                  >
                    <RotateCw aria-hidden="true" />
                    Try again
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <footer className={styles.foot}>
          {tab === "chats" ? (
            <Link href="/" className={`${styles.btn} ${styles.primary}`}>
              <MessageCircle aria-hidden="true" />
              {chatId ? "Continue in Aqua" : "Ask Aqua"}
            </Link>
          ) : tab === "purchases" ? (
            <Link href="/invoices" className={`${styles.btn} ${styles.ghost}`}>
              Open all purchases
            </Link>
          ) : shown ? (
            <DownloadButton
              invoice={shown}
              className={`${styles.btn} ${styles.primary}`}
            />
          ) : (
            <button
              type="button"
              className={`${styles.btn} ${styles.primary}`}
              disabled
            >
              <Download aria-hidden="true" />
              PDF ready with the invoice
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
