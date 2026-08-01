import {
  backendInvoiceRequest,
  invoiceAccessCookie,
  isSameOriginRequest,
} from "@/utils/server/invoiceAccess";

export default async function handler(req, res) {
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
  try {
    const response = await backendInvoiceRequest("/exchange", {
      method: "POST",
      body: JSON.stringify({ token: req.body?.token }),
    });
    const payload = await response.json();
    if (!response.ok) return res.status(response.status).json(payload);
    res.setHeader(
      "Set-Cookie",
      invoiceAccessCookie(payload.accessToken, payload.expiresIn || 1800),
    );
    return res
      .status(200)
      .json({ success: true, expiresIn: payload.expiresIn || 1800 });
  } catch {
    return res
      .status(502)
      .json({ success: false, message: "Unable to verify invoice access" });
  }
}
