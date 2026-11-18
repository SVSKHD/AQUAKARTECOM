import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Landmark,
  Link2Off,
  Lock,
  LogOut,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Star,
  UserRound,
  X,
} from "lucide-react";
import logo from "@/assests/logo.png";
import { useAuth } from "@/context/AuthContext";
import CheckoutAddress from "@/pageComponents/aqua/CheckoutAddress";
import {
  emptyAddress,
  hasAddress,
  sameAddress,
  toAddress,
  toAddresses,
  validateAddress,
} from "@/pageComponents/aqua/profile";
import type { Address } from "@/pageComponents/aqua/types";
import {
  getOfflineSummary,
  getOfflineStatus,
  getProductCatalogue,
  initiateOfflinePayment,
  OfflinePaymentError,
  saveOfflineCustomer,
  type OfflineErrorKind,
  type OfflineLine,
  type OfflineStatus,
  type OfflineSummary,
} from "@/services/offlinePayment";
import {
  openPaymentWindow,
  PAYMENT_RETURN_MESSAGE,
  pollUntilSettled,
} from "@/utils/aquaCommerce";
import { assignLocation } from "@/utils/browserNav";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_TEL } from "@/utils/support";
import {
  alternatePhoneProblem,
  chromeIntentUrl,
  isAndroid,
  isInAppBrowser,
  isPayReturn,
  isRefusedInAppSignIn,
  money,
  payPath,
  rememberPaid,
  toMobile,
} from "./payHelpers";
import { matchLineProducts, type ProductInfo } from "./productInfo";
import styles from "./pay.module.css";

// The AuthContext is plain JS; this is the part of it the page uses.
export type PayUser = {
  _id?: string;
  name?: string;
  email?: string;
  addresses?: unknown;
  selectedAddress?: unknown;
};
export type PayAuth = {
  authenticated: boolean;
  authReady: boolean;
  loading: boolean;
  session: { token?: string; user?: PayUser } | null;
  signInWithGoogle: () => Promise<unknown>;
  signOut: (o?: {
    redirectTo?: string | null;
    notify?: boolean;
  }) => Promise<void>;
};
export const usePayAuth = () => useAuth() as unknown as PayAuth;

const first = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) || "";

// The status endpoint is rate limited per IP (30/min across these routes).
const POLL_MS = 5000;

type Pay =
  | { phase: "idle"; error?: string }
  | { phase: "starting" }
  | { phase: "redirecting" }
  | { phase: "waiting"; popup: Window | null }
  | { phase: "failed"; message: string };

type Pick = { address: Address; savedId: string | null };

// What the status endpoint says about this account and this link.
type Account =
  | { kind: "yours"; status: OfflineStatus } // bound to this account
  | { kind: "unbound" } // nobody has confirmed details yet
  | { kind: "error"; error: OfflinePaymentError };

const NOT_COMPLETED =
  "The payment wasn't completed. Nothing was charged; you can try again.";
const NOT_CONFIRMED =
  "We couldn't confirm the payment yet. If money left your account, it will show here once PhonePe confirms it, or contact Aquakart.";

// The account's default address for the first render (nothing picked yet).
const defaultPick = (user: PayUser | undefined): Pick => {
  const saved = toAddresses(user?.addresses);
  const sel = user?.selectedAddress ? toAddress(user.selectedAddress) : null;
  const a =
    (sel &&
      hasAddress(sel) &&
      (saved.find((s) => sameAddress(s, sel)) || sel)) ||
    saved.find(hasAddress) ||
    null;
  return a
    ? { address: a, savedId: a._id ?? null }
    : { address: emptyAddress(), savedId: null };
};

function Bubbles() {
  return (
    <div className={styles.bubbles} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export function PayShell({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <>
      <Head>
        <title>Your order | Aquakart</title>
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta name="referrer" content="no-referrer" />
      </Head>
      <main className={`${styles.page} ${aside ? styles.withPanel : ""}`}>
        <Bubbles />
        <div className={styles.shell}>
          <header className={styles.brandBar}>
            <span className={styles.brand}>
              <span className={styles.brandMark}>
                <img src={logo.src} alt="" width={30} height={30} />
              </span>
              <span className={styles.brandName}>Aquakart</span>
            </span>
            <span className={styles.secure}>
              <Lock aria-hidden="true" />
              Secure payment
            </span>
          </header>
          <div className={styles.card}>
            <div className={styles.waves} aria-hidden="true">
              <div className={`${styles.wave} ${styles.wave1}`} />
              <div className={`${styles.wave} ${styles.wave2}`} />
            </div>
            {children}
          </div>
          <SupportLine />
        </div>
      </main>
      {/* Portalled to <body>: the app's page wrapper is its own stacking
          context and would keep the panel under the assistant button. Only
          set after a click, so never during server rendering. */}
      {aside &&
        createPortal(
          <div className={`${styles.page} ${styles.overlay}`}>{aside}</div>,
          document.body,
        )}
    </>
  );
}

type Tone = "ok" | "warn" | "info";
const toneClass: Record<Tone, string> = {
  ok: styles.statusOk,
  warn: styles.statusWarn,
  info: styles.statusInfo,
};

export function Notice({
  title,
  tone = "info",
  icon,
  children,
}: {
  title: string;
  tone?: Tone;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className={`${styles.notice} ${styles.center}`} role="status">
      {icon && (
        <span className={`${styles.statusIcon} ${toneClass[tone]}`}>
          {icon}
        </span>
      )}
      <h1 className={styles.title}>{title}</h1>
      {children}
    </section>
  );
}

export function SupportLine() {
  return (
    <footer className={styles.footer}>
      <a href={SUPPORT_TEL} className={styles.link}>
        <Phone aria-hidden="true" />
        Questions? Call {SUPPORT_PHONE_DISPLAY}
      </a>
      <span>© Aquakart</span>
    </footer>
  );
}

export function InvalidLink() {
  return (
    <Notice
      title="This link is no longer valid"
      tone="warn"
      icon={<Link2Off aria-hidden="true" />}
    >
      <p className={styles.muted}>
        Please contact Aquakart for a new payment link.
      </p>
      <div className={styles.row}>
        <a href={SUPPORT_TEL} className="aq-btn aq-btn-primary">
          <Phone aria-hidden="true" width={16} height={16} />
          Call {SUPPORT_PHONE_DISPLAY}
        </a>
      </div>
    </Notice>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <section className={styles.section} aria-busy="true">
      <p role="status" className={styles.muted}>
        {label}
      </p>
      <div className={styles.skeleton} style={{ width: "60%" }} />
      <div className={styles.skeleton} />
      <div className={styles.skeleton} style={{ width: "80%" }} />
    </section>
  );
}

// The amount rolls up from zero once (instant with reduced motion).
export function useRollUp(value: number, ms = 900) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let t0 = -1;
    const tick = (now: number) => {
      if (t0 < 0) t0 = now;
      const p = reduce ? 1 : Math.min(1, Math.max(0, (now - t0) / ms));
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}

const validUntil = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export const displayName = (name: string) =>
  name.replace(/\s*\|\s*aquakart\s*$/i, "").trim() || name;

// A product from the order, beside the page on wide screens and as a bottom
// sheet on phones. Closes with Esc, the close button or (phones) the backdrop.
function ProductPanel({
  line,
  product,
  onClose,
}: {
  line: OfflineLine;
  product: ProductInfo | null;
  onClose: () => void;
}) {
  const photos = product?.photos.length
    ? product.photos
    : line.imageUrl
      ? [line.imageUrl]
      : [];
  const [shown, setShown] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const photo = photos[Math.min(shown, photos.length - 1)] || "";
  const name = displayName(product?.title || line.name);
  const tags = [product?.brand, product?.category, product?.subcategory].filter(
    (t): t is string => !!t,
  );
  return (
    <>
      <div
        className={styles.panelBackdrop}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={styles.productPanel}
        role="dialog"
        aria-modal="false"
        aria-label={name}
      >
        <span className={styles.sheetHandle} aria-hidden="true" />
        <div className={styles.panelTop}>
          <span className={styles.eyebrow}>In your order</span>
          <button
            ref={closeRef}
            type="button"
            className={styles.panelClose}
            onClick={onClose}
            aria-label="Close product details"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <div className={styles.panelScroll}>
          <div className={styles.gallery}>
            {photo ? (
              <img
                key={photo}
                src={photo}
                alt={name}
                className={styles.galleryMain}
              />
            ) : (
              <span className={styles.galleryEmpty} aria-hidden="true">
                <Package />
              </span>
            )}
          </div>
          {photos.length > 1 && (
            <div className={styles.galleryThumbs}>
              {photos.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.galleryThumb} ${
                    i === shown ? styles.galleryThumbOn : ""
                  }`}
                  onClick={() => setShown(i)}
                  aria-label={`Photo ${i + 1} of ${photos.length}`}
                  aria-pressed={i === shown}
                >
                  <img src={p} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
          {tags.length > 0 && (
            <div className={styles.chips}>
              {tags.map((t) => (
                <span key={t} className={styles.chip}>
                  {t}
                </span>
              ))}
            </div>
          )}
          <h2 className={styles.panelTitle}>{name}</h2>
          <div className={styles.panelMeta}>
            <span className={styles.qty}>Qty {line.quantity}</span>
            {product?.rating && (
              <span className={styles.rating}>
                <Star aria-hidden="true" />
                {product.rating.toFixed(1)}
                {product.reviews ? ` (${product.reviews})` : ""}
              </span>
            )}
          </div>
          {(line.description || product?.intro) && (
            <p className={styles.muted}>{line.description || product?.intro}</p>
          )}
          {product && product.specs.length > 0 && (
            <dl className={styles.specs}>
              {product.specs.map((s) => (
                <div key={s.label} className={styles.specRow}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {!product && (
            <p className={styles.small}>
              More details about this item are available from Aquakart.
            </p>
          )}
        </div>
        {product?.href && (
          <a
            href={product.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`aq-btn aq-btn-glass ${styles.panelLink}`}
          >
            View full product page
            <ExternalLink aria-hidden="true" width={16} height={16} />
          </a>
        )}
      </aside>
    </>
  );
}

function OrderSummary({
  summary,
  products,
  selected,
  onSelect,
}: {
  summary: OfflineSummary;
  products: (ProductInfo | null)[];
  selected: number | null;
  onSelect: (i: number) => void;
}) {
  const rolled = useRollUp(summary.total);
  const until = validUntil(summary.expiresAt);
  return (
    <section aria-labelledby="pay-order" className={styles.hero}>
      <p className={styles.eyebrow}>Payment request</p>
      <div className={styles.heroTop}>
        <h1 id="pay-order" className={styles.title}>
          Your order
        </h1>
        <div className={styles.amountBox}>
          <span className={styles.amountLabel}>Amount to pay</span>
          <span className={styles.amountBig} aria-hidden="true">
            {money(rolled)}
          </span>
        </div>
      </div>
      <div className={styles.chips}>
        {summary.reference && (
          <span className={styles.chip}>
            <FileText aria-hidden="true" />
            Ref. {summary.reference}
          </span>
        )}
        {until && (
          <span className={styles.chip}>
            <Clock aria-hidden="true" />
            Link valid until {until}
          </span>
        )}
      </div>
      <ul className={styles.lines}>
        {summary.lines.map((l, i) => {
          const product = products[i] ?? null;
          const photo = l.imageUrl || product?.photos[0] || "";
          const active = selected === i;
          return (
            <li
              key={`${l.name}-${i}`}
              className={styles.line}
              style={{ "--i": i } as CSSProperties}
            >
              <button
                type="button"
                className={`${styles.lineBtn} ${active ? styles.lineActive : ""}`}
                aria-haspopup="dialog"
                aria-expanded={active}
                onClick={() => onSelect(i)}
              >
                {photo ? (
                  <span className={styles.thumbBox}>
                    <img
                      src={photo}
                      alt=""
                      className={styles.thumb}
                      loading="lazy"
                    />
                  </span>
                ) : (
                  <span className={styles.thumbIcon} aria-hidden="true">
                    <Package />
                  </span>
                )}
                <span className={styles.lineText}>
                  <span className={styles.lineName}>{displayName(l.name)}</span>
                  {(product?.brand || product?.subcategory) && (
                    <span className={styles.lineDesc}>
                      {[product.brand, product.subcategory]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                  {l.description && (
                    <span className={styles.lineDesc}>{l.description}</span>
                  )}
                  <span className={styles.viewHint}>
                    View details
                    <ChevronRight aria-hidden="true" />
                  </span>
                </span>
                <span className={styles.qty}>Qty {l.quantity}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <dl className={styles.totals}>
        {summary.subtotal !== null && (
          <>
            <dt>Subtotal</dt>
            <dd>{money(summary.subtotal)}</dd>
          </>
        )}
        {!!summary.discount && (
          <>
            <dt>Discount</dt>
            <dd>−{money(summary.discount)}</dd>
          </>
        )}
        {!!summary.tax && (
          <>
            <dt>Tax</dt>
            <dd>{money(summary.tax)}</dd>
          </>
        )}
        <dt className={styles.grand}>To pay</dt>
        <dd className={styles.grand}>{money(summary.total)}</dd>
      </dl>
    </section>
  );
}

const STEPS = ["Sign in", "Your details", "Pay"];
function Steps({ current }: { current: number }) {
  return (
    <ol className={styles.steps} aria-label="Steps">
      {STEPS.map((label, i) => (
        <li
          key={label}
          className={`${styles.step} ${
            i < current
              ? styles.stepDone
              : i === current
                ? styles.stepActive
                : ""
          }`}
          aria-current={i === current ? "step" : undefined}
        >
          <span className={styles.stepDot}>
            {i < current ? <Check aria-hidden="true" /> : i + 1}
          </span>
          {label}
        </li>
      ))}
    </ol>
  );
}

function PanelHead({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className={styles.sectionHead}>
      <span className={styles.sectionIcon} aria-hidden="true">
        {icon}
      </span>
      <h2 className={styles.subtitle}>{title}</h2>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

// Google refused to sign in here (WhatsApp/Instagram's own browser).
function OpenInBrowser() {
  const [copied, setCopied] = useState(false);
  const [href, setHref] = useState("");
  const [android, setAndroid] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setHref(window.location.href);
      setAndroid(isAndroid(navigator.userAgent));
    }, 0);
    return () => clearTimeout(t);
  }, []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className={styles.inapp} role="alert">
      <b>Open in Chrome/Safari</b>
      <p className={styles.muted}>
        Google doesn't allow sign-in inside this app's browser. Open this page
        in Chrome or Safari to continue: copy the link, or use the menu (⋮ or
        the share button) and choose “Open in browser”.
      </p>
      <div className={styles.row}>
        <button
          type="button"
          className="aq-btn aq-btn-primary"
          onClick={() => void copy()}
        >
          <Copy aria-hidden="true" width={16} height={16} />
          {copied ? "Link copied" : "Copy link"}
        </button>
        {android && href && (
          <a className="aq-btn aq-btn-glass" href={chromeIntentUrl(href)}>
            <ExternalLink aria-hidden="true" width={16} height={16} />
            Open in Chrome
          </a>
        )}
      </div>
    </div>
  );
}

function SignIn({ auth, note }: { auth: PayAuth; note?: string }) {
  const [refused, setRefused] = useState(false);
  const [busy, setBusy] = useState(false);
  const signIn = async () => {
    setBusy(true);
    try {
      await auth.signInWithGoogle();
    } catch (e) {
      // AuthContext already shows the error; in an in-app browser the way out
      // is a real browser.
      if (isRefusedInAppSignIn(e) || isInAppBrowser(navigator.userAgent))
        setRefused(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className={styles.panel}>
      <PanelHead icon={<UserRound />} title="Sign in to pay" />
      <p className={styles.muted}>
        {note ||
          "Sign in with Google so this purchase and its invoice are saved to your Aquakart account."}
      </p>
      <button
        type="button"
        className={`aq-btn ${styles.googleBtn}`}
        disabled={busy || auth.loading}
        aria-busy={busy || !auth.authReady}
        onClick={() => void signIn()}
      >
        <GoogleMark />
        {busy
          ? "Opening Google…"
          : auth.authReady
            ? "Continue with Google"
            : "Checking sign-in…"}
      </button>
      {refused && <OpenInBrowser />}
    </section>
  );
}

function BoundElsewhere({ auth }: { auth: PayAuth }) {
  return (
    <Notice
      title="This link belongs to another account"
      tone="warn"
      icon={<UserRound aria-hidden="true" />}
    >
      <p className={styles.muted}>
        This payment link is already linked to a different Aquakart account.
        Sign in with the Google account you used before, or contact Aquakart.
      </p>
      <div className={styles.row}>
        <button
          type="button"
          className="aq-btn aq-btn-glass"
          onClick={() => void auth.signOut({ redirectTo: null, notify: false })}
        >
          <LogOut aria-hidden="true" width={16} height={16} />
          Sign out
        </button>
        <a href={SUPPORT_TEL} className="aq-btn aq-btn-primary">
          <Phone aria-hidden="true" width={16} height={16} />
          Call Aquakart
        </a>
      </div>
    </Notice>
  );
}

// PhonePe sends the customer back to /pay/[token]?return=1. In the popup, hand
// back to the Aqua tab that opened it and close; with no such tab (popup was
// blocked, or the tab is gone) this tab carries on and checks the status.
function useReturnFromPhonePe(token: string, returning: boolean) {
  const router = useRouter();
  useEffect(() => {
    if (!returning || !token) return;
    let opener: Window | null = null;
    try {
      const o = window.opener as Window | null;
      if (
        o &&
        o !== window &&
        !o.closed &&
        o.location.origin === window.location.origin
      )
        opener = o;
    } catch {
      opener = null; // the opener is on another site now
    }
    if (opener) {
      opener.postMessage(
        { type: PAYMENT_RETURN_MESSAGE },
        window.location.origin,
      );
      window.close();
    }
    // Still open: carry on here (a refused close lands here too).
    const t = setTimeout(
      () => void router.replace(payPath(token), undefined, { shallow: true }),
      opener ? 1500 : 0,
    );
    return () => clearTimeout(t);
  }, [returning, router, token]);
}

export default function OfflinePayPage() {
  const router = useRouter();
  const auth = usePayAuth();
  const token = router.isReady ? first(router.query.token) : "";
  const returning = router.isReady && isPayReturn(first(router.query.return));
  const authToken = auth.authenticated ? auth.session?.token || "" : "";
  const user = auth.session?.user;
  useReturnFromPhonePe(token, returning);

  // ---------- the order: public, loaded at once (not after sign-in) ----------
  const [attempt, setAttempt] = useState(0);
  const key = token ? `${token}|${attempt}` : null;
  const [loaded, setLoaded] = useState<{
    key: string;
    summary?: OfflineSummary;
    error?: OfflinePaymentError;
  } | null>(null);
  useEffect(() => {
    if (!key) return;
    const ctl = new AbortController();
    getOfflineSummary(token, ctl.signal).then(
      (summary) => setLoaded({ key, summary }),
      (error: OfflinePaymentError) => {
        if (!ctl.signal.aborted) setLoaded({ key, error });
      },
    );
    return () => ctl.abort();
  }, [key, token]);
  const fresh = loaded && loaded.key === key ? loaded : null;
  const summary = fresh?.summary ?? null;

  // Photos and details for the lines (optional: the page works without them).
  const [catalogue, setCatalogue] = useState<{
    key: string;
    products: (ProductInfo | null)[];
  } | null>(null);
  useEffect(() => {
    if (!key || !summary || !summary.lines.length) return;
    const ctl = new AbortController();
    getProductCatalogue(ctl.signal).then((payload) => {
      if (!ctl.signal.aborted)
        setCatalogue({
          key,
          products: matchLineProducts(summary.lines, payload),
        });
    });
    return () => ctl.abort();
  }, [key, summary]);
  const products = catalogue && catalogue.key === key ? catalogue.products : [];
  const [selected, setSelected] = useState<number | null>(null);
  const closeProduct = useCallback(() => setSelected(null), []);

  // ---------- this account and the link (after sign-in) ----------
  const [check, setCheck] = useState(0);
  const accountKey =
    token && summary && authToken && !returning
      ? `${token}|${authToken}|${check}`
      : null;
  const [accountLoaded, setAccountLoaded] = useState<{
    key: string;
    account: Account;
  } | null>(null);
  useEffect(() => {
    if (!accountKey) return;
    const ctl = new AbortController();
    getOfflineStatus(token, authToken, ctl.signal).then(
      (status) =>
        setAccountLoaded({
          key: accountKey,
          account: { kind: "yours", status },
        }),
      (error: OfflinePaymentError) => {
        if (ctl.signal.aborted) return;
        setAccountLoaded({
          key: accountKey,
          account:
            error.kind === "details"
              ? { kind: "unbound" }
              : { kind: "error", error },
        });
      },
    );
    return () => ctl.abort();
  }, [accountKey, token, authToken]);
  const account =
    accountLoaded && accountLoaded.key === accountKey
      ? accountLoaded.account
      : null;
  const accountError = account?.kind === "error" ? account.error : null;
  const lastStatus = account?.kind === "yours" ? account.status.status : null;

  // ---------- details ----------
  const [pick, setPick] = useState<Pick | null>(null);
  const fallback = defaultPick(user);
  const chosen = pick ?? fallback;
  const [addingAddress, setAddingAddress] = useState(false);
  const [alternate, setAlternate] = useState("");
  const [touched, setTouched] = useState(false);

  const onPick = useCallback((address: Address, savedId: string | null) => {
    setPick({ address, savedId });
  }, []);
  // A new address is only used for this payment here; POST /customer appends
  // it to the account. A saved address picked as is is never edited.
  const onSave = useCallback(async (address: Address) => address, []);

  // ---------- payment ----------
  const [pay, setPay] = useState<Pay>({ phase: "idle" });
  const [fatal, setFatal] = useState<OfflineErrorKind | null>(null);
  // Set once the customer chooses to pay again instead of waiting.
  const [skipResume, setSkipResume] = useState(false);
  const [popupGone, setPopupGone] = useState(false);
  const [lastCheck, setLastCheck] = useState(0);
  const checkNowRef = useRef<() => void>(() => {});

  // A payment already under way (refresh, or PhonePe came back in this tab).
  const resumable =
    pay.phase === "idle" && !skipResume && lastStatus === "pending";
  const polling =
    !!authToken &&
    !returning &&
    (account?.kind === "yours" || account?.kind === "unbound") &&
    (pay.phase === "waiting" || resumable);
  const popup = pay.phase === "waiting" ? pay.popup : null;
  // No PhonePe window to wait on: it closed, reported back, or this page was
  // resumed.
  const windowGone = popupGone || !popup;

  useEffect(() => {
    if (!polling) return;
    let active = true;
    const w = pollUntilSettled(
      async (signal) => {
        const s = await getOfflineStatus(token, authToken, signal);
        if (s.status === "paid") rememberPaid(token, s);
        return {
          status:
            s.status === "paid"
              ? "paid"
              : s.status === "failed"
                ? "failed"
                : "pending",
          order: null,
        };
      },
      { intervalMs: POLL_MS, onCheck: () => setLastCheck(Date.now()) },
    );
    checkNowRef.current = w.checkNow;
    w.done.then((r) => {
      if (!active) return;
      if (r.status === "paid") {
        void router.replace(`${payPath(token)}/success`);
        return;
      }
      setPay({
        phase: "failed",
        message: r.status === "failed" ? NOT_COMPLETED : NOT_CONFIRMED,
      });
    });

    // The PhonePe window, back on /pay/[token]?return=1, posts this. It only
    // triggers a check: the status endpoint decides.
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string } | null;
      if (d?.type !== PAYMENT_RETURN_MESSAGE) return;
      setPopupGone(true);
      w.checkNow();
    };
    window.addEventListener("message", onMessage);
    // A window closed by the customer triggers a check at once.
    let wasClosed = false;
    const watch = setInterval(() => {
      const closed = !!popup && popup.closed;
      if (closed && !wasClosed) {
        setPopupGone(true);
        w.checkNow();
      }
      wasClosed = closed;
    }, 1000);
    return () => {
      active = false;
      w.cancel();
      clearInterval(watch);
      window.removeEventListener("message", onMessage);
    };
  }, [polling, token, authToken, popup, router]);

  const problems = (() => {
    const p: string[] = [];
    if (addingAddress) p.push("Confirm the delivery address first.");
    else {
      const missing = validateAddress(chosen.address);
      if (missing.length) p.push(`Add ${missing.join(", ")} to the address.`);
    }
    const alt = alternatePhoneProblem(alternate, summary?.phoneMasked || "");
    if (alt) p.push(alt);
    return p;
  })();

  const startPayment = () => {
    setTouched(true);
    if (problems.length || !summary || !authToken) return;
    // Opened before any await, so popup blockers allow it.
    const win = openPaymentWindow();
    setPay({ phase: "starting" });
    setSkipResume(true);
    const a = toAddress(chosen.address);
    const alt = toMobile(alternate);
    void (async () => {
      try {
        await saveOfflineCustomer(
          token,
          {
            address: {
              street: a.street.trim(),
              city: a.city.trim(),
              state: a.state.trim(),
              postalCode: a.postalCode.trim(),
            },
            ...(alt ? { alternatePhone: alt } : {}),
          },
          authToken,
        );
        const started = await initiateOfflinePayment(token, authToken);
        if (win && !win.closed) {
          win.location.href = started.redirectUrl;
          setPopupGone(false);
          setPay({ phase: "waiting", popup: win });
        } else {
          // Popup blocked: PhonePe in this tab; it comes back to ?return=1.
          setPay({ phase: "redirecting" });
          assignLocation(started.redirectUrl);
        }
      } catch (e) {
        win?.close();
        const err =
          e instanceof OfflinePaymentError
            ? e
            : new OfflinePaymentError("Couldn't start the payment.", "other");
        if (err.kind === "invalid" || err.kind === "bound") {
          setFatal(err.kind);
          setPay({ phase: "idle" });
        } else if (err.kind === "paid") {
          // Paid meanwhile (another tab): the status check takes it from here.
          setPay({ phase: "idle" });
          setCheck((n) => n + 1);
        } else setPay({ phase: "idle", error: err.message });
      }
    })();
  };

  const payAgain = () => {
    try {
      popup?.close();
    } catch {
      // another origin's window: leave it
    }
    setSkipResume(true);
    setPay({ phase: "idle" });
  };

  // ---------- screens ----------
  if (returning)
    return (
      <PayShell>
        <section className={`${styles.section} ${styles.center}`}>
          <span className={styles.waitRing} aria-hidden="true">
            <Smartphone />
          </span>
          <p role="status" className={styles.muted}>
            Returning to Aquakart…
          </p>
        </section>
      </PayShell>
    );

  const error = fresh?.error;
  if (
    error?.kind === "invalid" ||
    accountError?.kind === "invalid" ||
    fatal === "invalid"
  )
    return (
      <PayShell>
        <InvalidLink />
      </PayShell>
    );
  if (!summary)
    return (
      <PayShell>
        {error ? (
          <Notice
            title="We couldn't load your order"
            tone="warn"
            icon={<CircleAlert aria-hidden="true" />}
          >
            <p className={styles.muted}>{error.message}</p>
            <div className={styles.row}>
              <button
                type="button"
                className="aq-btn aq-btn-primary"
                onClick={() => setAttempt((n) => n + 1)}
              >
                <RefreshCw aria-hidden="true" width={16} height={16} />
                Try again
              </button>
            </div>
          </Notice>
        ) : (
          <Loading label="Loading your order…" />
        )}
      </PayShell>
    );

  if (authToken && (accountError?.kind === "bound" || fatal === "bound"))
    return (
      <PayShell>
        <BoundElsewhere auth={auth} />
      </PayShell>
    );

  if (lastStatus === "paid")
    return (
      <PayShell>
        <SuccessRedirect
          token={token}
          status={account?.kind === "yours" ? account.status : null}
        />
      </PayShell>
    );

  if (summary.paid)
    return (
      <PayShell>
        <Notice
          title="This order is already paid"
          tone="ok"
          icon={<CircleCheck aria-hidden="true" />}
        >
          <p className={styles.muted}>
            {authToken && !account
              ? "Checking your purchase…"
              : "Sign in with the account you paid from to see your purchase and invoice."}
          </p>
        </Notice>
        {!authToken && <SignIn auth={auth} />}
      </PayShell>
    );

  const waiting = polling || pay.phase === "redirecting";
  const step = !authToken ? 0 : waiting ? 2 : 1;
  let body: ReactNode;
  if (!authToken) body = <SignIn auth={auth} />;
  else if (accountError?.kind === "auth")
    body = (
      <SignIn
        auth={auth}
        note="Your sign-in has expired. Please sign in again."
      />
    );
  else if (accountError)
    body = (
      <section className={styles.panel}>
        <p className={styles.error} role="alert">
          {accountError.message}
        </p>
        <button
          type="button"
          className="aq-btn aq-btn-primary"
          onClick={() => setCheck((n) => n + 1)}
        >
          <RefreshCw aria-hidden="true" width={16} height={16} />
          Try again
        </button>
      </section>
    );
  else if (!account) body = <Loading label="Checking your account…" />;
  else if (waiting)
    body = (
      <section className={`${styles.panel} ${styles.center}`} aria-busy="true">
        <span className={styles.waitRing} aria-hidden="true">
          <Smartphone />
        </span>
        <h2 className={styles.subtitle}>Waiting for PhonePe</h2>
        <p role="status" className={styles.muted}>
          {pay.phase === "redirecting"
            ? "Opening PhonePe…"
            : windowGone
              ? "We haven't had confirmation from PhonePe yet. If you completed the payment, this can take a minute."
              : "Complete the payment in the PhonePe window. Keep this page open; it updates by itself."}
        </p>
        {lastCheck > 0 && (
          <p className={styles.small}>
            Last checked {new Date(lastCheck).toLocaleTimeString("en-IN")}
          </p>
        )}
        {pay.phase !== "redirecting" && (
          <div className={styles.row}>
            {!windowGone && popup && (
              <button
                type="button"
                className="aq-btn aq-btn-glass"
                onClick={() => {
                  try {
                    popup.focus();
                  } catch {
                    // nothing to focus
                  }
                }}
              >
                <ExternalLink aria-hidden="true" width={16} height={16} />
                Show PhonePe window
              </button>
            )}
            <button
              type="button"
              className="aq-btn aq-btn-glass"
              onClick={() => checkNowRef.current()}
            >
              <RefreshCw aria-hidden="true" width={16} height={16} />
              Check again
            </button>
            {windowGone && (
              <button
                type="button"
                className="aq-btn aq-btn-ghost"
                onClick={payAgain}
              >
                Pay again
              </button>
            )}
          </div>
        )}
      </section>
    );
  else
    body = (
      <section className={styles.panel}>
        {pay.phase === "failed" && (
          <p className={styles.error} role="alert">
            {pay.message}
          </p>
        )}
        {pay.phase === "idle" && lastStatus === "failed" && !pay.error && (
          <p className={styles.error} role="alert">
            Your last payment attempt didn't go through. You can try again.
          </p>
        )}
        <PanelHead icon={<MapPin />} title="Delivery details" />
        {summary.phoneMasked && (
          <label className="aq-field">
            Primary mobile
            <input
              className="aq-input"
              value={summary.phoneMasked}
              readOnly
              aria-readonly="true"
            />
          </label>
        )}
        <CheckoutAddress
          address={chosen.address}
          savedAddressId={chosen.savedId}
          saved={toAddresses(user?.addresses)}
          defaultAddress={fallback.savedId ? fallback.address : null}
          signedIn
          onPick={onPick}
          onChange={(patch) =>
            setPick({ address: { ...chosen.address, ...patch }, savedId: null })
          }
          onSave={onSave}
          onAddingChange={setAddingAddress}
        />
        <label className="aq-field">
          Alternate mobile (optional)
          <input
            className="aq-input"
            value={alternate}
            onChange={(e) => setAlternate(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="Another number we can reach you on"
            aria-invalid={
              touched && !!alternatePhoneProblem(alternate, summary.phoneMasked)
            }
          />
        </label>
        {touched && problems.length > 0 && (
          <p className={styles.error} role="alert">
            {problems[0]}
          </p>
        )}
        {pay.phase === "idle" && pay.error && (
          <p className={styles.error} role="alert">
            {pay.error}
          </p>
        )}
        <button
          type="button"
          className={`aq-btn aq-btn-primary ${styles.payBtn}`}
          disabled={pay.phase === "starting"}
          aria-busy={pay.phase === "starting"}
          onClick={startPayment}
        >
          <Lock aria-hidden="true" />
          {pay.phase === "starting"
            ? "Opening PhonePe…"
            : `Pay ${money(summary.total)} with PhonePe`}
        </button>
        <div className={styles.trust}>
          <span>
            <ShieldCheck aria-hidden="true" />
            Secured by PhonePe
          </span>
          <span>
            <Smartphone aria-hidden="true" />
            UPI
          </span>
          <span>
            <CreditCard aria-hidden="true" />
            Cards
          </span>
          <span>
            <Landmark aria-hidden="true" />
            Net banking
          </span>
        </div>
      </section>
    );

  const selectedLine = selected !== null ? summary.lines[selected] : undefined;
  return (
    <PayShell
      aside={
        selectedLine && (
          <ProductPanel
            key={selected}
            line={selectedLine}
            product={products[selected as number] ?? null}
            onClose={closeProduct}
          />
        )
      }
    >
      <OrderSummary
        summary={summary}
        products={products}
        selected={selected}
        onSelect={(i) => setSelected((cur) => (cur === i ? null : i))}
      />
      <Steps current={step} />
      {body}
    </PayShell>
  );
}

function SuccessRedirect({
  token,
  status,
}: {
  token: string;
  status: OfflineStatus | null;
}) {
  const router = useRouter();
  useEffect(() => {
    if (status) rememberPaid(token, status);
    void router.replace(`${payPath(token)}/success`);
  }, [router, token, status]);
  return <Loading label="Opening your purchase…" />;
}
