import axios from "axios"

const BASE = process.env.NEXT_PUBLIC_API_URL;
const createCodOrder = (data) => axios.post(`${BASE}/order/cod`, data)

const orderServiceOperations = {
createCodOrder
}

export default orderServiceOperations