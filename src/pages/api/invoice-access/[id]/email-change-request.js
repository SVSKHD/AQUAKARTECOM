import {
  backendInvoiceRequest,
  getInvoiceAccessToken,
  isSameOriginRequest,
  pipeJsonResponse,
} from "@/utils/server/invoiceAccess";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
  const token = getInvoiceAccessToken(req);
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Invoice access is required" });
  if (!isSameOriginRequest(req)) {
    return res
      .status(403)
      .json({ success: false, message: "Invalid request origin" });
  }
  try {
    const response = await backendInvoiceRequest(
      `/${encodeURIComponent(String(req.query.id || ""))}/email-change-request`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestedEmail: req.body?.requestedEmail }),
      },
    );
    return pipeJsonResponse(response, res);
  } catch {
    return res.status(502).json({
      success: false,
      message: "Invoice email request service is unavailable",
    });
  }
}
