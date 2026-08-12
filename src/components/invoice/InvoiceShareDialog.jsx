import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import GoogleMark from "@/components/auth/GoogleMark";
import {
  getInvoiceEmailScenario,
  INVOICE_FLOW_PHASE,
} from "@/features/invoiceDiscovery/flow";
import styles from "@/styles/invoice-share-dialog.module.css";

const InvoiceShareDialog = ({
  open,
  phase,
  invoice,
  googleEmail,
  customerEmailStatus,
  maskedCustomerEmail,
  deliveryEmail,
  error,
  message,
  onClose,
  onConfirm,
  onSwitchAccount,
  onDeliveryEmailChange,
  onSend,
  onWhatsApp,
  whatsappSending,
}) => {
  const scenario = getInvoiceEmailScenario(invoice);
  const busy = [
    INVOICE_FLOW_PHASE.UPDATING,
    INVOICE_FLOW_PHASE.SENDING,
  ].includes(phase);
  const confirming = phase === INVOICE_FLOW_PHASE.CONFIRMING;
  const sent = phase === INVOICE_FLOW_PHASE.SENT;

  const close = () => {
    if (!busy) onClose();
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className={styles.dialogRoot} onClose={close}>
        <Transition.Child
          as={Fragment}
          enter={styles.fadeEnter}
          enterFrom={styles.fadeFrom}
          enterTo={styles.fadeTo}
          leave={styles.fadeLeave}
          leaveFrom={styles.fadeTo}
          leaveTo={styles.fadeFrom}
        >
          <div className={styles.backdrop} />
        </Transition.Child>

        <div className={styles.viewport}>
          <div className={styles.positioner}>
            <Transition.Child
              as={Fragment}
              enter={styles.panelEnter}
              enterFrom={styles.panelFrom}
              enterTo={styles.panelTo}
              leave={styles.panelLeave}
              leaveFrom={styles.panelTo}
              leaveTo={styles.panelFrom}
            >
              <Dialog.Panel className={styles.panel}>
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={close}
                  disabled={busy}
                  aria-label="Close invoice sharing dialog"
                >
                  <X aria-hidden="true" />
                </button>

                <div className={styles.headingIcon}>
                  {sent ? <CheckCircle2 /> : <ShieldCheck />}
                </div>
                <span className={styles.eyebrow}>
                  {invoice?.invoiceNo || "Aquakart invoice"}
                </span>

                {confirming ? (
                  <>
                    <Dialog.Title className={styles.title}>
                      Confirm the invoice email
                    </Dialog.Title>
                    <Dialog.Description className={styles.description}>
                      {scenario === "missing"
                        ? "This invoice does not have an email address. Would you like to add your Google email?"
                        : `This invoice currently uses ${invoice?.maskedExistingEmail || "another email"}. Would you like to update it to your verified Google email?`}
                    </Dialog.Description>

                    <div className={styles.verifiedEmail}>
                      <span>Verified Google email</span>
                      <strong>{googleEmail}</strong>
                    </div>

                    {customerEmailStatus === "different" ? (
                      <p className={styles.accountEmailNote}>
                        Your Aquakart customer account currently uses{" "}
                        {maskedCustomerEmail || "another email"}. This choice
                        updates this invoice only; it does not silently change
                        your customer account.
                      </p>
                    ) : null}

                    {error ? (
                      <p className={styles.error} role="alert">
                        {error}
                      </p>
                    ) : null}

                    <div className={styles.confirmActions}>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => onConfirm("use-google-email")}
                        disabled={busy}
                      >
                        {busy ? (
                          <Loader2 className={styles.spinner} />
                        ) : (
                          <Mail />
                        )}
                        {scenario === "missing"
                          ? "Use this email"
                          : "Update to Google email"}
                      </button>
                      {scenario === "different" ? (
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => onConfirm("keep-existing")}
                          disabled={busy}
                        >
                          Keep existing email
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={styles.googleButton}
                        onClick={onSwitchAccount}
                        disabled={busy}
                      >
                        <GoogleMark /> Use another Google account
                      </button>
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={close}
                        disabled={busy}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Dialog.Title className={styles.title}>
                      {sent ? "Invoice sent" : "Share your invoice"}
                    </Dialog.Title>
                    <Dialog.Description className={styles.description}>
                      {scenario === "matches"
                        ? "Your invoice is connected to your Google email."
                        : "Your confirmation is complete. Choose where this one invoice should be delivered."}
                    </Dialog.Description>

                    {message ? (
                      <p className={styles.success} role="status">
                        {message}
                      </p>
                    ) : null}
                    {error ? (
                      <p className={styles.error} role="alert">
                        {error}
                      </p>
                    ) : null}

                    <div className={styles.deliveryField}>
                      <label htmlFor="invoice-delivery-email">
                        Delivery email
                      </label>
                      <div>
                        <Mail aria-hidden="true" />
                        <input
                          id="invoice-delivery-email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          value={deliveryEmail}
                          onChange={(event) =>
                            onDeliveryEmailChange(event.target.value)
                          }
                          disabled={busy || sent}
                          aria-describedby="invoice-delivery-help"
                        />
                      </div>
                      <small id="invoice-delivery-help">
                        This sends one copy only. Editing it does not update
                        your permanent invoice or customer email.
                      </small>
                    </div>

                    <div className={styles.shareActions}>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={onSend}
                        disabled={busy || sent || !deliveryEmail}
                      >
                        {phase === INVOICE_FLOW_PHASE.SENDING ? (
                          <Loader2 className={styles.spinner} />
                        ) : (
                          <Mail />
                        )}
                        {phase === INVOICE_FLOW_PHASE.SENDING
                          ? "Sending invoice…"
                          : sent
                            ? "Invoice sent"
                            : "Email invoice"}
                      </button>
                      <button
                        type="button"
                        className={styles.whatsappButton}
                        onClick={onWhatsApp}
                        disabled={busy || whatsappSending}
                      >
                        {whatsappSending ? (
                          <Loader2 className={styles.spinner} />
                        ) : (
                          <MessageCircle />
                        )}
                        {whatsappSending ? "Sending…" : "Send on WhatsApp"}
                      </button>
                    </div>

                    {invoice?.canView ? (
                      <Link
                        className={styles.viewLink}
                        href={`/invoice/${invoice.id}`}
                      >
                        Open invoice <ExternalLink />
                      </Link>
                    ) : null}
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default InvoiceShareDialog;
