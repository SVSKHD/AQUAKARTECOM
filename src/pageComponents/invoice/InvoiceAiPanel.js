import { useMemo, useState } from "react";
import { ArrowUpRight, Lock, SendHorizontal, Sparkles } from "lucide-react";
import GoogleMark from "@/components/auth/GoogleMark";
import { useAuth } from "@/context/AuthContext";
import {
  invoiceFreeQuestion,
  invoiceQuestions,
} from "@/utils/invoice/invoiceQuestions";
import styles from "@/styles/invoice.module.css";

/**
 * "Ask AI about this bill". Signed-in customers get questions built from this
 * bill's own status, amounts and products, plus a free-text box; each opens
 * the assistant with the question ready to send. Guests see a sign-in prompt.
 */
const InvoiceAiPanel = ({
  invoice,
  status,
  amounts,
  documentName,
  openAssistant,
}) => {
  const { authenticated, authReady, signInWithGoogle, user } = useAuth();
  const [draft, setDraft] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const questions = useMemo(
    () => invoiceQuestions(invoice, status, amounts),
    [invoice, status, amounts],
  );
  const toneClass = styles[`tone_${status.key}`] || styles.tone_unpaid;
  const firstName = String(user?.name || user?.firstName || "").split(/\s+/)[0];

  if (!authReady) return null;

  if (!authenticated) {
    const signIn = async () => {
      if (signingIn) return;
      setSigningIn(true);
      try {
        await signInWithGoogle();
      } finally {
        setSigningIn(false);
      }
    };

    return (
      <section className={`${styles.aiPanel} ${styles.aiPanelLocked}`}>
        <span className={styles.aiOrb} aria-hidden="true">
          <Lock size={18} />
        </span>
        <div className={styles.aiLockedCopy}>
          <span className={styles.eyebrow}>
            AI {documentName.toLowerCase()} help
          </span>
          <h2>Sign in to ask AI about this {documentName.toLowerCase()}</h2>
          <p>
            Get instant answers on payment, GST, warranty and servicing, built
            from the details on this bill.
          </p>
        </div>
        <button
          type="button"
          className={styles.googleSignInButton}
          onClick={signIn}
          disabled={signingIn}
        >
          <GoogleMark />
          {signingIn ? "Signing in…" : "Continue with Google"}
        </button>
      </section>
    );
  }

  const askFreeText = (event) => {
    event.preventDefault();
    const question = invoiceFreeQuestion(invoice, draft);
    if (!question) return;
    openAssistant(question, { autoSend: true });
    setDraft("");
  };

  return (
    <section
      className={`${styles.aiPanel} ${toneClass}`}
      aria-labelledby="invoice-ai-heading"
    >
      <div className={styles.aiHead}>
        <span className={styles.aiOrb} aria-hidden="true">
          <Sparkles size={18} />
        </span>
        <div>
          <span className={styles.eyebrow}>
            {firstName ? `Hi ${firstName}, ` : ""}ask AI about this{" "}
            {documentName.toLowerCase()}
          </span>
          <h2 id="invoice-ai-heading">Questions about your bill</h2>
        </div>
      </div>

      <div className={styles.aiChips} role="list">
        {questions.map((entry) => (
          <button
            key={entry.label}
            type="button"
            role="listitem"
            className={styles.aiChip}
            onClick={() => openAssistant(entry.question, { autoSend: true })}
            title={entry.question}
          >
            <span>{entry.label}</span>
            <ArrowUpRight size={13} aria-hidden="true" />
          </button>
        ))}
      </div>

      <form className={styles.aiForm} onSubmit={askFreeText}>
        <label htmlFor="invoice-ai-input" className={styles.srOnly}>
          Ask anything about this {documentName.toLowerCase()}
        </label>
        <input
          id="invoice-ai-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Ask anything about this ${documentName.toLowerCase()}…`}
          maxLength={400}
          autoComplete="off"
        />
        <button type="submit" disabled={!draft.trim()} aria-label="Ask AI">
          <SendHorizontal size={16} />
        </button>
      </form>
      <p className={styles.aiNote}>
        Tap a question and the assistant answers it right away.
      </p>
    </section>
  );
};

export default InvoiceAiPanel;
