import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  Copy,
  CreditCard,
  Download,
  FileText,
  Hash,
  Landmark,
  Mail,
  MapPin,
  Package,
  Phone,
  Printer,
  ReceiptIndianRupee,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assests/logo.png";
import priceUtils from "@/utils/priceUtils";
import styles from "@/styles/invoice.module.css";

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const titleCase = (value) =>
  String(value || "Not available")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const DetailLine = ({ icon: Icon, label, value }) => {
  if (!value) return null;

  return (
    <div className={styles.detailLine}>
      <span className={styles.detailIcon} aria-hidden="true">
        <Icon size={16} strokeWidth={1.8} />
      </span>
      <div>
        <span className={styles.detailLabel}>{label}</span>
        <span className={styles.detailValue}>{value}</span>
      </div>
    </div>
  );
};

const StatusPill = ({ status }) => {
  const isPaid = ["paid", "completed", "success"].includes(
    String(status).toLowerCase(),
  );

  return (
    <span
      className={`${styles.statusPill} ${isPaid ? styles.statusPaid : styles.statusPending}`}
    >
      <span className={styles.statusDot} />
      {titleCase(status)}
    </span>
  );
};

const InvoiceError = ({ statusCode }) => {
  const notFound = statusCode === 404;

  return (
    <div className={styles.errorPage}>
      <Head>
        <title>
          {notFound ? "Invoice not found" : "Invoice unavailable"} | Aquakart
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
          {notFound
            ? "We could not find that invoice."
            : "The invoice is taking a pause."}
        </h1>
        <p>
          {notFound
            ? "Check the invoice link and try again. The ID may be incomplete or no longer available."
            : "We could not reach the invoice service. Please wait a moment and try again."}
        </p>
        <div className={styles.errorActions}>
          <button type="button" onClick={() => window.location.reload()}>
            Try again
          </button>
          <Link href="/">
            <ArrowLeft size={16} /> Back to Aquakart
          </Link>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, index }) => {
  const lineTotal = product.productPrice * product.productQuantity;

  return (
    <article className={styles.productCard}>
      <div className={styles.productVisual}>
        {product.productImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.productImage} alt="" />
        ) : (
          <>
            <span className={styles.productNumber}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <Package size={30} strokeWidth={1.45} aria-hidden="true" />
          </>
        )}
      </div>

      <div className={styles.productContent}>
        <div className={styles.productHeading}>
          <div>
            <span className={styles.productKicker}>Aquakart selection</span>
            <h3>{product.productName}</h3>
          </div>
          <span className={styles.quantityPill}>
            {product.productQuantity}{" "}
            {product.productQuantity === 1 ? "unit" : "units"}
          </span>
        </div>

        {product.productSerialNo ? (
          <div className={styles.serialNumber}>
            <Hash size={13} /> Serial {product.productSerialNo}
          </div>
        ) : null}

        <div className={styles.productPriceRow}>
          <div>
            <span>Unit price</span>
            <strong>{priceUtils.formatAmount(product.productPrice)}</strong>
          </div>
          <span className={styles.multiply}>× {product.productQuantity}</span>
          <div className={styles.lineTotal}>
            <span>Line total</span>
            <strong>{priceUtils.formatAmount(lineTotal)}</strong>
          </div>
        </div>
      </div>
    </article>
  );
};

const InvoicePage = ({ invoice, statusCode = 200 }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!invoice || statusCode !== 200) {
    return <InvoiceError statusCode={statusCode} />;
  }

  const amounts = priceUtils.getInvoiceAmounts(invoice);
  const invoiceLabel = invoice.invoice_no || invoice.id || "Invoice";

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const { downloadPublicInvoicePdf } =
        await import("@/utils/invoice/generatePublicInvoicePdf");
      await downloadPublicInvoicePdf(invoice);
      toast.success("Invoice PDF downloaded");
    } catch (error) {
      console.error("Invoice PDF download failed", error);
      toast.error("PDF download failed. Please use Print instead.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Invoice link copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy the invoice link");
    }
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>{invoiceLabel} | Aquakart Invoice</title>
        <meta name="description" content={`Aquakart invoice ${invoiceLabel}`} />
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta name="googlebot" content="noindex, nofollow, noarchive" />
      </Head>

      <div className={styles.ambientOne} aria-hidden="true" />
      <div className={styles.ambientTwo} aria-hidden="true" />

      <header className={styles.commandBar}>
        <Link href="/" className={styles.brand} aria-label="Aquakart home">
          <span className={styles.brandMark}>
            <Image src={logo} alt="" width={40} height={40} priority />
          </span>
          <span>
            <strong>Aquakart</strong>
            <small>Invoice studio</small>
          </span>
        </Link>

        <div className={styles.commandIdentity}>
          <BadgeCheck size={17} /> Verified invoice
          <span>{invoiceLabel}</span>
        </div>

        <div className={styles.commandActions}>
          <button
            type="button"
            onClick={handleCopy}
            className={styles.secondaryButton}
          >
            {copied ? <Check size={17} /> : <Copy size={17} />}
            <span>{copied ? "Copied" : "Copy link"}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className={styles.secondaryButton}
          >
            <Printer size={17} /> <span>Print</span>
          </button>
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
          <div className={styles.heroBrand}>
            <div className={styles.heroLogo}>
              <Image
                src={logo}
                alt="Aquakart"
                width={64}
                height={64}
                priority
              />
            </div>
            <div>
              <span className={styles.eyebrow}>Premium water solutions</span>
              <h1>Tax Invoice</h1>
              <p>GSTIN 36AJOPH6387A1Z2</p>
            </div>
          </div>

          <div className={styles.heroInvoice}>
            <StatusPill status={invoice.paid_status} />
            <span>Invoice number</span>
            <strong>{invoiceLabel}</strong>
            <small>Issued {formatDate(invoice.date)}</small>
          </div>
        </section>

        <section className={styles.metaStrip}>
          <div>
            <CalendarDays size={18} />
            <span>Invoice date</span>
            <strong>{formatDate(invoice.date)}</strong>
          </div>
          <div>
            <CreditCard size={18} />
            <span>Payment method</span>
            <strong>{titleCase(invoice.payment_type)}</strong>
          </div>
          <div>
            <ReceiptIndianRupee size={18} />
            <span>Invoice value</span>
            <strong>{priceUtils.formatAmount(amounts.grandTotal)}</strong>
          </div>
          <div>
            <ShieldCheck size={18} />
            <span>Tax treatment</span>
            <strong>{invoice.gst ? "CGST + SGST" : "Non-GST"}</strong>
          </div>
        </section>

        <div className={styles.invoiceGrid}>
          <section className={styles.productsColumn}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionIndex}>01</span>
                <div>
                  <span className={styles.eyebrow}>Invoice contents</span>
                  <h2>Products supplied</h2>
                </div>
              </div>
              <span className={styles.itemCount}>
                {invoice.products.length}{" "}
                {invoice.products.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className={styles.productList}>
              {invoice.products.length ? (
                invoice.products.map((product, index) => (
                  <ProductCard
                    key={product.id || `${product.productName}-${index}`}
                    product={product}
                    index={index}
                  />
                ))
              ) : (
                <div className={styles.emptyProducts}>
                  <Package size={28} />
                  <div>
                    <strong>No product details available</strong>
                    <p>
                      The invoice total and customer record are still shown.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.amountWords}>
              <span>Amount in words</span>
              <strong>{priceUtils.numberToWords(amounts.grandTotal)}</strong>
            </div>

            <div className={styles.termsCard}>
              <ShieldCheck size={22} />
              <div>
                <strong>Protected by Aquakart service standards</strong>
                <p>
                  Warranty follows the manufacturer policy. Installation,
                  transport and lifting are chargeable unless agreed separately.
                  Opened or used products are not returnable.
                </p>
              </div>
            </div>
          </section>

          <aside className={styles.detailsRail}>
            <section className={styles.detailCard}>
              <div className={styles.cardHeading}>
                <span>
                  <UserRound size={18} />
                </span>
                <div>
                  <small>Bill to</small>
                  <h2>Customer details</h2>
                </div>
              </div>
              <DetailLine
                icon={UserRound}
                label="Customer"
                value={invoice.customer_name || "Not available"}
              />
              <DetailLine
                icon={Phone}
                label="Phone"
                value={invoice.customer_phone}
              />
              <DetailLine
                icon={Mail}
                label="Email"
                value={invoice.customer_email}
              />
              <DetailLine
                icon={MapPin}
                label="Billing address"
                value={invoice.customer_address}
              />
            </section>

            {invoice.gst ? (
              <section className={`${styles.detailCard} ${styles.gstCard}`}>
                <div className={styles.cardHeading}>
                  <span>
                    <Landmark size={18} />
                  </span>
                  <div>
                    <small>Registered profile</small>
                    <h2>GST details</h2>
                  </div>
                </div>
                <DetailLine
                  icon={Landmark}
                  label="Business name"
                  value={invoice.gst_name || invoice.customer_name}
                />
                <DetailLine
                  icon={Hash}
                  label="GSTIN"
                  value={invoice.gst_no || "Not available"}
                />
                <DetailLine
                  icon={Phone}
                  label="GST phone"
                  value={invoice.gst_phone}
                />
                <DetailLine
                  icon={Mail}
                  label="GST email"
                  value={invoice.gst_email}
                />
                <DetailLine
                  icon={MapPin}
                  label="GST address"
                  value={invoice.gst_address}
                />
              </section>
            ) : null}

            {invoice.delivered_by || invoice.delivery_date ? (
              <section className={styles.detailCard}>
                <div className={styles.cardHeading}>
                  <span>
                    <Truck size={18} />
                  </span>
                  <div>
                    <small>Fulfilment</small>
                    <h2>Delivery record</h2>
                  </div>
                </div>
                <DetailLine
                  icon={Truck}
                  label="Delivered by"
                  value={invoice.delivered_by}
                />
                <DetailLine
                  icon={CalendarDays}
                  label="Delivery date"
                  value={formatDate(invoice.delivery_date)}
                />
              </section>
            ) : null}

            <section className={styles.summaryCard}>
              <div className={styles.summaryTopline}>
                <div>
                  <small>Payment summary</small>
                  <h2>Invoice total</h2>
                </div>
                <FileText size={21} />
              </div>

              <div className={styles.summaryRows}>
                <div>
                  <span>{invoice.gst ? "Taxable value" : "Subtotal"}</span>
                  <strong>{priceUtils.formatAmount(amounts.basePrice)}</strong>
                </div>
                {invoice.gst ? (
                  <>
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
                  </>
                ) : null}
              </div>

              <div className={styles.grandTotal}>
                <span>Total amount</span>
                <strong>{priceUtils.formatAmount(amounts.grandTotal)}</strong>
                <small>Inclusive of applicable taxes</small>
              </div>

              <div className={styles.paymentState}>
                <StatusPill status={invoice.paid_status} />
                <span>via {titleCase(invoice.payment_type)}</span>
              </div>
            </section>
          </aside>
        </div>

        <footer className={styles.invoiceFooter}>
          <div>
            <strong>Thank you for choosing Aquakart.</strong>
            <span>support@aquakart.co.in · +91 90147 74667</span>
          </div>
          <p>
            This is a computer-generated invoice and does not require a
            signature.
          </p>
        </footer>
      </main>

      <div className={styles.mobileDownloadBar}>
        <div>
          <span>Invoice total</span>
          <strong>
            {priceUtils.formatAmount(amounts.grandTotal, { showPaise: false })}
          </strong>
        </div>
        <button type="button" onClick={handleDownload} disabled={isDownloading}>
          <Download size={18} /> {isDownloading ? "Preparing…" : "PDF"}
        </button>
        <button type="button" onClick={() => window.print()}>
          <Printer size={18} /> Print
        </button>
      </div>
    </div>
  );
};

export default InvoicePage;
