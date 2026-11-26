import { getDocumentStatus } from "@/utils/invoice/documentKind";

/**
 * Rubber-stamp seal drawn into the public invoice PDF. Built on the same
 * getDocumentStatus() the invoice page legend uses, so the page and the PDF
 * always agree. Colours match the CRM PDF (quotation blue, paid green,
 * PO purple, due orange); partial and cancelled exist only on the storefront.
 */
const STAMPS = {
  quotation: {
    word: "QUOTATION",
    caption: "NOT A TAX INVOICE",
    rgb: [29, 78, 216],
  },
  paid: { word: "PAID", caption: "PAYMENT RECEIVED", rgb: [21, 128, 61] },
  partial: {
    word: "PARTIAL",
    caption: "PART PAYMENT RECEIVED",
    rgb: [180, 83, 9],
  },
  po: { word: "PO", caption: "PURCHASE ORDER", rgb: [109, 40, 217] },
  unpaid: { word: "DUE", caption: "PAYMENT PENDING", rgb: [194, 65, 12] },
  cancelled: { word: "CANCELLED", caption: "NOT VALID", rgb: [185, 28, 28] },
};

export const getInvoiceStamp = (invoice = {}) => {
  const status = getDocumentStatus(invoice);
  const key = status?.key in STAMPS ? status.key : "unpaid";
  const stamp = { key, label: status?.label || "Unpaid", ...STAMPS[key] };
  if (key === "paid" && invoice.po) stamp.caption = "PURCHASE ORDER";
  return stamp;
};

export default getInvoiceStamp;
