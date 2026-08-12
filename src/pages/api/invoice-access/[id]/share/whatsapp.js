import {
  backendInvoiceRequest,
  getInvoiceAccessToken,
  pipeJsonResponse,
} from "@/utils/server/invoiceAccess";

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
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
      {
        method: req.method,
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return pipeJsonResponse(response, res);
  } catch {
    return res.status(502).json({
      success: false,
      message:
        req.method === "POST"
          ? "WhatsApp delivery is unavailable"
          : "WhatsApp sharing status is unavailable",
    });
  }
}
