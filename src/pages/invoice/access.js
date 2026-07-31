import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import AquaLayout from "@/components/Layout/Layout";
import InvoiceServiceOperations from "@/services/invoice";
import styles from "@/styles/invoice-access.module.css";

const InvoiceAccessPage = () => {
  const router = useRouter();
  const exchanged = useRef(false);
  const [state, setState] = useState({
    status: "loading",
    message: "Verifying your secure invoice link…",
  });

  useEffect(() => {
    if (!router.isReady || exchanged.current) return;
    exchanged.current = true;
    const token = Array.isArray(router.query.token)
      ? router.query.token[0]
      : router.query.token;
    if (!token) {
      setState({
        status: "error",
        message: "This invoice link is incomplete. Please request a new one.",
      });
      return;
    }
    InvoiceServiceOperations.exchangeInvoiceToken(token)
      .then(() => {
        setState({
          status: "success",
          message: "Verified. Opening your invoices…",
        });
        window.setTimeout(() => router.replace("/invoices"), 500);
      })
      .catch((error) =>
        setState({
          status: "error",
          message:
            error?.response?.data?.message ||
            "This link is invalid or has expired. Please request a fresh link.",
        }),
      );
  }, [router]);

  return (
    <AquaLayout seo={{ title: "Secure Invoice Access | Aquakart" }}>
      <Head>
        <meta name="robots" content="noindex, nofollow, noarchive" />
      </Head>
      <main className={styles.page}>
        <section className={styles.statusCard}>
          <span className={styles.statusIcon}>
            {state.status === "loading" ? (
              <Loader2 className={styles.spinner} />
            ) : state.status === "success" ? (
              <CheckCircle2 />
            ) : (
              <AlertCircle />
            )}
          </span>
          <span className={styles.eyebrow}>Aquakart invoices</span>
          <h1>
            {state.status === "error"
              ? "We couldn’t verify this link."
              : "Securing your invoice access."}
          </h1>
          <p>{state.message}</p>
          {state.status === "error" ? (
            <Link href="/page/find-invoice">Request a new secure link</Link>
          ) : null}
        </section>
      </main>
    </AquaLayout>
  );
};

export default InvoiceAccessPage;
