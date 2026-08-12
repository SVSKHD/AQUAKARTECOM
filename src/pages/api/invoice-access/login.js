import {
  backendInvoiceRequest,
  invoiceAccessCookie,
  isInvoiceBackendTimeout,
  isSameOriginRequest,
} from "@/utils/server/invoiceAccess";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
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
  const backendSessionToken = String(req.body?.backendSessionToken || "");
  if (!firebaseIdToken || !backendSessionToken) {
    return res
      .status(401)
      .json({ success: false, message: "Google login is required" });
  }

  try {
    const response = await backendInvoiceRequest("/login", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firebaseIdToken}`,
        "X-Aquakart-Session": backendSessionToken,
      },
      body: JSON.stringify({ phone: req.body?.phone }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json(payload);

    res.setHeader(
      "Set-Cookie",
      payload.accessToken
        ? invoiceAccessCookie(payload.accessToken, payload.expiresIn || 1800)
        : invoiceAccessCookie("", 0),
    );
    return res.status(200).json({
      success: true,
      authenticated: true,
      found: payload.found,
      invoiceCount: payload.invoiceCount,
      invoices: payload.invoices || [],
      redirectInvoiceId: payload.redirectInvoiceId,
      user: payload.user,
      message: payload.message,
    });
  } catch (error) {
    if (isInvoiceBackendTimeout(error)) {
      return res.status(504).json({
        success: false,
        message: "Invoice lookup took too long. Please retry in a few seconds.",
      });
    }
    return res
      .status(502)
      .json({ success: false, message: "Invoice service is unavailable" });
  }
}
