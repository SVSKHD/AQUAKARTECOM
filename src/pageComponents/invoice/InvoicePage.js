import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Hash,
  Headphones,
  Landmark,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Printer,
  ReceiptIndianRupee,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tags,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assests/logo.png";
import GoogleMark from "@/components/auth/GoogleMark";
import {
  exchangeFirebaseIdToken,
  getCurrentFirebaseIdToken,
  loginWithGoogleForInvoice,
} from "@/services/googleAuth";
import { useAuth } from "@/context/AuthContext";
import InvoiceServiceOperations from "@/services/invoice";
import { openDirectInvoiceAccess } from "@/features/invoiceAccess/directInvoice";
import {
  clearDownloadAfterLogin,
  consumeDownloadAfterLogin,
  requestDownloadAfterLogin,
} from "@/features/invoiceAccess/autoDownload";
import {
  bankCopyDetails,
  bankPaymentMethods,
  customerCare,
  termsAndConditions,
} from "@/constants/invoiceStaticData";
import priceUtils from "@/utils/priceUtils";
import useAssistant from "@/utils/assistant";
import {
  getDocumentKind,
  getDocumentStatus,
} from "@/utils/invoice/documentKind";
import InvoiceAiPanel from "@/pageComponents/invoice/InvoiceAiPanel";
import LiquidLogo from "@/pageComponents/invoice/LiquidLogo";
import {
  CountUp,
  InvoiceStamp,
  StatusLegend,
  StatusPill,
} from "@/pageComponents/invoice/InvoiceStamp";
import {
  otherProductQuestion,
  ownedProductQuestions,
  recommendProducts,
  shortProductName,
} from "@/utils/invoice/recommendProducts";
import {
  closePdfDownloadTarget,
  needsTapToDownloadPdf,
  preparePdfDownloadTarget,
} from "@/utils/pdfDownload";
import styles from "@/styles/invoice.module.css";

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const titleCase = (value) =>
  String(value || "Not available")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\b(Upi|Neft|Rtgs|Imps|Emi)\b/g, (word) => word.toUpperCase());

const PREVIEW_PRODUCTS = 3;

// Logged-out quick view shown above "Login to download invoice": number,
// date, status, items and total. Contact details appear only after login.
const InvoiceQuickView = ({ preview }) => {
  const asInvoice = {
    paid_status: String(preview.paidStatus || "unpaid").toLowerCase(),
    quotation: preview.documentType === "quotation",
    po: preview.documentType === "purchase-order",
    gst: preview.gst,
  };
  const { name: documentName } = getDocumentKind(asInvoice);
  const status = getDocumentStatus(asInvoice);
  const products = preview.products || [];
  const shown = products.slice(0, PREVIEW_PRODUCTS);
  const more = Math.max(0, (preview.itemCount || 0) - shown.length);

  return (
    <section
      className={styles.quickView}
      aria-label={`${documentName} quick view`}
      data-invoice-quick-view
    >
      <header className={styles.quickViewHeader}>
        <div>
          <span className={styles.quickViewLabel}>{documentName}</span>
          <strong className={styles.quickViewNumber}>
            <Hash size={14} aria-hidden="true" />
            {preview.invoiceNo}
          </strong>
        </div>
        {status ? <StatusPill status={status} /> : null}
      </header>
      <dl className={styles.quickViewMeta}>
        <div>
          <dt>
            <CalendarDays size={14} aria-hidden="true" /> Date
          </dt>
          <dd>{formatDate(preview.date)}</dd>
        </div>
        {preview.customerName ? (
          <div>
            <dt>
              <BadgeCheck size={14} aria-hidden="true" /> Billed to
            </dt>
            <dd>{preview.customerName}</dd>
          </div>
        ) : null}
      </dl>
      {shown.length ? (
        <ul className={styles.quickViewItems}>
          {shown.map((product, index) => (
            <li key={`${product.name}-${index}`}>
              <Package size={14} aria-hidden="true" />
              <span>{product.name}</span>
              <span className={styles.quickViewQty}>× {product.quantity}</span>
            </li>
          ))}
          {more ? (
            <li className={styles.quickViewMore}>
              + {more} more item{more === 1 ? "" : "s"}
            </li>
          ) : null}
        </ul>
      ) : null}
      <footer className={styles.quickViewTotal}>
        <span>Total</span>
        <strong>{priceUtils.formatAmount(preview.total_price)}</strong>
      </footer>
    </section>
  );
};

const InvoiceError = ({ statusCode, onAccessGranted }) => {
  const router = useRouter();
  const { adoptGoogleSession } = useAuth();
  const [preview, setPreview] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasGoogleSession, setHasGoogleSession] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [openingInvoice, setOpeningInvoice] = useState(false);
  const [accessError, setAccessError] = useState("");
  const attemptedDirectAccess = useRef(false);
  const directAccessInFlight = useRef(false);
  const notFound = statusCode === 404;
  const unauthorized = statusCode === 401 || statusCode === 403;
  const routeId = Array.isArray(router.query.id)
    ? router.query.id[0]
    : router.query.id;
  const authBusy = checkingSession || signingIn || openingInvoice;
  const clientAccessMessage = accessError
    ? "We could not open the invoice just now. Please try again."
    : "";

  const requestDirectAccess = useCallback(
    async (firebaseIdToken) => {
      if (!routeId || !firebaseIdToken || directAccessInFlight.current) {
        return;
      }

      attemptedDirectAccess.current = true;
      directAccessInFlight.current = true;
      setOpeningInvoice(true);
      setAccessError("");

      try {
        await openDirectInvoiceAccess({
          invoiceId: routeId,
          firebaseIdToken,
          loginDirectInvoiceAccess:
            InvoiceServiceOperations.loginDirectInvoiceAccess,
          exchangeFirebaseIdToken,
          onStorefrontSession: adoptGoogleSession,
        });
        await onAccessGranted?.();
        return true;
      } catch (error) {
        setAccessError(
          error?.response?.data?.message ||
            error?.message ||
            "We could not verify access to this invoice.",
        );
        return false;
      } finally {
        directAccessInFlight.current = false;
        setOpeningInvoice(false);
      }
    },
    [adoptGoogleSession, onAccessGranted, routeId],
  );

  useEffect(() => {
    if (!unauthorized || !routeId || attemptedDirectAccess.current) {
      setCheckingSession(false);
      return undefined;
    }

    let active = true;
    setCheckingSession(true);

    const openWithExistingGoogleSession = async () => {
      try {
        const firebaseIdToken = await getCurrentFirebaseIdToken();
        if (!active) return;
        setHasGoogleSession(true);
        await requestDirectAccess(firebaseIdToken);
      } catch (error) {
        if (!active) return;
        setHasGoogleSession(false);
        if (error?.code !== "auth/no-current-user") {
          setAccessError(
            error?.message || "We could not verify your Google session.",
          );
        }
      } finally {
        if (active) setCheckingSession(false);
      }
    };

    void openWithExistingGoogleSession();
    return () => {
      active = false;
    };
  }, [requestDirectAccess, routeId, unauthorized]);

  // Quick view for the sign-in screen; the screen works without it.
  useEffect(() => {
    if (!unauthorized || !routeId) return undefined;
    const controller = new AbortController();
    InvoiceServiceOperations.getInvoicePreview?.(routeId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setPreview(result || null);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [routeId, unauthorized]);

  const continueWithGoogle = async () => {
    if (authBusy) return;

    setSigningIn(true);
    setAccessError("");
    // The full invoice starts the PDF once this login grants access, also
    // after a Google redirect round-trip.
    requestDownloadAfterLogin(routeId);
    try {
      const result = await loginWithGoogleForInvoice();
      if (!result?.redirecting) {
        setHasGoogleSession(true);
        attemptedDirectAccess.current = false;
        const opened = await requestDirectAccess(result.firebaseIdToken);
        if (!opened) clearDownloadAfterLogin();
      }
    } catch (error) {
      clearDownloadAfterLogin();
      setAccessError(
        error?.response?.data?.message ||
          error?.message ||
          "We could not verify your Google account.",
      );
    } finally {
      setSigningIn(false);
    }
  };

  const primaryActionLabel = openingInvoice
    ? "Opening invoice…"
    : checkingSession
      ? "Checking Google session…"
      : signingIn
        ? "Continuing with Google…"
        : hasGoogleSession
          ? "Open invoice to download"
          : "Login to download invoice";

  return (
    <div className={styles.errorPage}>
      <Head>
        <title>
          {notFound
            ? "Invoice not found"
            : unauthorized
              ? "Secure access required"
              : "Invoice unavailable"}{" "}
          | Aquakart
        </title>
        <meta name="robots" content="noindex, nofollow, noarchive" />
      </Head>
      <div className={styles.errorGlow} />
      <div className={styles.errorCard}>
        <div className={styles.errorLogo}>
          <Image src={logo} alt="Aquakart" width={68} height={68} priority />
        </div>
        <span className={styles.eyebrow}>Aquakart invoices</span>
        <h1>
          {unauthorized
            ? "Open your invoice."
            : notFound
              ? "We could not find that invoice."
              : "The invoice is taking a pause."}
        </h1>
        <p>
          {unauthorized
            ? checkingSession
              ? "We are checking your existing Google session and will open the invoice automatically."
              : hasGoogleSession
                ? "You are signed in. We are securely opening this invoice with your verified email."
                : preview
                  ? "Here is a quick look. Log in with Google to see the full invoice and download the PDF."
                  : "Continue with Google once to securely view and download your invoice."
            : notFound
              ? "Check the invoice link and try again. The ID may be incomplete or no longer available."
              : "We could not reach the invoice service. Please wait a moment and try again."}
        </p>
        {unauthorized && preview ? (
          <InvoiceQuickView preview={preview} />
        ) : null}
        {clientAccessMessage ? (
          <p className={styles.accessError} role="alert">
            {clientAccessMessage}
          </p>
        ) : null}
        <div className={styles.errorActions}>
          {unauthorized ? (
            <button
              type="button"
              className={styles.googleSignInButton}
              onClick={continueWithGoogle}
              disabled={authBusy}
            >
              <GoogleMark />
              {primaryActionLabel}
            </button>
          ) : (
            <button type="button" onClick={() => window.location.reload()}>
              Try again
            </button>
          )}
          <Link href="/" className={styles.homeButton}>
            <ArrowLeft size={16} /> Back to Aquakart
          </Link>
        </div>
      </div>
    </div>
  );
};

const getProductHref = (product = {}) => {
  const directLink = product.productLink;
  if (directLink?.startsWith("http://") || directLink?.startsWith("https://")) {
    return directLink;
  }
  if (directLink?.startsWith("/")) return directLink;

  const reference =
    product.productSlug || product.catalogueProductId || product.id;
  return reference ? `/product/${encodeURIComponent(reference)}` : "";
};

const copyProductLink = async (href) => {
  if (!href) {
    toast.error("Product link is not available");
    return;
  }

  const absoluteUrl = href.startsWith("http")
    ? href
    : `${window.location.origin}${href}`;
  try {
    await navigator.clipboard.writeText(absoluteUrl);
    toast.success("Product link copied");
  } catch {
    toast.error("Could not copy the product link");
  }
};

// One compact line item: picture, name, the arithmetic and quick actions.
const ProductRow = ({ product, index, onAsk, grandTotal }) => {
  const href = getProductHref(product);
  const line = priceUtils.getLineAmounts(product);
  const tags = [product.productCategory, product.productSubcategory].filter(
    Boolean,
  );
  const share =
    grandTotal > 0
      ? Math.min(100, Math.round((line.offerTotal / grandTotal) * 100))
      : 0;

  return (
    <article className={styles.lineItem}>
      <a
        className={`${styles.lineThumb} ${!href ? styles.lineThumbDisabled : ""}`}
        href={href || undefined}
        target={href ? "_blank" : undefined}
        rel={href ? "noreferrer" : undefined}
        aria-label={
          href
            ? `Open ${product.productName}`
            : `${product.productName} has no product page`
        }
      >
        <span>{String(index + 1).padStart(2, "0")}</span>
        {product.productImage ? (
          <img src={product.productImage} alt="" />
        ) : (
          <Package size={26} strokeWidth={1.4} aria-hidden="true" />
        )}
      </a>

      <div className={styles.lineBody}>
        <h3>{product.productName}</h3>
        {tags.length ? (
          <p className={styles.lineTags}>
            <Tags size={11} aria-hidden="true" />
            {tags.join(" · ")}
          </p>
        ) : null}
        <dl className={styles.lineFigures}>
          <div>
            <dt>{line.hasDiscount ? "Original price" : "Unit price"}</dt>
            <dd className={line.hasDiscount ? styles.struckPrice : undefined}>
              {priceUtils.formatAmount(product.productPrice)}
            </dd>
          </div>
          <div>
            <dt>Qty</dt>
            <dd>× {product.productQuantity}</dd>
          </div>
          {line.hasDiscount ? (
            <>
              <div className={styles.lineFigureDiscount}>
                <dt>Discount</dt>
                <dd>− {priceUtils.formatAmount(line.discount)}</dd>
              </div>
              <div>
                <dt>Offer price</dt>
                <dd>{priceUtils.formatAmount(line.offerUnitPrice)}</dd>
              </div>
            </>
          ) : null}
          <div className={styles.lineFigureTotal}>
            <dt>{line.hasDiscount ? "Offer total" : "Line total"}</dt>
            <dd>{priceUtils.formatAmount(line.offerTotal)}</dd>
          </div>
        </dl>
        {share > 0 ? (
          <div
            className={styles.lineShare}
            title={`${share}% of the total`}
            aria-label={`${share}% of the total`}
          >
            <span style={{ "--share": `${share}%` }} />
            <small>{share}% of total</small>
          </div>
        ) : null}
      </div>

      <div className={styles.lineActions}>
        {onAsk ? (
          <button
            type="button"
            className={styles.askButton}
            onClick={() => onAsk(product)}
          >
            <Sparkles size={13} aria-hidden="true" /> Ask AI
          </button>
        ) : null}
        {href ? (
          <a
            className={styles.ghostButton}
            href={href}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={13} aria-hidden="true" /> View
          </a>
        ) : null}
        {href ? (
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => copyProductLink(href)}
            aria-label={`Copy ${product.productName} link`}
            title="Copy product link"
          >
            <Link2 size={13} />
          </button>
        ) : null}
      </div>
    </article>
  );
};

// A sideways rail with no scrollbar: glowing arrows appear at whichever end
// has more to show and page through it.
const ScrollRail = ({ label, count, children }) => {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ back: false, forward: false });

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const overflow = track.scrollWidth - track.clientWidth;
    const back = track.scrollLeft > 2;
    const forward = track.scrollLeft < overflow - 2;
    setEdges((current) =>
      current.back === back && current.forward === forward
        ? current
        : { back, forward },
    );
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    measure();
    track.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      track.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure, count]);

  const page = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * track.clientWidth * 0.85,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  return (
    <div className={styles.rail}>
      {edges.back ? (
        <button
          type="button"
          className={`${styles.railArrow} ${styles.railArrowBack}`}
          onClick={() => page(-1)}
          aria-label={`Previous ${label.toLowerCase()}`}
        >
          <ChevronLeft size={18} />
        </button>
      ) : null}
      {edges.forward ? (
        <button
          type="button"
          className={`${styles.railArrow} ${styles.railArrowForward}`}
          onClick={() => page(1)}
          aria-label={`More ${label.toLowerCase()}`}
        >
          <ChevronRight size={18} />
        </button>
      ) : null}
      <div
        ref={trackRef}
        className={styles.railTrack}
        role="list"
        aria-label={label}
      >
        {children}
      </div>
    </div>
  );
};

// Another catalogue product as a poster card: the picture fills the card, with
// the name and price over a gradient. Hover or keyboard focus lifts the card
// and fades in a details panel (only transform/opacity animate, so it stays
// smooth). Touch screens show the name, price and actions directly.
const RecommendationCard = ({ product, onAsk }) => {
  const off = product.mrp
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;
  const facts = [
    product.capacity && ["Capacity", product.capacity],
    product.flow && ["Flow", product.flow],
    product.warranty && ["Warranty", product.warranty],
  ].filter(Boolean);
  const price = priceUtils.formatAmount(product.price, { showPaise: false });
  const mrp =
    off > 0 ? priceUtils.formatAmount(product.mrp, { showPaise: false }) : "";

  return (
    <article className={styles.recoCard} role="listitem">
      <div className={styles.recoPoster} aria-hidden="true">
        {product.image ? (
          <img src={product.image} alt="" loading="lazy" />
        ) : (
          <Package size={40} strokeWidth={1.2} />
        )}
      </div>

      <div className={styles.recoBadges}>
        {off > 0 ? <span className={styles.recoBadge}>{off}% off</span> : null}
        {!product.inStock ? (
          <span className={styles.recoSoldOut}>Sold out</span>
        ) : null}
      </div>

      {/* Resting state; the panel below carries the same text for assistive tech. */}
      <div className={styles.recoSummary} aria-hidden="true">
        <span className={styles.recoCategory}>
          {titleCase(product.category)}
        </span>
        <strong className={styles.recoTitle}>{product.title}</strong>
        <span className={styles.recoPrice}>
          <b>{price}</b>
          {mrp ? <s>{mrp}</s> : null}
        </span>
      </div>

      <div className={styles.recoPanel}>
        <span className={styles.recoCategory}>
          {titleCase(product.category)}
        </span>
        <h3 className={styles.recoTitle}>{product.title}</h3>
        <p className={styles.recoPrice}>
          <b>{price}</b>
          {mrp ? <s>{mrp}</s> : null}
        </p>
        {facts.length ? (
          <dl className={styles.recoFacts}>
            {facts.map(([term, value]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {product.description ? (
          <p className={styles.recoDescription}>{product.description}</p>
        ) : null}
        <div className={styles.recoActions}>
          {onAsk ? (
            <button
              type="button"
              className={styles.recoAsk}
              onClick={() => onAsk(product)}
            >
              <Sparkles size={13} aria-hidden="true" /> Ask AI
            </button>
          ) : null}
          <a
            className={styles.recoView}
            href={product.href}
            aria-label={`View ${product.title}`}
          >
            View <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
};

const initialsOf = (name) =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "AQ";

// Everyone on the bill in one compact card: customer, GST profile, delivery.
const PartyCard = ({ invoice }) => {
  const name = invoice.customer_name || invoice.gst_name || "Customer";
  const gstFacts = invoice.gst
    ? [
        ["Business", invoice.gst_name || invoice.customer_name],
        ["GSTIN", invoice.gst_no || "Not available"],
        ["GST phone", invoice.gst_phone],
        ["GST email", invoice.gst_email],
        ["GST address", invoice.gst_address],
      ].filter(([, value]) => value)
    : [];

  return (
    <section className={styles.partyCard}>
      <header className={styles.partyHead}>
        <span className={styles.partyAvatar} aria-hidden="true">
          {initialsOf(name)}
        </span>
        <div>
          <small>Billed to</small>
          <h2>{name}</h2>
        </div>
        {invoice.gst ? (
          <span className={styles.partyBadge}>
            <Landmark size={12} aria-hidden="true" /> GST
          </span>
        ) : null}
      </header>

      {invoice.customer_phone || invoice.customer_email ? (
        <div className={styles.partyContacts}>
          {invoice.customer_phone ? (
            <a href={`tel:${invoice.customer_phone}`}>
              <Phone size={14} aria-hidden="true" />
              <span>{invoice.customer_phone}</span>
            </a>
          ) : null}
          {invoice.customer_email ? (
            <a href={`mailto:${invoice.customer_email}`}>
              <Mail size={14} aria-hidden="true" />
              <span>{invoice.customer_email}</span>
            </a>
          ) : null}
        </div>
      ) : null}

      {invoice.customer_address ? (
        <p className={styles.partyAddress}>
          <MapPin size={14} aria-hidden="true" />
          <span>{invoice.customer_address}</span>
        </p>
      ) : null}

      {gstFacts.length ? (
        <dl className={styles.partyFacts}>
          {gstFacts.map(([term, value]) => (
            <div
              key={term}
              className={term === "GST address" ? styles.partyFactWide : ""}
            >
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {invoice.delivered_by || invoice.delivery_date ? (
        <p className={styles.partyDelivery}>
          <Truck size={14} aria-hidden="true" />
          <span>
            Delivered
            {invoice.delivered_by ? ` by ${invoice.delivered_by}` : ""}
            {invoice.delivery_date
              ? ` · ${formatDate(invoice.delivery_date)}`
              : ""}
          </span>
        </p>
      ) : null}
    </section>
  );
};

// One step of the story: a big number, a short label and a huge headline.
// A slim step title with an optional summary on the right. The cards below
// carry the details, so nothing is repeated in a big headline.
const StoryHead = ({ id, title, meta }) => (
  <header className={styles.storyHead}>
    <h2 id={id} className={styles.storyTitle}>
      {title}
    </h2>
    {meta ? <span className={styles.storyMeta}>{meta}</span> : null}
  </header>
);

const TermCard = ({ term, index }) => {
  const Icon = term.icon;

  return (
    <article className={styles.termItem}>
      <div className={styles.termTopline}>
        <span className={styles.termIcon} aria-hidden="true">
          <Icon size={18} strokeWidth={1.7} />
        </span>
        <span className={styles.termNumber}>
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <h3>{term.title}</h3>
      <p>{term.description}</p>
    </article>
  );
};

const CustomerCareCard = ({ contact }) => (
  <article className={styles.careCard}>
    <span className={styles.careIcon} aria-hidden="true">
      <Headphones size={18} strokeWidth={1.7} />
    </span>
    <div>
      <strong>{contact.name}</strong>
      <p>{contact.description}</p>
      <a href={`tel:${contact.phone}`}>
        <Phone size={13} /> {contact.phone}
      </a>
    </div>
  </article>
);

const BankMethodCard = ({ method, copied, onCopy }) => {
  const isUpi = method.type === "upi";

  return (
    <article className={styles.bankCard}>
      <div className={styles.bankTopline}>
        <span className={styles.bankIcon} aria-hidden="true">
          {isUpi ? (
            <CreditCard size={19} strokeWidth={1.7} />
          ) : (
            <Landmark size={19} strokeWidth={1.7} />
          )}
        </span>
        <span>{isUpi ? "Digital payment" : "Bank transfer"}</span>
      </div>

      <h3>{method.name}</h3>

      <dl className={styles.bankDetails}>
        {isUpi ? (
          <>
            <div>
              <dt>Google Pay</dt>
              <dd>{method.gpay}</dd>
            </div>
            <div>
              <dt>PhonePe</dt>
              <dd>{method.phonePe}</dd>
            </div>
          </>
        ) : (
          <>
            <div>
              <dt>Account name</dt>
              <dd>{method.accountName}</dd>
            </div>
            <div>
              <dt>Account number</dt>
              <dd>{method.accountNumber}</dd>
            </div>
            <div>
              <dt>IFSC</dt>
              <dd>{method.ifsc}</dd>
            </div>
          </>
        )}
      </dl>

      <button type="button" onClick={() => onCopy(method)}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied" : "Copy payment details"}
      </button>
    </article>
  );
};

const InvoicePage = ({
  invoice,
  catalogue = null,
  statusCode = 200,
  onAccessGranted,
}) => {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadingRef = useRef(false);
  const autoDownloadChecked = useRef(false);
  const [copied, setCopied] = useState(false);
  const [copiedPayment, setCopiedPayment] = useState("");
  const [numberCopied, setNumberCopied] = useState(false);
  const {
    available: assistantAvailable,
    openAssistant,
    setAssistantContext,
  } = useAssistant();
  const hasInvoice = Boolean(invoice) && statusCode === 200;

  const recommendations = useMemo(
    () => (hasInvoice ? recommendProducts(invoice, catalogue) : []),
    [hasInvoice, invoice, catalogue],
  );

  // On this page the assistant opens as a drawer that knows the purchase:
  // questions about the products bought, plus the other products to explore.
  useEffect(() => {
    if (!hasInvoice) return undefined;
    const { name } = getDocumentKind(invoice);
    const firstName = String(invoice.customer_name || "").split(/\s+/)[0];
    setAssistantContext({
      variant: "drawer",
      subtitle: `Help with your ${name.toLowerCase()}${invoice.invoice_no ? ` ${invoice.invoice_no}` : ""}`,
      greeting: `Hi${firstName ? ` ${firstName}` : ""}! Ask me anything about the products on this ${name.toLowerCase()}: care, servicing, spares or warranty. I can also tell you what goes well with them.`,
      suggestions: ownedProductQuestions(invoice),
      productsIntro:
        "Picked to go with what you bought. Tap Ask AI to see how any of them fits your home.",
      products: recommendations.map((product) => ({
        ...product,
        question: otherProductQuestion(product, invoice),
      })),
    });
    return () => setAssistantContext(null);
  }, [hasInvoice, invoice, recommendations, setAssistantContext]);

  const downloadPdf = useCallback(async () => {
    if (!hasInvoice || downloadingRef.current) return;
    downloadingRef.current = true;
    const { name: documentName } = getDocumentKind(invoice);

    // Preserve the original tap on iOS before dynamic import/PDF generation.
    // WebKit can otherwise discard a download that starts after async work.
    const preparedTarget = preparePdfDownloadTarget();

    setIsDownloading(true);
    try {
      const { downloadPublicInvoicePdf } =
        await import("@/utils/invoice/generatePublicInvoicePdf");
      const result = await downloadPublicInvoicePdf(invoice, {
        preparedTarget,
      });
      toast.success(
        result?.mode === "viewer"
          ? `${documentName} PDF opened - use Share/Save to keep it`
          : `${documentName} PDF downloaded`,
      );
    } catch (error) {
      closePdfDownloadTarget(preparedTarget);
      console.error("Invoice PDF download failed", error);
      toast.error("PDF download failed. Please use Print instead.");
    } finally {
      downloadingRef.current = false;
      setIsDownloading(false);
    }
  }, [hasInvoice, invoice]);

  // "Login to download invoice": once that login opens the invoice, start
  // the PDF. iOS and in-app browsers need a tap to save a file, so they get
  // a one-tap prompt instead.
  const routeId = Array.isArray(router.query.id)
    ? router.query.id[0]
    : router.query.id;
  useEffect(() => {
    if (!hasInvoice || autoDownloadChecked.current) return;
    autoDownloadChecked.current = true;
    if (!consumeDownloadAfterLogin(routeId)) return;
    if (needsTapToDownloadPdf()) {
      toast("Your invoice is ready", {
        description: "Tap Download PDF to save it.",
        action: { label: "Download PDF", onClick: () => void downloadPdf() },
        duration: 20000,
      });
      return;
    }
    void downloadPdf();
  }, [downloadPdf, hasInvoice, routeId]);

  if (!hasInvoice) {
    return (
      <InvoiceError statusCode={statusCode} onAccessGranted={onAccessGranted} />
    );
  }

  const amounts = priceUtils.getInvoiceAmounts(invoice);
  // Unpaid sales read as an invoice, paid ones as a receipt.
  const { name: documentName, title: documentTitle } = getDocumentKind(invoice);
  const docStatus = getDocumentStatus(invoice);
  const isPaid = docStatus.key === "paid";
  const documentLabel = invoice.invoice_no || invoice.id || documentName;
  const unitCount = invoice.products.reduce(
    (sum, product) => sum + (Number(product.productQuantity) || 0),
    0,
  );
  const customerDisplayName =
    invoice.customer_name || invoice.gst_name || "valued customer";

  const handleDownload = downloadPdf;

  // Opens the drawer on its purchase questions; nothing is sent until the
  // customer taps a question or presses send.
  const handleAskAssistant = () => openAssistant("");
  const askAboutPurchased = (product) =>
    openAssistant(
      `I have a question about my ${shortProductName(product.productName)}: `,
    );
  const askAboutOther = (product) =>
    openAssistant(otherProductQuestion(product, invoice));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success(`${documentName} link copied`);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(`Could not copy the ${documentName.toLowerCase()} link`);
    }
  };

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(documentLabel);
      // The card footer turns green and says "Copied" for a moment.
      setNumberCopied(true);
      window.setTimeout(() => setNumberCopied(false), 2000);
    } catch {
      toast.error("Could not copy the number");
    }
  };

  const handleCopyPaymentDetails = async (method) => {
    try {
      await navigator.clipboard.writeText(bankCopyDetails[method.key]);
      setCopiedPayment(method.key);
      toast.success(`${method.name} details copied`);
      window.setTimeout(() => setCopiedPayment(""), 1800);
    } catch {
      toast.error("Could not copy the payment details");
    }
  };

  return (
    <div className={styles.page}>
      {/* A faint logo fixed in the middle of the screen, like a watermark:
          it stays visible while the page scrolls and never blocks a tap. */}
      <div className={styles.watermark} aria-hidden="true">
        <Image src={logo} alt="" width={420} height={420} />
      </div>
      <Head>
        <title>
          {documentLabel} | Aquakart {documentName}
        </title>
        <meta
          name="description"
          content={`Aquakart ${documentName.toLowerCase()} ${documentLabel}`}
        />
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta name="googlebot" content="noindex, nofollow, noarchive" />
      </Head>

      <div className={styles.ambientOne} aria-hidden="true" />
      <div className={styles.ambientTwo} aria-hidden="true" />

      <header className={styles.commandBar}>
        <Link href="/" className={styles.brand} aria-label="Aquakart home">
          {/* Liquid logo: the water rises when the brand is hovered. */}
          <span className={styles.brandMark}>
            <LiquidLogo size={42} />
          </span>
          <span>
            <strong>Aquakart</strong>
            <small>{documentName}</small>
          </span>
        </Link>

        <div className={styles.commandIdentity}>
          <span className={styles.identityBadge}>
            <BadgeCheck size={15} />
            <span className={styles.identityBadgeText}>
              Verified {documentName.toLowerCase()}
            </span>
          </span>
          <span className={styles.identityNumber} title={documentLabel}>
            <Hash size={12} aria-hidden="true" />
            {documentLabel}
          </span>
        </div>

        <div className={styles.commandActions}>
          {assistantAvailable ? (
            <button
              type="button"
              onClick={handleAskAssistant}
              className={styles.chatButton}
            >
              <span className={styles.chatIcon} aria-hidden="true">
                <MessageCircle size={15} />
                <i />
              </span>
              <span className={styles.actionLabel}>Chat with us</span>
            </button>
          ) : null}

          <div
            className={styles.actionGroup}
            role="group"
            aria-label={`Share or print this ${documentName.toLowerCase()}`}
          >
            <Link
              href="/page/find-invoice"
              className={styles.groupAction}
              title="Send by email or WhatsApp"
            >
              <Mail size={16} />
              <span className={styles.actionLabel}>Email or WhatsApp</span>
            </Link>
            <button
              type="button"
              onClick={handleCopy}
              className={styles.groupAction}
              title="Copy link"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span className={styles.actionLabel}>
                {copied ? "Copied" : "Copy link"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className={styles.groupAction}
              title="Print"
            >
              <Printer size={16} />
              <span className={styles.actionLabel}>Print</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className={styles.primaryButton}
          >
            <Download size={17} />
            {isDownloading ? "Preparing PDF…" : "Download PDF"}
          </button>
        </div>
      </header>

      <main className={styles.invoiceShell}>
        <section className={styles.invoiceHero}>
          <div className={styles.heroTop}>
            <div className={styles.heroBrand}>
              <InvoiceStamp status={docStatus} documentLabel={documentLabel} />
              <div>
                <span className={styles.eyebrow}>Premium water solutions</span>
                <h1>{documentTitle}</h1>
                <p>GSTIN 36AJOPH6387A1Z2</p>
              </div>
            </div>

            <div className={styles.heroInvoice}>
              {/* One card: label and status, the number on one line, the
                  issue date, and a footer that copies the number. */}
              <div
                className={styles.numberCard}
                style={{ "--chars": String(documentLabel).length }}
              >
                <div className={styles.numberTop}>
                  <span className={styles.numberLabel}>
                    {documentName} number
                  </span>
                  <StatusPill status={docStatus} />
                </div>
                <strong className={styles.numberValue}>{documentLabel}</strong>
                <span className={styles.numberDate}>
                  Issued {formatDate(invoice.date)}
                </span>
                <button
                  type="button"
                  className={`${styles.numberCopy} ${numberCopied ? styles.numberCopied : ""}`}
                  onClick={handleCopyNumber}
                  aria-label={
                    numberCopied
                      ? `${documentName} number copied`
                      : `Copy ${documentName.toLowerCase()} number`
                  }
                  aria-live="polite"
                >
                  {numberCopied ? (
                    <Check size={14} aria-hidden="true" />
                  ) : (
                    <Copy size={14} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* The greeting lives in the hero so it costs no extra scroll. */}
          <div className={styles.greetingCard}>
            <span className={styles.greetingIcon} aria-hidden="true">
              <Sparkles size={22} strokeWidth={1.7} />
            </span>
            <div className={styles.greetingCopy}>
              <span className={styles.eyebrow}>A note from Aquakart</span>
              <h2>Thank you, {customerDisplayName}.</h2>
              <p>
                {docStatus.key === "quotation"
                  ? "Here is your quotation. Nothing is billed until you confirm the order."
                  : isPaid
                    ? "Your payment is received and your purchase is documented. Keep this receipt for warranty and service support."
                    : `Your purchase is documented and payment is pending. Once it is paid, this ${documentName.toLowerCase()} becomes your receipt for warranty and service support.`}
              </p>
            </div>
            <div className={styles.greetingFacts}>
              <span>
                <BadgeCheck size={15} /> Verified purchase
              </span>
              <span>
                <Package size={15} /> {invoice.products.length}{" "}
                {invoice.products.length === 1 ? "product" : "products"}
              </span>
            </div>
          </div>
        </section>

        <section className={styles.metaStrip}>
          <div>
            <CalendarDays size={18} />
            <span>{documentName} date</span>
            <strong>{formatDate(invoice.date)}</strong>
          </div>
          <div>
            <CreditCard size={18} />
            <span>Payment method</span>
            <strong>{titleCase(invoice.payment_type)}</strong>
          </div>
          <div>
            <ReceiptIndianRupee size={18} />
            <span>{documentName} value</span>
            <strong>{priceUtils.formatAmount(amounts.grandTotal)}</strong>
          </div>
          <div>
            <ShieldCheck size={18} />
            <span>Tax treatment</span>
            <strong>
              {invoice.gst ? "CGST 9% + SGST 9%" : "GST 18% included"}
            </strong>
          </div>
        </section>

        <StatusLegend status={docStatus} documentName={documentName} />

        <div className={styles.story}>
          <section className={styles.storyStep} aria-labelledby="story-billed">
            <StoryHead
              id="story-billed"
              title={
                invoice.gst ? "Customer and GST details" : "Customer details"
              }
            />
            <PartyCard invoice={invoice} />
          </section>

          <section
            className={styles.storyStep}
            aria-labelledby="story-products"
          >
            <StoryHead
              id="story-products"
              title="Products, quantity and price breakup"
              meta={`${invoice.products.length} ${invoice.products.length === 1 ? "product" : "products"} · ${unitCount} ${unitCount === 1 ? "unit" : "units"}`}
            />
            <section className={styles.productsColumn}>
              <div className={styles.sectionHeading}>
                <div>
                  <span className={styles.sectionIndex}>01</span>
                  <div>
                    <span className={styles.eyebrow}>
                      {documentName} contents
                    </span>
                    <h2>Products supplied</h2>
                  </div>
                </div>
                <span className={styles.itemCount}>
                  {invoice.products.length}{" "}
                  {invoice.products.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div className={styles.lineItems}>
                {invoice.products.length ? (
                  invoice.products.map((product, index) => (
                    <ProductRow
                      key={product.id || `${product.productName}-${index}`}
                      product={product}
                      index={index}
                      grandTotal={amounts.grandTotal}
                      onAsk={assistantAvailable ? askAboutPurchased : null}
                    />
                  ))
                ) : (
                  <div className={styles.emptyProducts}>
                    <Package size={28} />
                    <div>
                      <strong>No product details available</strong>
                      <p>
                        The {documentName.toLowerCase()} total and customer
                        record are still shown.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </section>

          <section className={styles.storyStep} aria-labelledby="story-amount">
            <StoryHead
              id="story-amount"
              title={
                docStatus.key === "quotation"
                  ? "Quoted amount"
                  : isPaid
                    ? "You paid"
                    : "Amount due"
              }
              meta={priceUtils.formatAmount(amounts.grandTotal)}
            />
            <section className={styles.summaryCard}>
              <div className={styles.summaryTopline}>
                <div>
                  <small>
                    {invoice.quotation
                      ? "Sales quotation"
                      : invoice.po
                        ? "Purchase order"
                        : invoice.gst
                          ? "GST claim tax invoice"
                          : "Retail tax invoice"}
                  </small>
                  <h2>Price calculation</h2>
                </div>
                <FileText size={21} />
              </div>

              {amounts.hasDiscount ? (
                <div className={styles.discountRows}>
                  <div>
                    <span>Original price</span>
                    <strong className={styles.struckPrice}>
                      {priceUtils.formatAmount(amounts.originalTotal)}
                    </strong>
                  </div>
                  <div className={styles.discountRowSaving}>
                    <span>Discount</span>
                    <strong>
                      − {priceUtils.formatAmount(amounts.discountTotal)}
                    </strong>
                  </div>
                  <div className={styles.discountRowOffer}>
                    <span>Offer price</span>
                    <strong>
                      {priceUtils.formatAmount(amounts.grandTotal)}
                    </strong>
                  </div>
                  <p>GST below is calculated on the offer price.</p>
                </div>
              ) : null}

              <div className={styles.summaryRows}>
                <div className={styles.summaryPriceCell}>
                  <span>Base price</span>
                  <strong>{priceUtils.formatAmount(amounts.basePrice)}</strong>
                  <small>
                    {amounts.hasDiscount
                      ? "Offer price before GST"
                      : "Before applicable GST"}
                  </small>
                </div>
                <div className={styles.summaryPriceCell}>
                  <span>
                    GST <small>18%</small>
                  </span>
                  <strong>{priceUtils.formatAmount(amounts.gstValue)}</strong>
                  <small>Included in selling price</small>
                </div>
                {invoice.gst ? (
                  <div className={styles.gstBreakdown}>
                    <div>
                      <span>
                        CGST <small>9%</small>
                      </span>
                      <strong>
                        {priceUtils.formatAmount(amounts.cgstValue)}
                      </strong>
                    </div>
                    <div>
                      <span>
                        SGST <small>9%</small>
                      </span>
                      <strong>
                        {priceUtils.formatAmount(amounts.sgstValue)}
                      </strong>
                    </div>
                    <p>
                      CGST + SGST equals the complete 18% GST value shown above.
                    </p>
                  </div>
                ) : null}
              </div>

              <div className={styles.grandTotal}>
                <span>Total amount</span>
                <strong>
                  <CountUp
                    value={amounts.grandTotal}
                    format={(value) => priceUtils.formatAmount(value)}
                  />
                </strong>
                <small>
                  {amounts.hasDiscount
                    ? `You save ${priceUtils.formatAmount(amounts.discountTotal)} · `
                    : ""}
                  {invoice.gst
                    ? "Base price + 18% GST"
                    : "Base price + included GST 18%"}
                </small>
              </div>

              {/* The total in words sits right under the total amount. */}
              <div className={styles.amountWords}>
                <span>Amount in words</span>
                <strong>{priceUtils.numberToWords(amounts.grandTotal)}</strong>
              </div>

              <div className={styles.paymentState}>
                <StatusPill status={docStatus} />
                {invoice.payment_type ? (
                  <span>via {titleCase(invoice.payment_type)}</span>
                ) : null}
              </div>
            </section>
          </section>

          <section className={styles.storyStep} aria-labelledby="story-support">
            <StoryHead id="story-support" title="Warranty and support" />
            <section className={styles.legalSection}>
              <div className={styles.legalHeading}>
                <div className={styles.legalTitleGroup}>
                  <span className={styles.sectionIndex}>02</span>
                  <div>
                    <span className={styles.eyebrow}>Commercial framework</span>
                    <h2>Terms, responsibilities and service standards</h2>
                  </div>
                </div>
                <p>
                  These terms form part of this invoice and clarify the
                  delivery, installation, payment and after-sales
                  responsibilities associated with the supplied products.
                </p>
              </div>

              <div className={styles.termsGrid}>
                {termsAndConditions.map((term, index) => (
                  <TermCard key={term.title} term={term} index={index} />
                ))}
              </div>

              <div className={styles.serviceAssurance}>
                <div>
                  <ShieldCheck size={23} strokeWidth={1.7} />
                  <div>
                    <span>Service assurance</span>
                    <strong>Protected by Aquakart support standards</strong>
                  </div>
                </div>
                <p>
                  Retain this invoice for installation verification, warranty
                  registration, service coordination and eligible replacement
                  requests.
                </p>
              </div>

              <div className={styles.careSection}>
                <div className={styles.careHeading}>
                  <div>
                    <span className={styles.eyebrow}>
                      Manufacturer assistance
                    </span>
                    <h3>Customer-care directory</h3>
                  </div>
                  <span>Direct product support</span>
                </div>
                <div className={styles.careGrid}>
                  {customerCare.map((contact) => (
                    <CustomerCareCard key={contact.name} contact={contact} />
                  ))}
                </div>
              </div>
            </section>
          </section>

          {invoice.po ? (
            <section className={styles.storyStep} aria-labelledby="story-pay">
              <StoryHead id="story-pay" title="How to pay" />
              <section className={styles.paymentInstructions}>
                <div className={styles.paymentHeading}>
                  <div className={styles.paymentTitleGroup}>
                    <span className={styles.paymentIndex}>03</span>
                    <div>
                      <span className={styles.eyebrow}>
                        Purchase-order payment
                      </span>
                      <h2>Approved remittance details</h2>
                    </div>
                  </div>
                  <p>
                    Use the invoice number as the payment reference and share
                    the remittance confirmation with Aquakart for allocation.
                  </p>
                </div>

                <div className={styles.bankGrid}>
                  {bankPaymentMethods.map((method) => (
                    <BankMethodCard
                      key={method.key}
                      method={method}
                      copied={copiedPayment === method.key}
                      onCopy={handleCopyPaymentDetails}
                    />
                  ))}
                </div>

                <div className={styles.paymentNotice}>
                  <BadgeCheck size={18} />
                  <p>
                    Payment instructions are displayed because this invoice is
                    linked to a purchase order. Please verify the beneficiary
                    name, account number and IFSC before initiating a transfer.
                  </p>
                </div>
              </section>
            </section>
          ) : null}
        </div>

        {assistantAvailable ? (
          <InvoiceAiPanel
            invoice={invoice}
            status={docStatus}
            amounts={amounts}
            documentName={documentName}
            openAssistant={openAssistant}
          />
        ) : null}

        {recommendations.length ? (
          <section
            className={styles.recoSection}
            aria-labelledby="invoice-recommendations"
          >
            <div className={styles.recoHeading}>
              <div>
                <span className={styles.recoIcon} aria-hidden="true">
                  <ShoppingBag size={18} />
                </span>
                <div>
                  <span className={styles.eyebrow}>Picked for your home</span>
                  <h2 id="invoice-recommendations">
                    Goes well with your purchase
                  </h2>
                </div>
              </div>
              {assistantAvailable ? (
                <button
                  type="button"
                  className={styles.askButton}
                  onClick={() => openAssistant("", { tab: "products" })}
                >
                  <Sparkles size={13} aria-hidden="true" /> Compare with AI
                </button>
              ) : null}
            </div>
            <ScrollRail
              label="Recommended products"
              count={recommendations.length}
            >
              {recommendations.map((product) => (
                <RecommendationCard
                  key={product.id}
                  product={product}
                  onAsk={assistantAvailable ? askAboutOther : null}
                />
              ))}
            </ScrollRail>
          </section>
        ) : null}

        <footer className={styles.invoiceFooter}>
          <div>
            <strong>Thank you for choosing Aquakart.</strong>
            <span>support@aquakart.co.in · +91 90147 74667</span>
          </div>
          <p>
            This is a computer-generated {documentName.toLowerCase()} and does
            not require a signature.
          </p>
        </footer>
      </main>

      <div className={styles.mobileDownloadBar} data-invoice-mobile-bar>
        <div>
          <span>
            {isPaid
              ? "Amount paid"
              : docStatus.key === "quotation"
                ? "Quoted amount"
                : "Amount due"}
          </span>
          <strong>
            {priceUtils.formatAmount(amounts.grandTotal, { showPaise: false })}
          </strong>
        </div>
        {/* Chat lives in this bar on phones instead of a floating button over the page. */}
        {assistantAvailable ? (
          <button
            type="button"
            onClick={handleAskAssistant}
            className={styles.mobileChat}
            aria-label="Chat with us"
          >
            <MessageCircle size={18} />
            <i aria-hidden="true" />
          </button>
        ) : null}
        <button type="button" onClick={handleDownload} disabled={isDownloading}>
          <Download size={18} /> {isDownloading ? "Preparing…" : "PDF"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          aria-label="Print"
          className={styles.mobileIconButton}
        >
          <Printer size={18} />
        </button>
      </div>
    </div>
  );
};

export default InvoicePage;
