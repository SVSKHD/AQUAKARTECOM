"use client";

import { Clock, LogIn } from "lucide-react";
import { formatResetIST, type AiLimit, type AiQuota } from "@/services/ai";

type Props = {
  limit: AiLimit;
  quota: AiQuota | null;
  onSignIn: () => void;
  signingIn: boolean;
  // Why the last Google sign-in failed, shown where the customer clicked.
  signInError?: string;
};

// Shown above the disabled composer once today's questions are used up. The
// conversation stays on screen; a guest can log in for more, a customer waits.
export default function AquaLimitCard({
  limit,
  quota,
  onSignIn,
  signingIn,
  signInError,
}: Props) {
  const reset = quota ? formatResetIST(quota.resetsAt) : "";
  const Icon = limit.loginRequired ? LogIn : Clock;
  return (
    <div
      role="status"
      aria-live="polite"
      className="aq-card"
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px 14px",
        padding: "12px 12px 12px 14px",
        borderRadius: 20,
        animation: "aqAquaIn .4s cubic-bezier(.2,.8,.2,1) both",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width: 34,
          height: 34,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: "var(--aq-mint)",
          color: "var(--aq-mintink)",
        }}
      >
        <Icon size={16} />
      </span>
      <div
        style={{
          flex: "1 1 220px",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          fontSize: 13,
          lineHeight: 1.45,
        }}
      >
        <strong style={{ fontSize: 13.5 }}>{limit.message}</strong>
        <span style={{ color: "var(--aq-mut)" }}>
          {limit.loginRequired
            ? "Your conversation stays here when you log in."
            : reset
              ? `Come back after midnight. Questions reset at ${reset}.`
              : "Come back after midnight."}
        </span>
      </div>
      {limit.loginRequired && (
        <button
          type="button"
          className="aq-btn aq-btn-primary"
          onClick={onSignIn}
          disabled={signingIn}
          style={{ height: 40, padding: "0 16px", fontSize: 13, flexShrink: 0 }}
        >
          {signingIn
            ? "Signing in…"
            : "Sign in with Google · 5 questions a day"}
        </button>
      )}
      {limit.loginRequired && signInError && (
        <span
          role="alert"
          style={{
            flexBasis: "100%",
            fontSize: 12.5,
            lineHeight: 1.45,
            color: "#B42318",
          }}
        >
          {signInError}
        </span>
      )}
    </div>
  );
}
