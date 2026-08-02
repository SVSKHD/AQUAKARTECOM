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
  ExternalLink,
  FileText,
  Hash,
  Headphones,
  Landmark,
  Link2,
  Mail,
  MapPin,
  Package,
  Phone,
  Printer,
  ReceiptIndianRupee,
  ShieldCheck,
  Sparkles,
  Tags,
  Truck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assests/logo.png";
import {
  bankCopyDetails,
  bankPaymentMethods,
  customerCare,
  termsAndConditions,
} from "@/constants/invoiceStaticData";
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
  const unauthorized = statusCode === 401 || statusCode === 403;

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
            ? "Secure access is required."
            : notFound
              ? "We could not find that invoice."
              : "The invoice is taking a pause."}
        </h1>
        <p>
          {unauthorized
            ? "Continue with Google and confirm the phone number attached to your purchase."
            : notFound
              ? "Check the invoice link and try again. The ID may be incomplete or no longer available."
              : "We could not reach the invoice service. Please wait a moment and try again."}
        </p>
        <div className={styles.errorActions}>
          {unauthorized ? (
            <Link href="/page/find-invoice">Find my invoices</Link>
          ) : (
            <button type="button" onClick={() => window.location.reload()}>
              Try again
            </button>
          )}
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
      <div className={styles.productShowcase}>
        <div className={styles.productVisual}>
          <span className={styles.productNumber}>
            {String(index + 1).padStart(2, "0")}
          </span>
          {product.productImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.productImage} alt={product.productName} />
          ) : (
            <Package size={44} strokeWidth={1.35} aria-hidden="true" />
          )}
        </div>

        <div className={styles.productIdentity}>
          <span className={styles.productKicker}>Aquakart selection</span>
          <h3>{product.productName}</h3>
          {product.productCategory || product.productSubcategory ? (
            <div className={styles.productTags}>
              {product.productCategory ? (
                <span>
                  <Tags size={11} aria-hidden="true" />
                  {product.productCategory}
                </span>
              ) : null}
              {product.productSubcategory ? (
                <span>{product.productSubcategory}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles.productContent}>
        <div className={styles.productTopline}>
          <div>
            <span>Line item</span>
            <strong>{String(index + 1).padStart(2, "0")}</strong>
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
            <small>per supplied unit</small>
          </div>
          <div>
            <span>Quantity</span>
            <strong>× {product.productQuantity}</strong>
            <small>confirmed quantity</small>
          </div>
          <div className={styles.lineTotal}>
            <span>Line total</span>
            <strong>{priceUtils.formatAmount(lineTotal)}</strong>
            <small>invoice contribution</small>
          </div>
        </div>

        <div className={styles.productCalculationNote}>
          <ReceiptIndianRupee size={15} aria-hidden="true" />
          Unit price × confirmed quantity equals this line total.
        </div>
      </div>
    </article>
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

const ProductGallery = ({ products }) => {
  const copyProductLink = async (product) => {
    const href = getProductHref(product);
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

  return (
    <aside className={styles.productGallery} aria-label="Invoice products">
      <div className={styles.galleryTrack}>
        {products.map((product, index) => {
          const href = getProductHref(product);
          return (
            <article
              key={product.id || `${product.productName}-${index}`}
              className={styles.galleryItem}
            >
              <a
                href={href || undefined}
                target={href ? "_blank" : undefined}
                rel={href ? "noreferrer" : undefined}
                aria-label={
                  href
                    ? `Open ${product.productName}`
                    : `${product.productName} has no product page`
                }
                className={!href ? styles.galleryLinkDisabled : ""}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {product.productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.productImage} alt={product.productName} />
                ) : (
                  <Package size={25} />
                )}
              </a>
              <button
                type="button"
                onClick={() => copyProductLink(product)}
                aria-label={`Copy ${product.productName} link`}
              >
                <Link2 size={12} />
              </button>
            </article>
          );
        })}
      </div>
      <span className={styles.galleryHint}>
        <ExternalLink size={11} /> Open product
      </span>
    </aside>
  );
};

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

const InvoicePage = ({ invoice, statusCode = 200 }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedPayment, setCopiedPayment] = useState("");

  if (!invoice || statusCode !== 200) {
    return <InvoiceError statusCode={statusCode} />;
  }

  const amounts = priceUtils.getInvoiceAmounts(invoice);
  const invoiceLabel = invoice.invoice_no || invoice.id || "Invoice";
  const customerDisplayName =
    invoice.customer_name || invoice.gst_name || "valued customer";

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
          <Link href="/page/find-invoice" className={styles.secondaryButton}>
            <Mail size={17} />
            <span>Email or WhatsApp</span>
          </Link>
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
              <h1>{invoice.gst ? "GST Tax Invoice" : "Retail Tax Invoice"}</h1>
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
            <strong>
              {invoice.gst ? "CGST 9% + SGST 9%" : "GST 18% included"}
            </strong>
          </div>
        </section>

        <section className={styles.greetingCard}>
          <span className={styles.greetingIcon} aria-hidden="true">
            <Sparkles size={25} strokeWidth={1.7} />
          </span>
          <div className={styles.greetingCopy}>
            <span className={styles.eyebrow}>A note from Aquakart</span>
            <h2>Thank you, {customerDisplayName}.</h2>
            <p>
              Your purchase is documented, protected and ready whenever you need
              it. Keep this invoice for warranty and service support.
            </p>
          </div>
          <div className={styles.greetingFacts}>
            <span>
              <BadgeCheck size={16} /> Verified purchase
            </span>
            <span>
              <Package size={16} /> {invoice.products.length}{" "}
              {invoice.products.length === 1 ? "product" : "products"}
            </span>
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

            <div className={styles.productsExperience}>
              {invoice.products.length ? (
                <ProductGallery products={invoice.products} />
              ) : null}
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
            </div>

            <div className={styles.amountWords}>
              <span>Amount in words</span>
              <strong>{priceUtils.numberToWords(amounts.grandTotal)}</strong>
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
                  <small>
                    {invoice.gst
                      ? "GST claim tax invoice"
                      : "Retail tax invoice"}
                  </small>
                  <h2>Price calculation</h2>
                </div>
                <FileText size={21} />
              </div>

              <div className={styles.summaryRows}>
                <div className={styles.summaryPriceCell}>
                  <span>Base price</span>
                  <strong>{priceUtils.formatAmount(amounts.basePrice)}</strong>
                  <small>Before applicable GST</small>
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
                <strong>{priceUtils.formatAmount(amounts.grandTotal)}</strong>
                <small>
                  {invoice.gst
                    ? "Base price + 18% GST"
                    : "Base price + included GST 18%"}
                </small>
              </div>

              <div className={styles.paymentState}>
                <StatusPill status={invoice.paid_status} />
                <span>via {titleCase(invoice.payment_type)}</span>
              </div>
            </section>
          </aside>
        </div>

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
              These terms form part of this invoice and clarify the delivery,
              installation, payment and after-sales responsibilities associated
              with the supplied products.
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
                <span className={styles.eyebrow}>Manufacturer assistance</span>
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

        {invoice.po ? (
          <section className={styles.paymentInstructions}>
            <div className={styles.paymentHeading}>
              <div className={styles.paymentTitleGroup}>
                <span className={styles.paymentIndex}>03</span>
                <div>
                  <span className={styles.eyebrow}>Purchase-order payment</span>
                  <h2>Approved remittance details</h2>
                </div>
              </div>
              <p>
                Use the invoice number as the payment reference and share the
                remittance confirmation with Aquakart for allocation.
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
                linked to a purchase order. Please verify the beneficiary name,
                account number and IFSC before initiating a transfer.
              </p>
            </div>
          </section>
        ) : null}

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
