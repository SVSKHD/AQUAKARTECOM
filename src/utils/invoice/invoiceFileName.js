const DEFAULT_INVOICE_PDF_FILENAME = "Aquakart-Invoice.pdf";

export const sanitizeInvoiceFilePart = (value) =>
  String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "");

// `kind` names the document ("Receipt" once paid); defaults to "Invoice".
export const getInvoicePdfFileName = (reference, kind = "Invoice") => {
  const safeReference = sanitizeInvoiceFilePart(reference);
  const safeKind = sanitizeInvoiceFilePart(kind) || "Invoice";
  if (!safeReference)
    return safeKind === "Invoice"
      ? DEFAULT_INVOICE_PDF_FILENAME
      : `Aquakart-${safeKind}.pdf`;
  return `Aquakart-${safeKind}-${safeReference}.pdf`;
};

export default getInvoicePdfFileName;
