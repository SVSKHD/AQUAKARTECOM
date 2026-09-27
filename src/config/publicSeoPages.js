export const PUBLIC_SEO_PAGES = [
  { id: "home", label: "Home", pageKey: "home", route: "/", changefreq: "daily", priority: "1.0" },
  { id: "shop", label: "Shop", pageKey: "shop", route: "/shop", changefreq: "daily", priority: "0.9" },
  { id: "categories", label: "Categories", pageKey: "categories", route: "/categories", changefreq: "weekly", priority: "0.8" },
  { id: "blogs", label: "Blogs", pageKey: "blogs", route: "/blogs", changefreq: "weekly", priority: "0.8" },
  { id: "compare", label: "Compare", pageKey: "compare", route: "/compare", changefreq: "weekly", priority: "0.6" },
  { id: "softener-planner", label: "Softener planner", pageKey: "softener-planner", route: "/softener-planner", changefreq: "monthly", priority: "0.7" },
  { id: "softeners-hyderabad", label: "Softeners Hyderabad", pageKey: "softeners-hyderabad", route: "/softeners-hyderabad", changefreq: "weekly", priority: "0.7" },
  { id: "about", label: "About", pageKey: "about", route: "/about", changefreq: "monthly", priority: "0.5" },
  { id: "contact-us", label: "Contact", pageKey: "contact-us", route: "/contact-us", changefreq: "monthly", priority: "0.5" },
  { id: "privacy-policy", label: "Privacy policy", pageKey: "privacy-policy", route: "/privacy-policy", changefreq: "yearly", priority: "0.2" },
  { id: "shipping-policy", label: "Shipping policy", pageKey: "shipping-policy", route: "/shipping-policy", changefreq: "yearly", priority: "0.2" },
  { id: "terms-and-conditions", label: "Terms and conditions", pageKey: "terms-and-conditions", route: "/terms-and-conditions", changefreq: "yearly", priority: "0.2" },
];

export const getStaticSitemapEntries = () =>
  PUBLIC_SEO_PAGES.map(({ route, changefreq, priority }) => ({
    loc: route,
    changefreq,
    priority,
  }));
