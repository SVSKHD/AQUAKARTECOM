import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;

const post = (path, payload) => axios.post(`${BASE}${path}`, payload);

const LeadIntakeService = {
  submitPlanner(payload) {
    return post("/leads/planner", payload);
  },

  submitEnquiry(payload) {
    return post("/leads/enquiry", payload);
  },

  submitProductConsultation(payload) {
    return post("/leads/product-consultation", payload);
  },
};

export default LeadIntakeService;
