import type { Metadata } from "next";
import PaymentReturn from "./PaymentReturn";

export const metadata: Metadata = {
  title: "Payment",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const first = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) || "";

// Opened only inside the PhonePe popup. It never renders order details: it hands the
// transaction id back to the Aqua tab, which asks the server for the real status.
export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const q = await searchParams;
  const transactionId =
    first(q.transactionId) ||
    first(q.txn) ||
    first(q.merchantTransactionId) ||
    first(q.id);
  return <PaymentReturn transactionId={transactionId} />;
}
