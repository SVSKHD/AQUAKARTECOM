import { useEffect, useState } from "react";
import AquaOrderComponent from "@/pageComponents/orders";

// PhonePe always redirects to /order/{transactionId}. When that happens inside
// the payment window opened by the Aqua chat (/aqua), hand control back to the
// Aqua tab and close, instead of showing the order page in the popup. The message
// carries no order data: it only makes Aqua re-check the payment with the server.
const PAYMENT_WINDOW_NAME = "aquakart-phonepe";
const PAYMENT_RETURN_MESSAGE = "aqua-payment-return";

const useAquaPaymentHandoff = () => {
  const [handingOff, setHandingOff] = useState(false);
  useEffect(() => {
    const opener = window.opener;
    if (window.name !== PAYMENT_WINDOW_NAME || !opener || opener.closed) return;
    // The Aqua tab may be on another origin (e.g. a dev server), so "*": nothing sensitive is sent.
    opener.postMessage({ type: PAYMENT_RETURN_MESSAGE }, "*");
    const show = window.setTimeout(() => setHandingOff(true), 0);
    const close = window.setTimeout(() => window.close(), 150);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(close);
    };
  }, []);
  return handingOff;
};

const AquaOrderIndex = () => {
  const handingOff = useAquaPaymentHandoff();
  if (handingOff) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center">
        <p role="status" className="text-sm font-semibold text-slate-600">
          Returning to Aquakart…
        </p>
      </main>
    );
  }
  return (
    <>
      <AquaOrderComponent />
    </>
  );
};
export default AquaOrderIndex;
