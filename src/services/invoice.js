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
    itemCount: products.length,
    paidStatus:
      invoice.paidStatus ??
      invoice.paid_status ??
      invoice.payment_status ??
      "unpaid",
  };
};

const findInvoicesByPhone = async (phone) => {
  const normalizedPhone = normalizePhone(phone);

  if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
    throw new Error("Please enter a valid 10-digit Indian mobile number.");
  }

  const response = await axios.get(`${BASE}/crm/admin/invoice`, {
    params: { phone: normalizedPhone },
    headers: { Accept: "application/json" },
  });

  const payload = response.data?.data ?? response.data?.invoice ?? response.data;
  const invoices = Array.isArray(payload) ? payload : payload ? [payload] : [];
  const purchases = invoices.map(normalizeInvoice).filter(Boolean);
  const found = purchases.length > 0;

  return {
    found,
    purchases,
    message: found
      ? purchases.length === 1
        ? "We found 1 invoice linked to this phone number."
        : `We found ${purchases.length} invoices linked to this phone number.`
      : "No invoice was found for this phone number.",
  };
};

const InvoiceServiceOperations = { findInvoicesByPhone };

export default InvoiceServiceOperations;
