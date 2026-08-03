export const openDirectInvoiceAccess = async ({
  invoiceId,
  firebaseIdToken,
  loginDirectInvoiceAccess,
}) => {
  if (!invoiceId) throw new Error("Invoice ID is required.");
  if (!firebaseIdToken) throw new Error("Google verification is required.");
  if (typeof loginDirectInvoiceAccess !== "function") {
    throw new Error("Invoice access is unavailable.");
  }

  await loginDirectInvoiceAccess(invoiceId, firebaseIdToken);
  return true;
};
