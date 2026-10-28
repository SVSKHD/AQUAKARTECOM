import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please sign in again.";

const getServerMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.response?.data?.msg ||
  error?.message;

const isAuthFailure = (error) => {
  const status = error?.response?.status;
  const message = `${getServerMessage(error) || ""}`.toLowerCase();

  return (
    status === 401 ||
    status === 403 ||
    message.includes("token is not valid") ||
    message.includes("invalid token") ||
    message.includes("jwt")
  );
};

const throwAuthError = (error) => {
  throw {
    message: SESSION_EXPIRED_MESSAGE,
    authError: true,
    status: error?.response?.status,
  };
};

const authHeaders = (token, extra = {}) => ({
  ...extra,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const createCheckoutQuote = async (data, token) => {
  try {
    const response = await axios.post(`${BASE}/checkout/quote`, data, {
      headers: authHeaders(token),
    });
    return response.data;
  } catch (error) {
    if (isAuthFailure(error)) throwAuthError(error);
    throw new Error(getServerMessage(error) || "Unable to validate checkout");
  }
};

const createCheckoutCodOrder = async (data, token) => {
  try {
    const response = await axios.post(`${BASE}/checkout/orders/cod`, data, {
      headers: authHeaders(token),
    });
    return response.data;
  } catch (error) {
    if (isAuthFailure(error)) throwAuthError(error);
    throw new Error(getServerMessage(error) || "Unable to create COD order");
  }
};

// Opening PhonePe must never hang the checkout: give up after this long.
const PAYMENT_START_TIMEOUT_MS = 30000;
const PAYMENT_STATUS_TIMEOUT_MS = 15000;

const createCheckoutPayment = async (data, token, idempotencyKey) => {
  try {
    const response = await axios.post(`${BASE}/payments`, data, {
      headers: authHeaders(token, { "Idempotency-Key": idempotencyKey }),
      timeout: PAYMENT_START_TIMEOUT_MS,
    });
    return response.data;
  } catch (error) {
    if (isAuthFailure(error)) throwAuthError(error);
    if (error?.code === "ECONNABORTED")
      throw new Error(
        "PhonePe took too long to open. Nothing was charged. Please try again.",
      );
    // Keep the status: 409 means the checkout session expired or was used.
    throw Object.assign(
      new Error(getServerMessage(error) || "Unable to initiate payment"),
      { status: error?.response?.status },
    );
  }
};

// Status of a payment attempt created by createCheckoutPayment (GET /payments/:id).
const getCheckoutPayment = async (id, token, config = {}) => {
  try {
    const response = await axios.get(`${BASE}/payments/${id}`, {
      headers: authHeaders(token),
      timeout: PAYMENT_STATUS_TIMEOUT_MS,
      ...config,
    });
    return response.data;
  } catch (error) {
    if (config?.signal?.aborted) throw error;
    if (isAuthFailure(error)) throwAuthError(error);
    throw new Error(getServerMessage(error) || "Unable to check payment");
  }
};

const createCodOrder = async (data) => {
  try {
    const response = await axios.post(`${BASE}/order/cod`, data);
    return response.data;
  } catch (error) {
    const message = getServerMessage(error) || "Unknown error";
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
    if (isAuthFailure(error)) {
      throwAuthError(error);
    }

    const status = error?.response?.status;
    const serverMsg = getServerMessage(error);
    throw new Error(
      serverMsg || `Error fetching orders (${status || "unknown"})`,
    );
  }
};

const getServiceReminders = async (token) => {
  try {
    const response = await axios.get(`${BASE}/service-reminders/mine`, {
      headers: authHeaders(token),
    });
    return response.data;
  } catch (error) {
    if (isAuthFailure(error)) throwAuthError(error);
    throw new Error(
      getServerMessage(error) || "Unable to fetch service reminders",
    );
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
    if (config?.signal?.aborted) throw error;

    if (isAuthFailure(error)) {
      throwAuthError(error);
    }

    const status = error?.response?.status;
    const serverMsg = getServerMessage(error);
    throw new Error(
      serverMsg || `Error fetching order (${status || "unknown"})`,
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
    if (isAuthFailure(error)) {
      throwAuthError(error);
    }

    const serverMsg = getServerMessage(error);
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
    if (isAuthFailure(error)) {
      throwAuthError(error);
    }

    throw new Error(`Error verifying payment: ${getServerMessage(error)}`);
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
    if (isAuthFailure(error)) {
      throwAuthError(error);
    }

    throw new Error(`Error verifying payment: ${getServerMessage(error)}`);
  }
};

const orderServiceOperations = {
  createCheckoutQuote,
  createCheckoutCodOrder,
  createCheckoutPayment,
  getCheckoutPayment,
  createCodOrder,
  createPhonePePayOrder,
  verifyPayment,
  getOrdersByUserId,
  getServiceReminders,
  getOrdersByTransactionId,
  updateOrderStatus,
};

export default orderServiceOperations;
