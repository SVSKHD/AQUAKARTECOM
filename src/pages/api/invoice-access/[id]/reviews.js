import {
  backendInvoiceRequest,
  getInvoiceAccessToken,
  isSameOriginRequest,
  pipeJsonResponse,
} from "@/utils/server/invoiceAccess";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
  if (!isSameOriginRequest(req)) {
    return res
      .status(403)
      .json({ success: false, message: "Invalid request origin" });
  }
  const token = getInvoiceAccessToken(req);
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Invoice access is required" });
  }
  try {
    const response = await backendInvoiceRequest(
      `/${encodeURIComponent(String(req.query.id || ""))}/reviews`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(req.body || {}),
      },
    );
    return pipeJsonResponse(response, res);
  } catch {
    return res.status(502).json({
      success: false,
      message: "Invoice review service is unavailable",
    });
  }
}
