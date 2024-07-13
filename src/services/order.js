import axios from "axios";


const BASE = process.env.NEXT_PUBLIC_API_URL;
const createCodOrder = (data) => axios.post(`${BASE}/order/cod`, data);
const getOrder = (id) => axios.get(`${BASE}/order/${id}`)

const orderServiceOperations = {
  createCodOrder,
  getOrder
};

export default orderServiceOperations;
