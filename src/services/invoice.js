import axios from "axios";

export const INVOICE_REQUEST_TIMEOUT_MS = 15_000;

const invoiceRequest = (config) =>
  axios({ timeout: INVOICE_REQUEST_TIMEOUT_MS, ...config });

export const normalizeInvoicePhone = (value = "") => {
  const digits = String(value).replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits.slice(0, 10);
};

export const normalizeInvoiceEmail = (value = "") =>
  String(value).trim().toLowerCase();

export const isValidInvoiceEmail = (value = "") => {
  const email = normalizeInvoiceEmail(value);
  return (
    email.length <= 254 &&
    !/[\r\n]/.test(email) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
};

const assertPhone = (phone) => {
  const normalized = normalizeInvoicePhone(phone);
  if (!/^[6-9]\d{9}$/.test(normalized)) {
    throw new Error("Please enter a valid 10-digit Indian mobile number.");
  }
  return normalized;
};

const lookupInvoices = async (phone, firebaseIdToken, backendSessionToken) => {
  const response = await invoiceRequest({
    method: "post",
    url: "/invoice-gateway/lookup",
    data: { phone: assertPhone(phone), firebaseIdToken, backendSessionToken },
  });
  return response.data;
};

const requestInvoiceAccess = async (phone) => {
  const response = await invoiceRequest({
    method: "post",
    url: "/invoice-gateway/request",
    data: { phone: assertPhone(phone) },
  });
  return response.data;
};

const exchangeInvoiceToken = async (token) => {
  const response = await invoiceRequest({
    method: "post",
    url: "/invoice-gateway/exchange",
    data: { token },
  });
  return response.data;
};

export const directInvoiceLoginPath = (invoiceId) =>
  `/invoice-gateway/${encodeURIComponent(String(invoiceId || ""))}/login`;

export const invoiceByIdPath = (invoiceId) =>
  `/invoice-gateway/${encodeURIComponent(String(invoiceId || ""))}`;

export const invoiceProductReviewPath = (invoiceId) =>
  `${invoiceByIdPath(invoiceId)}/reviews`;

const getInvoiceById = async (invoiceId, signal) => {
  if (!invoiceId) throw new Error("Invoice ID is required.");
  const response = await invoiceRequest({
    method: "get",
    url: invoiceByIdPath(invoiceId),
    params: { refresh: Date.now() },
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    signal,
  });
  return response.data;
};

const loginDirectInvoiceAccess = async (invoiceId, firebaseIdToken) => {
  if (!invoiceId) throw new Error("Invoice ID is required.");
  const response = await invoiceRequest({
    method: "post",
    url: directInvoiceLoginPath(invoiceId),
    data: { firebaseIdToken },
  });
  return response.data;
};

const loginInvoiceAccess = async (
  phone,
  firebaseIdToken,
  backendSessionToken,
) => {
  const response = await invoiceRequest({
    method: "post",
    url: "/invoice-gateway/login",
    data: { phone: assertPhone(phone), firebaseIdToken, backendSessionToken },
  });
  return response.data;
};

const getAccessibleInvoices = async () => {
  const response = await axios.get("/invoice-gateway");
  return response.data;
};

const emailInvoice = async (invoiceId) => {
  const response = await axios.post(
    `/invoice-gateway/${encodeURIComponent(invoiceId)}/share/email`,
  );
  return response.data;
};

const claimInvoice = async (invoiceId, emailAction) => {
  const response = await axios.post(
    `/invoice-gateway/${encodeURIComponent(invoiceId)}/claim`,
    { emailAction },
  );
  return response.data;
};

const updateInvoiceEmail = async (invoiceId) => {
  const response = await axios.patch(
    `/invoice-gateway/${encodeURIComponent(invoiceId)}/email`,
    { confirm: true },
  );
  return response.data;
};

const shareInvoiceByEmail = async (
  invoiceId,
  recipientEmail,
  shareRequestId,
) => {
  if (!isValidInvoiceEmail(recipientEmail)) {
    throw new Error("Enter a valid delivery email address.");
  }
  const response = await axios.post(
    `/invoice-gateway/${encodeURIComponent(invoiceId)}/share/email`,
    {
      recipientEmail: normalizeInvoiceEmail(recipientEmail),
      shareRequestId,
    },
  );
  return response.data;
};

const getWhatsAppSharingStatus = async (invoiceId) => {
  const response = await axios.get(
    `/invoice-gateway/${encodeURIComponent(invoiceId)}/share/whatsapp`,
  );
  return response.data;
};

const shareInvoiceByWhatsApp = async (invoiceId) => {
  const response = await invoiceRequest({
    method: "post",
    url: `/invoice-gateway/${encodeURIComponent(invoiceId)}/share/whatsapp`,
  });
  return response.data;
};

const submitProductReview = async (invoiceId, review) => {
  const response = await invoiceRequest({
    method: "post",
    url: invoiceProductReviewPath(invoiceId),
    data: review,
  });
  return response.data;
};

const InvoiceServiceOperations = {
  lookupInvoices,
  requestInvoiceAccess,
  exchangeInvoiceToken,
  loginInvoiceAccess,
  loginDirectInvoiceAccess,
  getInvoiceById,
  getAccessibleInvoices,
  emailInvoice,
  claimInvoice,
  updateInvoiceEmail,
  shareInvoiceByEmail,
  getWhatsAppSharingStatus,
  shareInvoiceByWhatsApp,
  submitProductReview,
};

export default InvoiceServiceOperations;
