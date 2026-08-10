export const openDirectInvoiceAccess = async ({
  invoiceId,
  firebaseIdToken,
  loginDirectInvoiceAccess,
  exchangeFirebaseIdToken,
  onStorefrontSession,
}) => {
  if (!invoiceId) throw new Error("Invoice ID is required.");
  if (!firebaseIdToken) throw new Error("Google verification is required.");
  if (typeof loginDirectInvoiceAccess !== "function") {
    throw new Error("Invoice access is unavailable.");
  }
  if (typeof exchangeFirebaseIdToken !== "function") {
    throw new Error("Aquakart sign-in is unavailable.");
  }

  await loginDirectInvoiceAccess(invoiceId, firebaseIdToken);
  const storefrontSession = await exchangeFirebaseIdToken(firebaseIdToken);
  await onStorefrontSession?.(storefrontSession);
  return storefrontSession;
};
