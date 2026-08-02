import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useReducer, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileSearch,
  Loader2,
  LockKeyhole,
  MailCheck,
  Package,
  Phone,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import AquaLayout from "@/components/Layout/Layout";
import GoogleMark from "@/components/auth/GoogleMark";
import InvoiceShareDialog from "@/components/invoice/InvoiceShareDialog";
import { useAuth } from "@/context/AuthContext";
import {
  createInitialInvoiceFlow,
  findRequestedInvoice,
  INVOICE_FLOW_PHASE,
  invoiceFlowReducer,
  validateDeliveryEmail,
} from "@/features/invoiceDiscovery/flow";
import { getCurrentFirebaseIdToken } from "@/services/googleAuth";
import InvoiceServiceOperations, {
  normalizeInvoicePhone,
} from "@/services/invoice";
import styles from "@/styles/find-invoice.module.css";

const LOOKUP_STORAGE_KEY = "aquakart_invoice_lookup_phone";
const AUTH_UI_TIMEOUT_MS = 8_000;

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
        month: "short",
        year: "numeric",
      });
};

const friendlyAuthError = (error) => {
  if (error?.code === "auth/popup-closed-by-user") {
    return "Google sign-in was cancelled. Your invoice search is still here.";
  }
  return (
    error?.response?.data?.message ||
    error?.message ||
    "We could not verify your Google account. Please try again."
  );
};

const FindInvoicePage = () => {
  const router = useRouter();
  const {
    authenticated,
    authReady,
    loading: authLoading,
    session,
    signInWithGoogle,
    switchGoogleAccount,
  } = useAuth();
  const [flow, dispatch] = useReducer(
    invoiceFlowReducer,
    createInitialInvoiceFlow(),
  );
  const mutationInFlight = useRef(false);
  const sendInFlight = useRef(false);

  useEffect(() => {
    const storedPhone = window.sessionStorage.getItem(LOOKUP_STORAGE_KEY) || "";
    if (storedPhone) {
      dispatch({ type: "PHONE_CHANGE", phone: storedPhone });
    }
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (authenticated && flow.phase === INVOICE_FLOW_PHASE.AUTH_REQUIRED) {
      dispatch({ type: "AUTH_SUCCESS", user: session?.user });
    }
    if (
      !authenticated &&
      !authLoading &&
      ![
        INVOICE_FLOW_PHASE.AUTH_REQUIRED,
        INVOICE_FLOW_PHASE.AUTHENTICATING,
      ].includes(flow.phase)
    ) {
      dispatch({ type: "AUTH_REQUIRED" });
    }
  }, [authLoading, authReady, authenticated, flow.phase, session?.user]);

  useEffect(() => {
    if (flow.phase !== INVOICE_FLOW_PHASE.AUTHENTICATING) return undefined;
    const timeout = window.setTimeout(() => {
      dispatch({
        type: "AUTH_REQUIRED",
        error: "Google verification took too long. Please try again.",
      });
    }, AUTH_UI_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [flow.phase]);

  const updatePhone = (value) => {
    const phone = normalizeInvoicePhone(value);
    window.sessionStorage.setItem(LOOKUP_STORAGE_KEY, phone);
    dispatch({ type: "PHONE_CHANGE", phone });
  };

  const authenticate = async (accountSwitch = false) => {
    if (authLoading || flow.phase === INVOICE_FLOW_PHASE.AUTHENTICATING) return;
    dispatch({ type: "AUTH_START" });
    try {
      const result = accountSwitch
        ? await switchGoogleAccount()
        : await signInWithGoogle();
      if (result?.redirecting) return;
      dispatch({ type: "AUTH_SUCCESS", user: result?.user });
      if (accountSwitch && flow.phone) {
        const firebaseIdToken = await getCurrentFirebaseIdToken();
        const payload = await InvoiceServiceOperations.loginInvoiceAccess(
          flow.phone,
          firebaseIdToken,
          result?.token || session?.token,
        );
        if (!payload.found || !payload.invoices?.length) {
          dispatch({ type: "SEARCH_EMPTY", message: payload.message });
          return;
        }
        dispatch({
          type: "SEARCH_SUCCESS",
          invoices: payload.invoices,
          user: payload.user,
          message: payload.message,
        });
        const requestedInvoice = findRequestedInvoice(
          payload.invoices,
          router.query.invoiceId,
        );
        if (requestedInvoice) {
          dispatch({ type: "SELECT_INVOICE", invoice: requestedInvoice });
        }
      }
    } catch (error) {
      if (accountSwitch && authenticated) {
        dispatch({
          type: "FAILURE",
          phase: flow.selectedInvoice
            ? flow.selectedInvoice.emailStatus === "matches"
              ? INVOICE_FLOW_PHASE.READY
              : INVOICE_FLOW_PHASE.CONFIRMING
            : INVOICE_FLOW_PHASE.LIST,
          error: friendlyAuthError(error),
        });
      } else {
        dispatch({
          type: "AUTH_REQUIRED",
          error: friendlyAuthError(error),
        });
      }
    }
  };

  const searchInvoices = async (event) => {
    event.preventDefault();
    if (!/^[6-9]\d{9}$/.test(flow.phone)) return;
    if (!authenticated) {
      dispatch({ type: "AUTH_REQUIRED" });
      return;
    }
    dispatch({ type: "SEARCH_START" });
    try {
      const firebaseIdToken = await getCurrentFirebaseIdToken();
      const payload = await InvoiceServiceOperations.loginInvoiceAccess(
        flow.phone,
        firebaseIdToken,
        session?.token,
      );
      if (!payload.found || !payload.invoices?.length) {
        dispatch({ type: "SEARCH_EMPTY", message: payload.message });
        return;
      }
      dispatch({
        type: "SEARCH_SUCCESS",
        invoices: payload.invoices,
        user: payload.user,
        message: payload.message,
      });
      const requestedInvoice = findRequestedInvoice(
        payload.invoices,
        router.query.invoiceId,
      );
      if (requestedInvoice) {
        dispatch({ type: "SELECT_INVOICE", invoice: requestedInvoice });
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        dispatch({
          type: "FAILURE",
          phase: INVOICE_FLOW_PHASE.LOOKUP,
          error:
            error?.response?.data?.message ||
            "Your Google session has expired. Switch or reconnect the account and try again.",
        });
        return;
      }
      dispatch({
        type: "FAILURE",
        phase: INVOICE_FLOW_PHASE.LOOKUP,
        error:
          error?.response?.data?.message ||
          "We could not check your invoices right now. Please try again.",
      });
    }
  };

  const confirmInvoice = async (emailAction) => {
    if (!flow.selectedInvoice || mutationInFlight.current) return;

    if (
      emailAction === "keep-existing" &&
      !flow.selectedInvoice.claimRequired
    ) {
      dispatch({
        type: "INVOICE_READY",
        invoice: flow.selectedInvoice,
        message: "The existing invoice email was kept.",
      });
      return;
    }

    mutationInFlight.current = true;
    dispatch({ type: "UPDATE_START" });
    try {
      const payload = flow.selectedInvoice.claimRequired
        ? await InvoiceServiceOperations.claimInvoice(
            flow.selectedInvoice.id,
            emailAction,
          )
        : await InvoiceServiceOperations.updateInvoiceEmail(
            flow.selectedInvoice.id,
          );
      dispatch({
        type: "INVOICE_READY",
        invoice: payload.invoice,
        message: payload.message,
      });
    } catch (error) {
      dispatch({
        type: "FAILURE",
        phase: INVOICE_FLOW_PHASE.CONFIRMING,
        error:
          error?.response?.data?.message ||
          "We could not confirm this invoice. Please try again.",
      });
    } finally {
      mutationInFlight.current = false;
    }
  };

  const sendInvoice = async () => {
    if (!flow.selectedInvoice || sendInFlight.current) return;
    const emailError = validateDeliveryEmail(flow.deliveryEmail);
    if (emailError) {
      dispatch({
        type: "FAILURE",
        phase: INVOICE_FLOW_PHASE.READY,
        error: emailError,
      });
      return;
    }

    sendInFlight.current = true;
    dispatch({ type: "SEND_START" });
    try {
      const requestId =
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const payload = await InvoiceServiceOperations.shareInvoiceByEmail(
        flow.selectedInvoice.id,
        flow.deliveryEmail,
        requestId,
      );
      dispatch({
        type: "SEND_SUCCESS",
        message: payload.message || "Invoice emailed successfully.",
      });
    } catch (error) {
      dispatch({
        type: "FAILURE",
        phase: INVOICE_FLOW_PHASE.READY,
        error:
          error?.response?.data?.message ||
          error?.message ||
          "We could not email this invoice. Please try again.",
      });
    } finally {
      sendInFlight.current = false;
    }
  };

  const showWhatsAppStatus = async () => {
    if (!flow.selectedInvoice) return;
    try {
      const payload = await InvoiceServiceOperations.getWhatsAppSharingStatus(
        flow.selectedInvoice.id,
      );
      toast.info(
        payload.whatsapp?.message ||
          "WhatsApp invoice sharing will be available soon.",
      );
    } catch {
      toast.info("WhatsApp invoice sharing will be available soon.");
    }
  };

  const resetLookup = () => {
    window.sessionStorage.removeItem(LOOKUP_STORAGE_KEY);
    dispatch({ type: "RESET_LOOKUP" });
  };

  const seo = {
    title: "Find My Invoice | Aquakart",
    description:
      "Find and securely share Aquakart purchase invoices with Google authentication.",
    canonical: `${process.env.NEXT_PUBLIC_URL || "https://aquakart.co.in"}/page/find-invoice`,
  };

  const isSearching = flow.phase === INVOICE_FLOW_PHASE.SEARCHING;
  const isAuthenticating =
    flow.phase === INVOICE_FLOW_PHASE.AUTHENTICATING || !authReady;
  const showLookup = [
    INVOICE_FLOW_PHASE.LOOKUP,
    INVOICE_FLOW_PHASE.SEARCHING,
  ].includes(flow.phase);
  const showList = flow.phase === INVOICE_FLOW_PHASE.LIST;
  const dialogOpen = Boolean(flow.selectedInvoice) && !showList;

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
              <h1>Find your invoice.</h1>
              <p>
                Sign in with Google, enter the mobile number used for your
                purchase, and open your invoice securely.
              </p>
              <div className={styles.trustGrid}>
                <span>
                  <ShieldCheck /> Verified Google identity
                </span>
                <span>
                  <LockKeyhole /> Short-lived invoice access
                </span>
                <span>
                  <MailCheck /> Secure email delivery
                </span>
              </div>
            </div>

            <div className={styles.interaction} aria-live="polite">
              {isAuthenticating ? (
                <div className={styles.centerState}>
                  <Loader2 className={styles.spinner} />
                  <h2>Checking your account…</h2>
                  <p>This should take only a moment.</p>
                </div>
              ) : null}

              {!isAuthenticating &&
              flow.phase === INVOICE_FLOW_PHASE.AUTH_REQUIRED ? (
                <div className={styles.authState}>
                  <span className={styles.stateIcon}>
                    <ShieldCheck />
                  </span>
                  <span className={styles.eyebrow}>
                    Authentication required
                  </span>
                  <h2>Protect your purchase history.</h2>
                  <p>
                    Continue with Google before searching. This prevents invoice
                    details from being exposed through phone-number guesses.
                  </p>
                  {flow.error ? (
                    <p className={styles.formError} role="alert">
                      {flow.error}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className={styles.googleSignIn}
                    onClick={() => authenticate(false)}
                  >
                    <GoogleMark /> Continue with Google
                  </button>
                </div>
              ) : null}

              {showLookup ? (
                <form onSubmit={searchInvoices} className={styles.phoneForm}>
                  <div className={styles.verifiedAccount}>
                    <CheckCircle2 />
                    <div>
                      <span>Verified Google account</span>
                      <strong>
                        {flow.googleUser?.email || session?.user?.email}
                      </strong>
                    </div>
                    <button type="button" onClick={() => authenticate(true)}>
                      Switch
                    </button>
                  </div>
                  <label htmlFor="invoice-phone">Purchase phone number</label>
                  <div className={styles.phoneInput}>
                    <span>+91</span>
                    <Phone size={18} />
                    <input
                      id="invoice-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={flow.phone}
                      onChange={(event) => updatePhone(event.target.value)}
                      placeholder="98765 43210"
                      aria-describedby="phone-help"
                      disabled={isSearching}
                    />
                  </div>
                  <small id="phone-help">
                    Use the same 10-digit number given at purchase or checkout.
                  </small>
                  {flow.error ? (
                    <p className={styles.formError} role="alert">
                      {flow.error}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={!/^[6-9]\d{9}$/.test(flow.phone) || isSearching}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className={styles.spinner} /> Checking
                        securely…
                      </>
                    ) : (
                      <>
                        Find my invoices <ArrowRight />
                      </>
                    )}
                  </button>
                </form>
              ) : null}

              {flow.phase === INVOICE_FLOW_PHASE.EMPTY ? (
                <div className={styles.centerState}>
                  <span className={styles.stateIcon}>
                    <FileSearch />
                  </span>
                  <span className={styles.eyebrow}>Nothing to show</span>
                  <h2>No invoices verified.</h2>
                  <p>
                    {flow.message ||
                      "Check the purchase phone number and try again."}
                  </p>
                  <div className={styles.resultActions}>
                    <button type="button" onClick={resetLookup}>
                      <RotateCcw /> Try another number
                    </button>
                    <Link href="/shop">Explore products</Link>
                  </div>
                </div>
              ) : null}

              {showList ? (
                <div className={styles.invoiceResults}>
                  <div className={styles.resultHeading}>
                    <div>
                      <span className={styles.eyebrow}>Invoices verified</span>
                      <h2>Choose an invoice</h2>
                    </div>
                    <button type="button" onClick={resetLookup}>
                      <RotateCcw /> New search
                    </button>
                  </div>
                  <div className={styles.purchaseList}>
                    {flow.invoices.map((invoice) => (
                      <article className={styles.purchaseCard} key={invoice.id}>
                        <div className={styles.purchaseTopline}>
                          <span>
                            <ReceiptText /> {invoice.invoiceNo}
                          </span>
                          <span data-status={invoice.emailStatus}>
                            {invoice.emailStatus === "matches"
                              ? "Email connected"
                              : "Confirm email"}
                          </span>
                        </div>
                        <strong className={styles.invoiceTotal}>
                          {money(invoice.total)}
                        </strong>
                        <div className={styles.purchaseMeta}>
                          <span>
                            <CalendarDays /> {date(invoice.date)}
                          </span>
                          <span>
                            <Package /> {invoice.itemCount || 0} items
                          </span>
                        </div>
                        <button
                          type="button"
                          className={styles.selectButton}
                          onClick={() =>
                            dispatch({ type: "SELECT_INVOICE", invoice })
                          }
                        >
                          Confirm and share <ArrowRight />
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>

      <InvoiceShareDialog
        open={dialogOpen}
        phase={flow.phase}
        invoice={flow.selectedInvoice}
        googleEmail={flow.googleUser?.email || session?.user?.email || ""}
        customerEmailStatus={flow.googleUser?.customerEmailStatus}
        maskedCustomerEmail={flow.googleUser?.maskedCustomerEmail}
        deliveryEmail={flow.deliveryEmail}
        error={flow.error}
        message={flow.message}
        onClose={() => dispatch({ type: "CLOSE_INVOICE" })}
        onConfirm={confirmInvoice}
        onSwitchAccount={() => authenticate(true)}
        onDeliveryEmailChange={(email) =>
          dispatch({ type: "DELIVERY_EMAIL_CHANGE", email })
        }
        onSend={sendInvoice}
        onWhatsApp={showWhatsAppStatus}
      />
    </AquaLayout>
  );
};

export const getServerSideProps = async () => ({
  redirect: { destination: "/page/find-invoice", permanent: false },
});

export default FindInvoicePage;
