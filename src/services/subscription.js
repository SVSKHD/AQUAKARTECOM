import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const emailSubscribe = async (email) =>
  axios.post(`${BASE}/subscription/create-subscritption`, email);

const AquaEmailSubscriptions = {
  emailSubscribe,
};
export default AquaEmailSubscriptions;
