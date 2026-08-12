import axios from "axios";

import { normalizeManagedSeo } from "@/utils/managedSeo";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.aquakart.co.in/v1";

export const getManagedSeo = async (pageKey, config = {}) => {
  if (!pageKey) return null;
  const response = await axios.get(
    `${API_BASE}/seo/public/${encodeURIComponent(pageKey)}`,
    config,
  );
  return normalizeManagedSeo(response?.data?.data);
};

export const getManagedSeoServerSide = async (pageKey) => {
  try {
    return await getManagedSeo(pageKey, { timeout: 3000 });
  } catch {
    return null;
  }
};
