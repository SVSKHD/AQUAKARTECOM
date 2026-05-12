import { useEffect } from "react";
import { useRouter } from "next/router";

const AquaInvoice = () => {
  const router = useRouter();
  const { id } = router.query;

  const adminBaseUrl =
    process.env.NEXT_PUBLIC_ADMIN_URL || process.env.NEXT_PUBLIC_API_URL || "";
  const normalizedAdminBaseUrl = adminBaseUrl.replace(/\/$/, "");
  const hasInvoiceId = typeof id === "string" && id.trim().length > 0;
  const canRedirect = normalizedAdminBaseUrl && hasInvoiceId;

  useEffect(() => {
    if (!canRedirect) return;

    const target = `${normalizedAdminBaseUrl}/invoice/${id}`;
    router.replace(target);
  }, [canRedirect, id, normalizedAdminBaseUrl, router]);

  const statusMessage = !hasInvoiceId
    ? "Waiting for invoice id..."
    : !normalizedAdminBaseUrl
      ? "Invoice configuration missing. Set NEXT_PUBLIC_ADMIN_URL (or NEXT_PUBLIC_API_URL)."
      : `Redirecting to invoice... ${id}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-700">
      <p className="text-white text-xl">{statusMessage}</p>
      {!canRedirect && hasInvoiceId ? (
        <p className="text-red-300 text-sm mt-2">
          Unable to continue without a valid admin base URL.
        </p>
      ) : null}
    </div>
  );
};

export default AquaInvoice;
