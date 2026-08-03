import {
  backendInvoiceRequest,
  getInvoiceAccessToken,
  pipeJsonResponse,
} from "@/utils/server/invoiceAccess";

export default async function handler(req, res) {
  res.setHeader(
    "Cache-Control",
    "private, no-store, no-cache, max-age=0, must-revalidate",
  );
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
  const token = getInvoiceAccessToken(req);
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Invoice access is required" });
  try {
    const response = await backendInvoiceRequest(
      `/${encodeURIComponent(String(req.query.id || ""))}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return pipeJsonResponse(response, res);
  } catch {
    return res
      .status(502)
      .json({ success: false, message: "Invoice service is unavailable" });
  }
}
