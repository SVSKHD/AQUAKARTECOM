"use client";

import { useEffect, useState } from "react";

export default function PaymentReturn({
  transactionId,
}: {
  transactionId: string;
}) {
  const [orphan, setOrphan] = useState(false);

  useEffect(() => {
    const opener = window.opener as Window | null;
    if (opener && !opener.closed) {
      opener.postMessage(
        { type: "aqua-payment-return", transactionId },
        window.location.origin,
      );
      window.close();
      return;
    }
    // Opened directly (or the Aqua tab is gone): nothing to hand back to.
    const t = setTimeout(() => setOrphan(true), 0);
    return () => clearTimeout(t);
  }, [transactionId]);

  return (
    <main
      className="aq-root"
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
        gap: 16,
      }}
    >
      {orphan ? (
        <>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            This window is only used to return from PhonePe. You can close it.
          </p>
          <a
            href="/"
            className="aq-btn aq-btn-primary"
            style={{ textDecoration: "none" }}
          >
            Go to Aquakart
          </a>
        </>
      ) : (
        <p
          role="status"
          style={{ margin: 0, fontSize: 15, color: "var(--aq-mut)" }}
        >
          Returning to Aquakart…
        </p>
      )}
    </main>
  );
}
