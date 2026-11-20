import {
  backendInvoiceRequest,
  clientIp,
  createVisitorLimiter,
  pipeJsonResponse,
} from "@/utils/server/invoiceAccess";

// Each visitor gets 30 quick views per 15 minutes (the backend sees only this
// server's IP, so it can't tell visitors apart).
const allowVisitor = createVisitorLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
});

// Logged-out quick view of an invoice for the "Login to download invoice"
// screen. Needs no invoice-access token: the backend returns only
// non-personal fields (number, date, status, total, product names, masked
// first name).
export default async function handler(req, res) {
  res.setHeader(
    "Cache-Control",
    "private, no-store, no-cache, max-age=0, must-revalidate",
  );
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
  if (!allowVisitor(clientIp(req))) {
    res.setHeader("Retry-After", "900");
    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  }
  const id = String(req.query.id || "");
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invoice not found" });
  }
  try {
    const response = await backendInvoiceRequest(
      `/${encodeURIComponent(id)}/preview`,
    );
    return pipeJsonResponse(response, res);
  } catch {
    return res
      .status(502)
      .json({ success: false, message: "Invoice service is unavailable" });
  }
}
