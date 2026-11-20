const PAID_STATUSES = new Set(["paid", "completed", "success"]);

export const isPaidStatus = (status) =>
  PAID_STATUSES.has(String(status || "").toLowerCase());

/**
 * What a public bill is called. A sale shows as an invoice while payment is
 * pending and as a receipt once it is paid; quotations and POs keep their names.
 */
export const getDocumentKind = (invoice = {}) => {
  if (invoice.quotation)
    return { type: "quotation", name: "Quotation", title: "Sales Quotation" };
  if (invoice.po)
    return { type: "po", name: "Purchase Order", title: "Purchase Order" };

  const name = isPaidStatus(invoice.paid_status) ? "Receipt" : "Invoice";
  return {
    type: name.toLowerCase(),
    name,
    title: `${invoice.gst ? "GST" : "Retail"} Tax ${name}`,
  };
};

export default getDocumentKind;

const PARTIAL_STATUSES = new Set([
  "partial",
  "partially_paid",
  "partially paid",
]);
const CANCELLED_STATUSES = new Set([
  "cancelled",
  "canceled",
  "void",
  "refunded",
]);

/** Every stamp the page can show, in the order the legend lists them. */
export const DOCUMENT_STATUSES = [
  {
    key: "paid",
    label: "Paid",
    hint: "Payment received. This is your receipt.",
  },
  {
    key: "unpaid",
    label: "Unpaid",
    hint: "Payment is still due on this invoice.",
  },
  {
    key: "partial",
    label: "Partial",
    hint: "Part of the amount is paid; the rest is due.",
  },
  {
    key: "quotation",
    label: "Quotation",
    hint: "A price offer. Nothing is billed until you confirm.",
  },
  {
    key: "po",
    label: "PO",
    hint: "Purchase order: pay by bank transfer quoting this number.",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    hint: "This document is no longer valid.",
  },
];

/**
 * The single stamp a bill carries. A quotation is always a quotation; a PO
 * reads as PO until it is paid; a cancelled bill wins over anything else.
 */
export const getDocumentStatus = (invoice = {}) => {
  const raw = String(invoice.paid_status || "")
    .trim()
    .toLowerCase();
  let key;
  if (CANCELLED_STATUSES.has(raw)) key = "cancelled";
  else if (invoice.quotation) key = "quotation";
  else if (isPaidStatus(raw)) key = "paid";
  else if (PARTIAL_STATUSES.has(raw)) key = "partial";
  else if (invoice.po) key = "po";
  else key = "unpaid";
  return DOCUMENT_STATUSES.find((status) => status.key === key);
};
