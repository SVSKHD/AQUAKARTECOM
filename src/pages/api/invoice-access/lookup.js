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
  const firebaseIdToken = String(req.body?.firebaseIdToken || "");
  const backendSessionToken = String(req.body?.backendSessionToken || "");
  if (!firebaseIdToken || !backendSessionToken) {
    return res
      .status(401)
      .json({ success: false, message: "Google login is required" });
  }
  try {
    const response = await backendInvoiceRequest("/lookup", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firebaseIdToken}`,
        "X-Aquakart-Session": backendSessionToken,
      },
      body: JSON.stringify({ phone: req.body?.phone }),
    });
    return pipeJsonResponse(response, res);
  } catch {
    return res
      .status(502)
      .json({ success: false, message: "Invoice service is unavailable" });
  }
}
