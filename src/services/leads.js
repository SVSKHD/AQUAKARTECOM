import axios from "axios";

const BASE = String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const pageContext = () => {
  if (typeof window === "undefined") {
    return { page_url: "", page_path: "", referrer: "" };
  }
  return {
    page_url: window.location.href,
    page_path: window.location.pathname,
    referrer: document.referrer || "",
  };
};

const post = (path, payload = {}) =>
  axios.post(`${BASE}${path}`, {
    ...payload,
    ...pageContext(),
  });

const SubmitPlanner = (payload) => post("/leads/planner", payload);
const SubmitEnquiry = (payload) => post("/leads/enquiry", payload);
const SubmitProductConsultation = (payload) =>
  post("/leads/product-consultation", payload);

const LeadServiceOperations = {
  SubmitPlanner,
  SubmitEnquiry,
  SubmitProductConsultation,
};

export default LeadServiceOperations;
