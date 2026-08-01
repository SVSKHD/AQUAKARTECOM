import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Loader2,
  Mail,
  Phone,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import AquaLayout from "@/components/Layout/Layout";
import InvoiceServiceOperations, {
  normalizeInvoicePhone,
} from "@/services/invoice";
import styles from "@/styles/find-invoice.module.css";

const FindInvoicePage = () => {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  const isValidPhone = /^[6-9]\d{9}$/.test(phone);

  const handleLookup = async (event) => {
    event.preventDefault();
    if (!isValidPhone || status === "loading") return;

    setStatus("loading");
    setMessage("");
    try {
      const payload = await InvoiceServiceOperations.lookupInvoices(phone);
      setResult(payload);
      setMessage(payload.message || "");
      setStatus(payload.found ? "found" : "empty");
    } catch (error) {
      setResult(null);
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "We could not check your purchases right now. Please try again.",
      );
      setStatus("error");
    }
  };

  const handleEmail = async () => {
    if (status === "sending") return;
    setStatus("sending");
    setMessage("");
    try {
      const payload =
        await InvoiceServiceOperations.requestInvoiceAccess(phone);
      setMessage(
        payload.message ||
          "Your secure invoice link is on its way. Please check your email.",
      );
      setStatus("sent");
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          "We could not send the secure link. Please try again.",
      );
      setStatus("found");
    }
  };

  const resetLookup = () => {
    setPhone("");
    setResult(null);
    setMessage("");
    setStatus("idle");
  };

  const seo = {
    title: "Find My Invoice | Aquakart",
    description:
      "Find and securely view your Aquakart purchase invoices using your customer phone number.",
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
                Enter the mobile number used for your purchase. For your
                privacy, we’ll email a secure link instead of displaying order
                details publicly.
              </p>
              <div className={styles.trustNote}>
                <ShieldCheck size={18} />
                <span>
                  Your invoice details remain protected and links expire
                  automatically.
                </span>
              </div>
            </div>

            <div className={styles.interaction}>
              {["idle", "loading", "error"].includes(status) ? (
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
                        setPhone(normalizeInvoicePhone(event.target.value))
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
                        <Loader2 className={styles.spinner} size={18} />{" "}
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
                    {message ||
                      `We couldn’t find an Aquakart invoice for +91 ${phone}.`}
                  </p>
                  <div className={styles.resultActions}>
                    <button type="button" onClick={resetLookup}>
                      <RotateCcw size={15} /> Try another number
                    </button>
                    <Link href="/shop">Explore products</Link>
                  </div>
                </div>
              ) : null}

              {["found", "sending"].includes(status) ? (
                <div className={styles.foundState}>
                  <div className={styles.foundHeading}>
                    <CheckCircle2 size={25} />
                    <div>
                      <span className={styles.eyebrow}>Purchase found</span>
                      <h2>
                        {result?.invoiceCount || 0} invoice
                        {result?.invoiceCount === 1 ? "" : "s"} available
                      </h2>
                    </div>
                  </div>
                  <div className={styles.emailPanel}>
                    <Mail size={24} />
                    <div>
                      <strong>Send a secure viewing link</strong>
                      <p>
                        {result?.canEmail
                          ? `We’ll send it to ${result.maskedEmail}. The link is private and expires automatically.`
                          : "This purchase has no email address attached. Please contact Aquakart support to update your details."}
                      </p>
                    </div>
                  </div>
                  {message ? (
                    <p className={styles.formError}>{message}</p>
                  ) : null}
                  {result?.canEmail ? (
                    <button
                      className={styles.emailButton}
                      type="button"
                      onClick={handleEmail}
                      disabled={status === "sending"}
                    >
                      {status === "sending" ? (
                        <>
                          <Loader2 className={styles.spinner} size={18} />{" "}
                          Sending secure link...
                        </>
                      ) : (
                        <>
                          <Mail size={17} /> Email my invoice link
                        </>
                      )}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={styles.resetButton}
                    onClick={resetLookup}
                  >
                    <RotateCcw size={14} /> Search another phone number
                  </button>
                </div>
              ) : null}

              {status === "sent" ? (
                <div className={styles.resultState}>
                  <span className={styles.resultIcon}>
                    <Mail size={30} />
                  </span>
                  <span className={styles.eyebrow}>Email sent</span>
                  <h2>Check your inbox.</h2>
                  <p>{message}</p>
                  <div className={styles.resultActions}>
                    <button type="button" onClick={handleEmail}>
                      <Mail size={15} /> Send again
                    </button>
                    <button type="button" onClick={resetLookup}>
                      <RotateCcw size={15} /> Another number
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </AquaLayout>
  );
};

export const getServerSideProps = async () => ({
  redirect: { destination: "/page/find-invoice", permanent: false },
});

export default FindInvoicePage;
