import axios from "axios";

export const normalizeInvoicePhone = (value = "") => {
  const digits = String(value).replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits.slice(0, 10);
};

const assertPhone = (phone) => {
  const normalized = normalizeInvoicePhone(phone);
  if (!/^[6-9]\d{9}$/.test(normalized)) {
    throw new Error("Please enter a valid 10-digit Indian mobile number.");
  }
  return normalized;
};

const lookupInvoices = async (phone) => {
  const response = await axios.post("/api/invoice-access/lookup", {
    phone: assertPhone(phone),
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

const getAccessibleInvoices = async () => {
  const response = await axios.get("/api/invoice-access");
  return response.data;
};

const emailInvoice = async (invoiceId) => {
  const response = await axios.post(
    `/api/invoice-access/${encodeURIComponent(invoiceId)}/email`,
  );
  return response.data;
};

const InvoiceServiceOperations = {
  lookupInvoices,
  requestInvoiceAccess,
  exchangeInvoiceToken,
  getAccessibleInvoices,
  emailInvoice,
};

export default InvoiceServiceOperations;
