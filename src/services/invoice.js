import axios from "axios";

const BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const findInvoicesByPhone = async (phone) => {
  const response = await axios.post(`${BASE}/crm/public/invoices/lookup`, {
    phone,
  });
  return response.data;
};

const InvoiceServiceOperations = { findInvoicesByPhone };

export default InvoiceServiceOperations;
