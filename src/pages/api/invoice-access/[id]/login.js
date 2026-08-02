import {
  backendInvoiceRequest,
  invoiceAccessCookie,
  isSameOriginRequest,
} from "@/utils/server/invoiceAccess";

const normalizeInvoiceId = (value) => {
  const id = Array.isArray(value) ? value[0] : value;
  if (typeof id !== "string") return "";
  const normalized = id.trim();
  return normalized && normalized.length <= 160 ? normalized : "";
};

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

  const invoiceId = normalizeInvoiceId(req.query.id);
  const firebaseIdToken = String(req.body?.firebaseIdToken || "");
  const backendSessionToken = String(req.body?.backendSessionToken || "");
  if (!invoiceId) {
    return res
      .status(404)
      .json({ success: false, message: "Invoice not found" });
  }
  if (!firebaseIdToken || !backendSessionToken) {
    return res
      .status(401)
      .json({ success: false, message: "Google login is required" });
  }

  try {
    const response = await backendInvoiceRequest(
      `/${encodeURIComponent(invoiceId)}/login`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firebaseIdToken}`,
          "X-Aquakart-Session": backendSessionToken,
        },
      },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json(payload);

    res.setHeader(
      "Set-Cookie",
      invoiceAccessCookie(payload.accessToken, payload.expiresIn || 1800),
    );
    return res.status(200).json({
      success: true,
      authenticated: true,
      redirectInvoiceId: payload.redirectInvoiceId,
      invoice: payload.invoice,
      message: payload.message,
    });
  } catch {
    return res
      .status(502)
      .json({ success: false, message: "Invoice service is unavailable" });
  }
}
