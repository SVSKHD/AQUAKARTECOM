import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;

const createCodOrder = (data) => axios.post(`${BASE}/order/cod`, data);
const getOrdersByUserId = (id, token) => {
  return axios.get(`${BASE}/orders/user/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
const getOrdersByTransactionId = (id, token) => {
  return axios.get(`${BASE}/order/transaction-id/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
const createPhonePePayOrder = (data) => axios.post(`${BASE}/order/pay`, data);

const verifyPayment = (id, token) => {
  return axios.post(`${BASE}/phonepe-verify/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
const orderServiceOperations = {
  createCodOrder,
  createPhonePePayOrder,
  verifyPayment,
  getOrdersByUserId,
  getOrdersByTransactionId,
};

export default orderServiceOperations;
