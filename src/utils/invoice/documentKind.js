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
