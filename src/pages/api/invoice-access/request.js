import {
  backendInvoiceRequest,
  pipeJsonResponse,
} from "@/utils/server/invoiceAccess";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
  try {
    const response = await backendInvoiceRequest("/request-access", {
      method: "POST",
      body: JSON.stringify({ phone: req.body?.phone }),
    });
    return pipeJsonResponse(response, res);
  } catch {
    return res
      .status(502)
      .json({ success: false, message: "Email service is unavailable" });
  }
}
