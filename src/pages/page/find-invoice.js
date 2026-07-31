import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileSearch,
  Loader2,
  Package,
  Phone,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import AquaLayout from "@/components/Layout/Layout";
import InvoiceServiceOperations from "@/services/invoice";
import styles from "@/styles/find-invoice.module.css";

const normalizePhone = (value = "") => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits.slice(0, 10);
};

const formatDate = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const titleCase = (value = "") =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const FindInvoicePage = () => {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("idle");
  const [purchases, setPurchases] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const isValidPhone = /^[6-9]\d{9}$/.test(phone);

  const handleLookup = async (event) => {
    event.preventDefault();
    if (!isValidPhone || status === "loading") return;

    setStatus("loading");
    setMessage("");
    setSelectedInvoice(null);

    try {
      const result = await InvoiceServiceOperations.findInvoicesByPhone(phone);
      setPurchases(result.purchases || []);
      setMessage(result.message || "");
      setStatus(result.found ? "found" : "empty");
    } catch (error) {
      setPurchases([]);
      setMessage(
        error?.response?.data?.message ||
          "We could not check your purchases right now. Please try again.",
      );
      setStatus("error");
    }
  };

  const resetLookup = () => {
    setPhone("");
    setPurchases([]);
    setMessage("");
    setSelectedInvoice(null);
    setStatus("idle");
  };

  const seo = {
    title: "Find My Invoice | Aquakart",
    description:
      "Find and securely view your Aquakart purchase invoice using your customer phone number.",
    canonical: `${process.env.NEXT_PUBLIC_URL || "https://aquakart.co.in"}/page/find-invoice`,
  };

  return (
    <AquaLayout seo={seo}>
      <Head>
        <meta name="robots" content="noindex, nofollow, noarchive" />
      </Head>
      <main className={styles.page}>
        <div className={styles.shell}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={15} /> Back to Aquakart
          </Link>

          <section className={styles.lookupCard}>
            <div className={styles.intro}>
              <span className={styles.iconBox}>
                <ReceiptText size={27} />
              </span>
              <span className={styles.eyebrow}>Aquakart invoices</span>
              <h1>Find your purchase invoice.</h1>
              <p>
                Enter the mobile number used for your Aquakart purchase. We’ll
                check whether an invoice is available before showing it.
              </p>

              <div className={styles.trustNote}>
                <ShieldCheck size={18} />
                <span>
                  Your phone number is used only to locate matching Aquakart
                  purchases.
                </span>
              </div>
            </div>

            <div className={styles.interaction}>
              {status === "idle" ||
              status === "loading" ||
              status === "error" ? (
                <form onSubmit={handleLookup} className={styles.phoneForm}>
                  <label htmlFor="invoice-phone">Customer phone number</label>
                  <div className={styles.phoneInput}>
                    <span>+91</span>
                    <Phone size={18} />
                    <input
                      id="invoice-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) =>
                        setPhone(normalizePhone(event.target.value))
                      }
                      placeholder="98765 43210"
                      aria-describedby="phone-help"
                    />
                  </div>
                  <small id="phone-help">
                    Use the same 10-digit number given at purchase or checkout.
                  </small>

                  {status === "error" ? (
                    <p className={styles.formError}>{message}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={!isValidPhone || status === "loading"}
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className={styles.spinner} size={18} />
                        Checking purchases...
                      </>
                    ) : (
                      <>
                        Find my invoice <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </form>
              ) : null}

              {status === "empty" ? (
                <div className={styles.resultState}>
                  <span className={styles.resultIcon}>
                    <FileSearch size={30} />
                  </span>
                  <span className={styles.eyebrow}>No invoice found</span>
                  <h2>You have no purchases yet.</h2>
                  <p>
                    We couldn’t find an Aquakart invoice for +91 {phone}. Check
                    the number or explore our water solutions.
                  </p>
                  <div className={styles.resultActions}>
                    <button type="button" onClick={resetLookup}>
                      <RotateCcw size={15} /> Try another number
                    </button>
                    <Link href="/shop">Explore products</Link>
                  </div>
                </div>
              ) : null}

              {status === "found" ? (
                <div className={styles.foundState}>
                  <div className={styles.foundHeading}>
                    <CheckCircle2 size={23} />
                    <div>
                      <span className={styles.eyebrow}>Purchase found</span>
                      <h2>{message}</h2>
                    </div>
                  </div>

                  <div className={styles.purchaseList}>
                    {purchases.map((purchase) => (
                      <article
                        key={purchase.id}
                        className={styles.purchaseCard}
                      >
                        <div className={styles.purchaseTopline}>
                          <span>
                            <ReceiptText size={15} /> {purchase.invoiceNo}
                          </span>
                          <span>{titleCase(purchase.paidStatus)}</span>
                        </div>
                        <div className={styles.purchaseMeta}>
                          <span>
                            <CalendarDays size={14} />{" "}
                            {formatDate(purchase.date)}
                          </span>
                          <span>
                            <Package size={14} /> {purchase.itemCount || 0}{" "}
                            {purchase.itemCount === 1 ? "item" : "items"}
                          </span>
                        </div>

                        {selectedInvoice?.id === purchase.id ? (
                          <div className={styles.confirmation}>
                            <p>Would you like to view this invoice?</p>
                            <div>
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(`/invoice/${purchase.id}`)
                                }
                              >
                                Yes, view invoice <ArrowRight size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedInvoice(null)}
                              >
                                Not now
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={styles.selectButton}
                            onClick={() => setSelectedInvoice(purchase)}
                          >
                            Select invoice <ArrowRight size={15} />
                          </button>
                        )}
                      </article>
                    ))}
                  </div>

                  <button
                    type="button"
                    className={styles.resetButton}
                    onClick={resetLookup}
                  >
                    <RotateCcw size={14} /> Search another phone number
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </AquaLayout>
  );
};

export default FindInvoicePage;
