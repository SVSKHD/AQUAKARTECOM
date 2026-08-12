const STATIC_PAGE_KEYS = {
  "/": "home",
  "/shop": "shop",
  "/blogs": "blogs",
  "/categories": "categories",
  "/about": "about",
  "/contact-us": "contact-us",
  "/compare": "compare",
  "/privacy-policy": "privacy-policy",
  "/terms-and-conditions": "terms-and-conditions",
  "/shipping-policy": "shipping-policy",
  "/softener-planner": "softener-planner",
  "/softeners-hyderabad": "softeners-hyderabad",
};

export const getManagedSeoPageKey = (pathname = "") =>
  STATIC_PAGE_KEYS[pathname] || null;

export const normalizeManagedSeo = (record) => {
  if (!record || record.active === false) return null;

  return {
    title: record.title,
    description: record.description,
    keywords: Array.isArray(record.keywords)
      ? record.keywords.join(", ")
      : record.keywords || "",
    url: record.canonicalUrl || record.route,
    photos: record.ogImage || record.twitterImage,
    robots: record.robots,
    ogTitle: record.ogTitle,
    ogDescription: record.ogDescription,
    ogImage: record.ogImage,
    twitterTitle: record.twitterTitle,
    twitterDescription: record.twitterDescription,
    twitterImage: record.twitterImage,
    schemaJson: record.schemaJson,
    follow: !String(record.robots || "").includes("nofollow"),
  };
};
