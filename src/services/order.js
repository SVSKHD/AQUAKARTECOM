import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;

const createCodOrder = async (data) => {
  try {
    const response = await axios.post(`${BASE}/order/cod`, data);
    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Unknown error";
    throw new Error(`Error creating COD order: ${message}`);
  }
};

const getOrdersByUserId = async (id, token) => {
  try {
    const response = await axios.get(`${BASE}/orders/user/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching orders by user ID: ${error.message}`);
  }
};

const getOrdersByTransactionId = async (id, token, config = {}) => {
  try {
    const response = await axios.get(`${BASE}/order/transaction-id/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      ...config,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      `Error fetching orders by transaction ID: ${error.message}`,
    );
  }
};

const createPhonePePayOrder = async (data, token) => {
  try {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await axios.post(`${BASE}/order/pay`, data, { headers });
    return response.data;
  } catch (error) {
    const serverMsg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.response?.data?.msg;
    const status = error?.response?.status;
    const detail = serverMsg
      ? `${status || "Error"}: ${serverMsg}`
      : error?.message || "Payment initiation failed";
    console.error("PhonePe pay order error:", {
      status,
      data: error?.response?.data,
      message: error?.message,
    });
    throw new Error(detail);
  }
};

const verifyPayment = async (id, token) => {
  try {
    const response = await axios.put(
      `${BASE}/order/user/${id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw new Error(`Error verifying payment: ${error.message}`);
  }
};

const updateOrderStatus = async (id, token, data) => {
  try {
    const response = await axios.put(`${BASE}/phonepe-verify/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error verifying payment: ${error.message}`);
  }
};

const orderServiceOperations = {
  createCodOrder,
  createPhonePePayOrder,
  verifyPayment,
  getOrdersByUserId,
  getOrdersByTransactionId,
  updateOrderStatus,
};

export default orderServiceOperations;
