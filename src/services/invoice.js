import axios from "axios";

const BASE = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.aquakart.co.in/v1"
).replace(/\/$/, "");

const normalizePhone = (value = "") => {
  const digits = String(value).replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits.slice(0, 10);
};

const normalizeInvoice = (invoice) => {
  if (!invoice || typeof invoice !== "object" || Array.isArray(invoice)) {
    return null;
  }

  const id = invoice._id ?? invoice.id ?? invoice.invoice_id;
  if (!id) return null;

  const products = Array.isArray(invoice.products) ? invoice.products : [];

  return {
    id: String(id),
    invoiceNo:
      invoice.invoiceNo ??
      invoice.invoice_no ??
      invoice.invoice_number ??
      "Invoice",
    date:
      invoice.date ??
      invoice.issue_date ??
      invoice.createdAt ??
      invoice.created_at ??
      null,
    itemCount: Number.isFinite(Number(invoice.itemCount))
      ? Number(invoice.itemCount)
      : products.length,
    paidStatus:
      invoice.paidStatus ??
      invoice.paid_status ??
      invoice.payment_status ??
      "unpaid",
  };
};

const findInvoicesByPhone = async (phone, token) => {
  const normalizedPhone = normalizePhone(phone);

  if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
    throw new Error("Please enter a valid 10-digit Indian mobile number.");
  }

  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await axios.get(`${BASE}/crm/public/invoices/phone`, {
    params: { phone: normalizedPhone },
    headers,
  });

  const payload = response.data || {};
  const invoices = Array.isArray(payload.purchases) ? payload.purchases : [];

  return {
    found: Boolean(payload.found),
    requiresLogin: Boolean(payload.requiresLogin),
    purchases: invoices.map(normalizeInvoice).filter(Boolean),
    message: payload.message || "",
    linkedCount: Number(payload.linkedCount || 0),
    restrictedCount: Number(payload.restrictedCount || 0),
  };
};

const InvoiceServiceOperations = { findInvoicesByPhone };

export default InvoiceServiceOperations;
