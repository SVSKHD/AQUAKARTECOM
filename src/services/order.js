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
const createPhonePePayOrder = (data) => axios.post(`${BASE}/order/pay`, data);

const orderServiceOperations = {
  createCodOrder,
  createPhonePePayOrder,
  getOrdersByUserId,
};

export default orderServiceOperations;
