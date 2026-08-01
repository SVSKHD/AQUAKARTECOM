export const INVOICE_ACCESS_COOKIE = "aquakart_invoice_access";

export const getInvoiceApiBase = () =>
  (
    process.env.INVOICE_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.aquakart.co.in/v1"
  ).replace(/\/$/, "");

export const backendInvoiceRequest = async (path, options = {}) =>
  fetch(`${getInvoiceApiBase()}/invoices/public${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

export const pipeJsonResponse = async (response, res) => {
  const payload = await response.json().catch(() => ({
    success: false,
    message: "The invoice service returned an invalid response",
  }));
  return res.status(response.status).json(payload);
};

export const invoiceAccessCookie = (token, maxAge = 1800) => {
  const parts = [
    `${INVOICE_ACCESS_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Number(maxAge) || 0)}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
};

export const getInvoiceAccessToken = (req) =>
  req.cookies?.[INVOICE_ACCESS_COOKIE] || "";

export const isSameOriginRequest = (req) => {
  const origin = req.headers.origin;
  if (!origin) return true;
  const forwardedHost = String(req.headers["x-forwarded-host"] || "")
    .split(",")[0]
    .trim();
  const host = forwardedHost || req.headers.host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
};
