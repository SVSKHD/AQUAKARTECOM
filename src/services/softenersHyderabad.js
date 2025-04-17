import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const getSofteners = () =>axios.get(`${BASE}/softeners-hyderabad`)

const AquaSoftnerOperations = {
getSofteners
}
export default AquaSoftnerOperations