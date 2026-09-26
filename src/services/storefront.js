import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.aquakart.co.in/v1";

export const getStorefrontStats = async (config = {}) => {
  const response = await axios.get(`${API_BASE}/storefront/stats`, config);
  return response?.data?.data || null;
};

export const getStorefrontStatsServerSide = async () => {
  try {
    return await getStorefrontStats({ timeout: 3000 });
  } catch {
    return null;
  }
};
