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

  const firebaseIdToken = String(req.body?.firebaseIdToken || "");
  if (!firebaseIdToken) {
    return res
      .status(401)
      .json({ success: false, message: "Google login is required" });
  }

  try {
    const response = await backendInvoiceRequest("/login", {
      method: "POST",
      headers: { Authorization: `Bearer ${firebaseIdToken}` },
      body: JSON.stringify({ phone: req.body?.phone }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json(payload);

    res.setHeader(
      "Set-Cookie",
      invoiceAccessCookie(payload.accessToken, payload.expiresIn || 1800),
    );
    return res.status(200).json({
      success: true,
      authenticated: true,
      invoiceCount: payload.invoiceCount,
      redirectInvoiceId: payload.redirectInvoiceId,
      user: payload.user,
      message: payload.message,
    });
  } catch {
    return res
      .status(502)
      .json({ success: false, message: "Invoice service is unavailable" });
  }
}
