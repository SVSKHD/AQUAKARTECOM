"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import type { EmailAuth } from "./useAquaAuth";

// Checkout's sign-in card: Google, or a one-time code sent to an email. Once
// signed in, the account's name, phone, email and saved address fill the
// checkout's empty fields.

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const RESEND_S = 30;

type Props = EmailAuth & {
  // Prefills the email field from what the guest typed for the invoice.
  defaultEmail?: string;
  onGoogle: () => void;
  googleBusy?: boolean;
};

export default function EmailSignIn({
  sendEmailCode,
  verifyEmailCode,
  defaultEmail = "",
  onGoogle,
  googleBusy,
}: Props) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState("");
  const [newUser, setNewUser] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  // Follows the invoice email until the guest edits this one.
  const touched = useRef(false);
  useEffect(() => {
    if (!touched.current && step === "email") setEmail(defaultEmail);
  }, [defaultEmail, step]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!isEmail(email)) return setError("Enter a valid email address.");
    setBusy(true);
    setError("");
    try {
      const r = await sendEmailCode(email.trim());
      setNewUser(r.newUser);
      setStep("code");
      setCode("");
      setWait(RESEND_S);
      setTimeout(() => codeRef.current?.focus(), 50);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code, e?: FormEvent) => {
    e?.preventDefault();
    if (value.length !== 6) return setError("Enter the 6-digit code.");
    setBusy(true);
    setError("");
    try {
      // On success the account arrives and this card goes away.
      await verifyEmailCode(email.trim(), value);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="aq-esi" aria-label="Sign in">
      <div className="aq-esi-head">
        <ShieldCheck size={16} aria-hidden="true" />
        <span>
          <b>Sign in to fill your details</b>
          <small>
            Your saved name, phone and address come in, and you can pay.
          </small>
        </span>
      </div>

      {step === "email" ? (
        <form className="aq-esi-row" onSubmit={send} noValidate>
          <label className="aq-esi-field">
            <Mail size={15} aria-hidden="true" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                touched.current = true;
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="you@example.com"
              autoComplete="email"
              aria-label="Email for sign-in"
            />
          </label>
          <button
            type="submit"
            className="aq-btn aq-btn-dark aq-esi-go"
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? (
              <span className="aq-cmp-ask-spin" aria-hidden="true" />
            ) : null}
            {busy ? "Sending…" : "Email me a code"}
          </button>
        </form>
      ) : (
        <form className="aq-esi-code" onSubmit={(e) => verify(code, e)}>
          <p className="aq-esi-sent">
            {newUser ? "New here? " : ""}We sent a 6-digit code to{" "}
            <b>{email.trim()}</b>.
            <button
              type="button"
              className="aq-esi-link"
              onClick={() => {
                setStep("email");
                setError("");
              }}
            >
              <ArrowLeft size={12} aria-hidden="true" /> Change
            </button>
          </p>
          <div className="aq-esi-row">
            <input
              ref={codeRef}
              className="aq-esi-otp"
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(v);
                setError("");
                // A pasted or autofilled full code signs in straight away.
                if (v.length === 6 && !busy) void verify(v);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              aria-label="6-digit code"
            />
            <button
              type="submit"
              className="aq-btn aq-btn-dark aq-esi-go"
              disabled={busy || code.length !== 6}
              aria-busy={busy}
            >
              {busy ? (
                <span className="aq-cmp-ask-spin" aria-hidden="true" />
              ) : null}
              {busy ? "Signing in…" : "Verify & fill"}
            </button>
          </div>
          <button
            type="button"
            className="aq-esi-link"
            disabled={wait > 0 || busy}
            onClick={() => void send()}
          >
            {wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
          </button>
        </form>
      )}

      {error && (
        <p className="aq-esi-error" role="alert">
          {error}
        </p>
      )}

      <div className="aq-esi-or">
        <span>or</span>
      </div>
      <button
        type="button"
        className="aq-btn aq-btn-glass aq-esi-google"
        onClick={onGoogle}
        disabled={googleBusy}
      >
        <svg viewBox="0 0 48 48" width="16" height="16" aria-hidden="true">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
          />
        </svg>
        {googleBusy ? "Opening Google…" : "Continue with Google"}
      </button>
    </div>
  );
}
