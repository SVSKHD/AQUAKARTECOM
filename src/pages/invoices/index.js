import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  FileSearch,
  Loader2,
  Package,
  ReceiptText,
} from "lucide-react";

import AquaLayout from "@/components/Layout/Layout";
import InvoiceServiceOperations from "@/services/invoice";
import styles from "@/styles/invoice-access.module.css";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
const date = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Date unavailable"
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
};

const InvoicesPage = () => {
  const [state, setState] = useState({
    loading: true,
    invoices: [],
    error: "",
  });

  useEffect(() => {
    InvoiceServiceOperations.getAccessibleInvoices()
      .then((payload) =>
        setState({
          loading: false,
          invoices: payload.invoices || [],
          error: "",
        }),
      )
      .catch((error) =>
        setState({
          loading: false,
          invoices: [],
          error:
            error?.response?.data?.message ||
            "Your secure session has expired.",
        }),
      );
  }, []);

  return (
    <AquaLayout seo={{ title: "My Invoices | Aquakart" }}>
      <Head>
        <meta name="robots" content="noindex, nofollow, noarchive" />
      </Head>
      <main className={styles.page}>
        <div className={styles.invoiceShell}>
          <span className={styles.eyebrow}>Secure customer area</span>
          <h1>Your Aquakart invoices.</h1>
          <p className={styles.lead}>
            View, download or email invoices from your verified purchase
            history.
          </p>

          {state.loading ? (
            <div className={styles.loading}>
              <Loader2 className={styles.spinner} /> Loading invoices…
            </div>
          ) : null}
          {state.error ? (
            <section className={styles.empty}>
              <FileSearch />
              <h2>Secure access required</h2>
              <p>{state.error}</p>
              <Link href="/page/find-invoice">Find my invoices</Link>
            </section>
          ) : null}
          {!state.loading && !state.error && !state.invoices.length ? (
            <section className={styles.empty}>
              <FileSearch />
              <h2>No invoices available</h2>
              <p>We couldn’t find invoices in this secure session.</p>
            </section>
          ) : null}
          <div className={styles.invoiceList}>
            {state.invoices.map((invoice) => (
              <article className={styles.invoiceCard} key={invoice.id}>
                <div className={styles.invoiceMark}>
                  <ReceiptText />
                </div>
                <div className={styles.invoiceInfo}>
                  <span>{invoice.invoiceNo || "Aquakart invoice"}</span>
                  <h2>{money(invoice.total)}</h2>
                  <div>
                    <span>
                      <CalendarDays /> {date(invoice.date)}
                    </span>
                    <span>
                      <Package /> {invoice.itemCount || 0} items
                    </span>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <Link href="/page/find-invoice">Confirm &amp; share</Link>
                  <Link href={`/invoice/${invoice.id}`}>
                    View invoice <ArrowRight />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </AquaLayout>
  );
};

export default InvoicesPage;
