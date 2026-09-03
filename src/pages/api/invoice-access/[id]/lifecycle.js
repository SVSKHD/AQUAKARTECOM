import {
  backendInvoiceRequest,
  getInvoiceAccessToken,
  isSameOriginRequest,
  pipeJsonResponse,
} from "@/utils/server/invoiceAccess";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
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
      `/${encodeURIComponent(String(req.query.id || ""))}/lifecycle`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          latestUpdatesConsent: req.body?.latestUpdatesConsent,
          regenerationReminderConsent: req.body?.regenerationReminderConsent,
          serviceReminderConsent: req.body?.serviceReminderConsent,
        }),
      },
    );
    return pipeJsonResponse(response, res);
  } catch {
    return res.status(502).json({
      success: false,
      message: "Invoice preference service is unavailable",
    });
  }
}
