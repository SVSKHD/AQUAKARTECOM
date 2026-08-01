import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Loader2,
  LogIn,
  Phone,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import AquaLayout from "@/components/Layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { getCurrentFirebaseIdToken } from "@/services/googleAuth";
import InvoiceServiceOperations, {
  normalizeInvoicePhone,
} from "@/services/invoice";
import styles from "@/styles/find-invoice.module.css";

const FindInvoicePage = () => {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
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

  const handleGoogleAccess = async () => {
    if (status === "authenticating") return;
    setStatus("authenticating");
    setMessage("");
    try {
      await signInWithGoogle();
      const firebaseIdToken = await getCurrentFirebaseIdToken();
      const payload = await InvoiceServiceOperations.loginInvoiceAccess(
        phone,
        firebaseIdToken,
      );
      const destination = payload.redirectInvoiceId
        ? `/invoice/${payload.redirectInvoiceId}`
        : "/invoices";
      await router.push(destination);
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "We could not verify your Google account. Please try again.",
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
                privacy, Google login is required before any invoice details can
                be opened.
              </p>
              <div className={styles.trustNote}>
                <ShieldCheck size={18} />
                <span>
                  Firebase verifies your Google identity. Aquakart remains the
                  owner of invoice access and purchase records.
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

              {["found", "authenticating"].includes(status) ? (
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
                    <LogIn size={24} />
                    <div>
                      <strong>Log in to open your invoice</strong>
                      <p>
                        Continue with Google to verify your identity. We’ll use
                        your verified name and email to complete any missing
                        invoice customer details.
                      </p>
                    </div>
                  </div>
                  {message ? (
                    <p className={styles.formError}>{message}</p>
                  ) : null}
                  <button
                    className={styles.emailButton}
                    type="button"
                    onClick={handleGoogleAccess}
                    disabled={status === "authenticating"}
                  >
                    {status === "authenticating" ? (
                      <>
                        <Loader2 className={styles.spinner} size={18} />{" "}
                        Verifying with Google...
                      </>
                    ) : (
                      <>
                        <LogIn size={17} /> Continue with Google
                      </>
                    )}
                  </button>
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

export const getServerSideProps = async () => ({
  redirect: { destination: "/page/find-invoice", permanent: false },
});

export default FindInvoicePage;
