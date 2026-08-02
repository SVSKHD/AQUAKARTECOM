import axios from "axios";

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
  const response = await axios.post("/api/invoice-access/lookup", {
    phone: assertPhone(phone),
    firebaseIdToken,
    backendSessionToken,
  });
  return response.data;
};

const requestInvoiceAccess = async (phone) => {
  const response = await axios.post("/api/invoice-access/request", {
    phone: assertPhone(phone),
  });
  return response.data;
};

const exchangeInvoiceToken = async (token) => {
  const response = await axios.post("/api/invoice-access/exchange", { token });
  return response.data;
};

export const directInvoiceLoginPath = (invoiceId) =>
  `/api/invoice-access/${encodeURIComponent(String(invoiceId || ""))}/login`;

const loginDirectInvoiceAccess = async (
  invoiceId,
  firebaseIdToken,
  backendSessionToken,
) => {
  if (!invoiceId) throw new Error("Invoice ID is required.");
  const response = await axios.post(directInvoiceLoginPath(invoiceId), {
    firebaseIdToken,
    backendSessionToken,
  });
  return response.data;
};

const loginInvoiceAccess = async (
  phone,
  firebaseIdToken,
  backendSessionToken,
) => {
  const response = await axios.post("/api/invoice-access/login", {
    phone: assertPhone(phone),
    firebaseIdToken,
    backendSessionToken,
  });
  return response.data;
};

const getAccessibleInvoices = async () => {
  const response = await axios.get("/api/invoice-access");
  return response.data;
};

const emailInvoice = async (invoiceId) => {
  const response = await axios.post(
    `/api/invoice-access/${encodeURIComponent(invoiceId)}/share/email`,
  );
  return response.data;
};

const claimInvoice = async (invoiceId, emailAction) => {
  const response = await axios.post(
    `/api/invoice-access/${encodeURIComponent(invoiceId)}/claim`,
    { emailAction },
  );
  return response.data;
};

const updateInvoiceEmail = async (invoiceId) => {
  const response = await axios.patch(
    `/api/invoice-access/${encodeURIComponent(invoiceId)}/email`,
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
    `/api/invoice-access/${encodeURIComponent(invoiceId)}/share/email`,
    {
      recipientEmail: normalizeInvoiceEmail(recipientEmail),
      shareRequestId,
    },
  );
  return response.data;
};

const getWhatsAppSharingStatus = async (invoiceId) => {
  const response = await axios.get(
    `/api/invoice-access/${encodeURIComponent(invoiceId)}/share/whatsapp`,
  );
  return response.data;
};

const InvoiceServiceOperations = {
  lookupInvoices,
  requestInvoiceAccess,
  exchangeInvoiceToken,
  loginInvoiceAccess,
  loginDirectInvoiceAccess,
  getAccessibleInvoices,
  emailInvoice,
  claimInvoice,
  updateInvoiceEmail,
  shareInvoiceByEmail,
  getWhatsAppSharingStatus,
};

export default InvoiceServiceOperations;
