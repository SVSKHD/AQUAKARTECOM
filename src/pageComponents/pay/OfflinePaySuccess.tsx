import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  getOfflineStatus,
  getOfflineSummary,
  getProductCatalogue,
  type OfflinePaymentError,
  type OfflineStatus,
  type OfflineSummary,
} from "@/services/offlinePayment";
import { AlertTriangle } from "lucide-react";
import { Loading, Notice, PayShell, usePayAuth } from "./OfflinePayPage";
import PaidReceipt from "./PaidReceipt";
import { payPath, recallPaid, rememberPaid } from "./payHelpers";
import { matchLineProducts, type ProductInfo } from "./productInfo";
import styles from "./pay.module.css";

const first = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) || "";

// The invoice is created a moment after the payment: ask again a few times.
const INVOICE_RETRY_MS = 5000;
const INVOICE_RETRIES = 12;
// A slow or failed check (timeout, rate limit, network) is retried before the
// page gives up and offers "Try again".
const LOAD_RETRY_MS = [1500, 4000];

// Answers that mean this page isn't for this visitor (or not yet).
const sendsBack = (e: OfflinePaymentError) =>
  e?.kind === "invalid" || e?.kind === "bound" || e?.kind === "details";

type Load =
  { key: string; state: "failed" } | { key: string; state: "back" } | null;

// Only for the signed-in account bound to this link (the status endpoint
// answers 403 for anyone else), and only once it says paid. A definite "not
// paid" or "not yours" goes back to /pay/[token]; a slow or failed check never
// does, so the two pages can't bounce the customer between them.
export default function OfflinePaySuccess() {
  const router = useRouter();
  const auth = usePayAuth();
  const token = router.isReady ? first(router.query.token) : "";
  // The saved session is usable straight away; there's no need to wait for
  // the Google restore (up to 12s) unless the server turns it down.
  const authToken = auth.authenticated ? auth.session?.token || "" : "";
  const [status, setStatus] = useState<OfflineStatus | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [load, setLoad] = useState<Load>(null);
  const [tries, setTries] = useState(0);

  // What /pay/[token] just confirmed: shown at once, then re-checked.
  useEffect(() => {
    if (!token) return;
    let active = true;
    void Promise.resolve().then(() => {
      const cached = recallPaid<OfflineStatus>(token);
      if (active && cached) setStatus((cur) => cur || cached);
    });
    return () => {
      active = false;
    };
  }, [token]);

  // The order's lines (public) and their catalogue photos, for the receipt.
  // Neither holds up the page; without them the items card is left out.
  const [order, setOrder] = useState<{
    summary: OfflineSummary;
    products: (ProductInfo | null)[];
  } | null>(null);
  useEffect(() => {
    if (!token) return;
    let active = true;
    const ctl = new AbortController();
    getOfflineSummary(token, ctl.signal)
      .then(async (summary) => {
        if (!active) return;
        setOrder({ summary, products: [] });
        const payload = await getProductCatalogue(ctl.signal);
        if (active && payload)
          setOrder({
            summary,
            products: matchLineProducts(summary.lines, payload),
          });
      })
      .catch(() => {});
    return () => {
      active = false;
      ctl.abort();
    };
  }, [token]);

  const goBack = !!token && auth.authReady && !authToken;
  const loadKey = token && authToken ? `${token}|${authToken}|${attempt}` : "";
  useEffect(() => {
    if (!loadKey) return;
    let active = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const ctl = new AbortController();
    const run = (n: number) => {
      getOfflineStatus(token, authToken, ctl.signal).then(
        (s) => {
          if (!active) return;
          if (s.status === "paid") {
            rememberPaid(token, s);
            setStatus(s);
          } else setLoad({ key: loadKey, state: "back" });
        },
        (e: OfflinePaymentError) => {
          if (!active || ctl.signal.aborted) return;
          if (sendsBack(e)) setLoad({ key: loadKey, state: "back" });
          // An expired session: /pay/[token] asks the customer to sign in.
          else if (e?.kind === "auth" && auth.authReady)
            setLoad({ key: loadKey, state: "back" });
          else if (e?.kind === "auth")
            return; // re-runs once auth is ready
          else if (n < LOAD_RETRY_MS.length)
            retry = setTimeout(() => run(n + 1), LOAD_RETRY_MS[n]);
          else setLoad({ key: loadKey, state: "failed" });
        },
      );
    };
    run(0);
    return () => {
      active = false;
      ctl.abort();
      clearTimeout(retry);
    };
    // authReady: a check refused before the session restore is retried after.
  }, [loadKey, token, authToken, auth.authReady]);

  const outcome = load && load.key === loadKey ? load.state : null;
  const leave = goBack || outcome === "back";
  useEffect(() => {
    if (leave) void router.replace(payPath(token));
  }, [leave, router, token]);

  // Ask again for the invoice until it exists. Failures here are ignored: the
  // payment is already confirmed on screen.
  const invoiceReady = !!status?.invoiceReady && !!status.invoiceNumber;
  const confirmed = !!status && !!authToken;
  useEffect(() => {
    if (!confirmed || invoiceReady || tries >= INVOICE_RETRIES) return;
    let active = true;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      getOfflineStatus(token, authToken, ctl.signal).then(
        (s) => {
          if (!active) return;
          if (s.status === "paid") setStatus(s);
          setTries((n) => n + 1);
        },
        () => {
          if (active) setTries((n) => n + 1);
        },
      );
    }, INVOICE_RETRY_MS);
    return () => {
      active = false;
      clearTimeout(t);
      ctl.abort();
    };
  }, [confirmed, invoiceReady, tries, token, authToken]);

  if (!status && outcome === "failed")
    return (
      <PayShell>
        <Notice
          title="We couldn't load your receipt"
          tone="warn"
          icon={<AlertTriangle aria-hidden="true" />}
        >
          <p className={styles.muted}>
            Your payment is safe. This page couldn't reach Aquakart just now.
          </p>
          <div className={styles.row}>
            <button
              type="button"
              className="aq-btn aq-btn-primary"
              onClick={() => setAttempt((n) => n + 1)}
            >
              Try again
            </button>
            <Link href="/invoices" className="aq-btn aq-btn-glass">
              View my purchases
            </Link>
          </div>
        </Notice>
      </PayShell>
    );

  if (!status || leave)
    return (
      <PayShell>
        <Loading label="Checking your payment…" />
      </PayShell>
    );

  const gaveUp = !invoiceReady && tries >= INVOICE_RETRIES;
  const invoiceId = (invoiceReady && status.invoiceId) || null;
  const firstName = (auth.session?.user?.name || "").trim().split(/\s+/)[0];
  return (
    <PayShell compact wide>
      <PaidReceipt
        status={status}
        summary={order?.summary ?? null}
        products={order?.products ?? []}
        firstName={firstName}
        invoiceReady={invoiceReady}
        gaveUp={gaveUp}
        invoiceId={invoiceId}
        sessionToken={authToken}
      />
    </PayShell>
  );
}
