import {
  backendInvoiceRequest,
  getInvoiceAccessToken,
  pipeJsonResponse,
} from "@/utils/server/invoiceAccess";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
  const token = getInvoiceAccessToken(req);
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Invoice access is required" });
  }
  try {
    const response = await backendInvoiceRequest(
      `/${encodeURIComponent(String(req.query.id || ""))}/share/whatsapp`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return pipeJsonResponse(response, res);
  } catch {
    return res.status(502).json({
      success: false,
      message: "WhatsApp sharing status is unavailable",
    });
  }
}
