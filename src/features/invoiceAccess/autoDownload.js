// "Login to download invoice": remembers that the visitor asked to download,
// so the full invoice page starts the PDF once access is granted. Stored in
// sessionStorage because Google sign-in may leave the page (redirect flow)
// and come back. One-shot, per invoice, and only valid for a few minutes.

const KEY = "aquakart:invoice-download-after-login";
const MAX_AGE_MS = 10 * 60 * 1000;

const storage = () => {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null; // blocked storage (private mode, embedded browsers)
  }
};

export const requestDownloadAfterLogin = (invoiceId, now = Date.now()) => {
  if (!invoiceId) return;
  try {
    storage()?.setItem(
      KEY,
      JSON.stringify({ invoiceId: String(invoiceId), at: now }),
    );
  } catch {
    // Without storage the visitor can still press Download themselves.
  }
};

// True once for the invoice that asked for it; always clears the request.
export const consumeDownloadAfterLogin = (invoiceId, now = Date.now()) => {
  const store = storage();
  if (!store || !invoiceId) return false;
  let request = null;
  try {
    request = JSON.parse(store.getItem(KEY) || "null");
  } catch {
    request = null;
  }
  if (!request || request.invoiceId !== String(invoiceId)) return false;
  try {
    store.removeItem(KEY);
  } catch {
    // ignore
  }
  return Number.isFinite(request.at) && now - request.at <= MAX_AGE_MS;
};

export const clearDownloadAfterLogin = () => {
  try {
    storage()?.removeItem(KEY);
  } catch {
    // ignore
  }
};
