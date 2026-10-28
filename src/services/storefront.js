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

// Public "recently bought" demand feed (product, coarse locality, hour-rounded
// time; no prices or customer details). The server caches it for 60s.
// The feed is optional: any failure resolves null instead of throwing.
export const getRecentPurchases = async (
  { area, limit, days } = {},
  config = {},
) => {
  const params = {};
  const where = String(area || "").trim();
  if (where) params.area = where.slice(0, 60);
  if (limit) params.limit = limit;
  if (days) params.days = days;
  try {
    const response = await axios.get(
      `${API_BASE}/storefront/recent-purchases`,
      { timeout: 5000, ...config, params },
    );
    return response?.data?.data || null;
  } catch {
    return null;
  }
};
