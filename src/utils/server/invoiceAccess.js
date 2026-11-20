export const INVOICE_ACCESS_COOKIE = "aquakart_invoice_access";
export const INVOICE_BACKEND_TIMEOUT_MS = 12_000;

export const getInvoiceApiBase = () =>
  (
    process.env.INVOICE_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.aquakart.co.in/v1"
  ).replace(/\/$/, "");

export const backendInvoiceRequest = async (path, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    INVOICE_BACKEND_TIMEOUT_MS,
  );

  try {
    return await fetch(`${getInvoiceApiBase()}/invoices/public${path}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } finally {
    clearTimeout(timeout);
  }
};

export const isInvoiceBackendTimeout = (error) =>
  error?.name === "AbortError" || error?.name === "TimeoutError";

export const pipeJsonResponse = async (response, res) => {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
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

// Visitor IP for per-visitor limits behind the hosting proxy.
export const clientIp = (req) =>
  String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim() ||
  String(req.headers["x-real-ip"] || "").trim() ||
  req.socket?.remoteAddress ||
  "unknown";

// Small in-memory fixed-window limiter. Per server instance only (best
// effort); the backend keeps its own cap. Returns true when allowed.
export const createVisitorLimiter = ({ windowMs, limit, maxKeys = 5000 }) => {
  const hits = new Map();
  return (key, now = Date.now()) => {
    const entry = hits.get(key);
    if (!entry || now - entry.start >= windowMs) {
      if (hits.size >= maxKeys) {
        for (const [oldKey, old] of hits) {
          if (now - old.start >= windowMs) hits.delete(oldKey);
        }
        if (hits.size >= maxKeys) hits.delete(hits.keys().next().value);
      }
      hits.set(key, { start: now, count: 1 });
      return true;
    }
    entry.count += 1;
    return entry.count <= limit;
  };
};
