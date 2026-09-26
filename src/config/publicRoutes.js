/**
 * Public static route registry.
 *
 * Add a new indexable static page here once and it automatically participates in:
 * - fallback SEO resolution
 * - sitemap generation
 *
 * Dynamic products, blogs, categories and subcategories remain API-driven.
 */
export const PUBLIC_ROUTES = Object.freeze([
  {
    "path": "/",
    "seoKey": "home",
    "sitemap": {
      "changefreq": "daily",
      "priority": "1.0"
    },
    "seo": {
      "title": "Aquakart | India's Leading Water Softening & Purification Solutions",
      "keywords": "Aquakart, Water Softeners, RO Purifiers, Best Water Filters, water softeners near me, Hard Water Treatment, Home Water Solutions, Water Purification Systems, Whole House Filtration, Soft Water Treatment, Water Softeners in Hyderabad, RO Purifiers in Hyderabad, Water Filters Gachibowli, Water Filters Jubilee Hills, Hard Water Solution Madhapur, Softener Dealers Kondapur, Whole House RO Hyderabad",
      "keyphrases": "Aquakart, Water Softeners, RO Purifiers, Home Water Solutions, Hard Water Treatment, Best Water Purifiers, Hyderabad Water Softener Services, RO Purifier Setup Gachibowli, Hard Water Fix Jubilee Hills, Water Filtration Experts Madhapur, Aquakart in Hyderabad",
      "url": "https://aquakart.co.in",
      "photos": "https://res.cloudinary.com/aquakartproducts/image/upload/v1717355833/Blogs/TitleImages/z5sqkhkvawe0xcaliiei.jpg",
      "description": "Aquakart offers India's best water treatment solutions, including advanced water softeners, RO purifiers, and whole-house filtration systems. Enjoy clean, soft water at home with our high-quality products.",
      "follow": true
    }
  },
  {
    "path": "/shop",
    "seoKey": "shop",
    "sitemap": {
      "changefreq": "daily",
      "priority": "0.9"
    },
    "seo": {
      "title": "Aquakart | Buy Automatic & Manual Water Softeners, RO Purifiers &  Sand and Iron Filters",
      "keywords": "Buy Water Softeners, RO Purifiers, Hard Water Filters, UV Water Purifiers, Water Filtration Systems, Home Water Solutions, Aquakart Online Store, Whole House Water Filters, RO Purifiers Hyderabad, Water Softeners Hyderabad, Water Filters Gachibowli, RO Systems Jubilee Hills, Water Treatment Kukatpally",
      "keyphrases": "Aquakart Water Softeners, Buy RO Purifiers Online, Hard Water Treatment, Best Water Filters, Shop Water Purification Systems, RO Purifiers in Hyderabad, Water Softener Dealers Jubilee Hills, Online Water Filters Gachibowli",
      "url": "https://aquakart.co.in/shop",
      "photos": "https://aquakart.co.in/images/shop.jpg",
      "description": "Shop high-quality water softeners, RO purifiers, and filtration systems at Aquakart. Find the best solutions for hard water treatment and pure drinking water for your home and office.",
      "follow": true
    }
  },
  {
    "path": "/categories",
    "seoKey": "categories",
    "sitemap": {
      "changefreq": "weekly",
      "priority": "0.8"
    },
    "seo": {
      "title": "Shop by Categories | Water Softeners, Purifiers & More | Aquakart",
      "keywords": "Aquakart categories, water purifiers, water softeners, water dispensers, storage tanks, plumbing accessories, water filtration systems, Hyderabad water solutions",
      "keyphrases": "Water purifier categories, Aquakart product collections, water solutions India, home water management",
      "url": "https://aquakart.co.in/categories",
      "photos": "https://res.cloudinary.com/aquakartproducts/image/upload/v1717355833/Blogs/TitleImages/z5sqkhkvawe0xcaliiei.jpg",
      "description": "Browse all Aquakart product categories. Find water softeners, RO purifiers, dispensers, storage tanks, and plumbing accessories for your home or business.",
      "follow": true
    }
  },
  {
    "path": "/blogs",
    "seoKey": "blogs",
    "sitemap": {
      "changefreq": "weekly",
      "priority": "0.8"
    },
    "seo": {
      "title": "Aquakart Blogs | Water Softener & RO Purifier Insights",
      "keywords": "Water Softener Blogs, RO Purifier Guides, Best Water Filtration Tips, Aquakart Blog, Latest Water Purification News, Best Water Solutions and Softeners in Hyderabad, RO Filters Gachibowli, Water Treatment Jubilee Hills, Home Water Filtration Hyderabad",
      "keyphrases": "Water Softener Advice, RO Purifier Buying Guide, Home Water Solutions Blog, RO Setup Gachibowli, Softener Installation Jubilee Hills, Water Filter Help Hyderabad, Aquakart Blog for Hyderabad",
      "url": "https://aquakart.co.in/blogs",
      "photos": "https://res.cloudinary.com/aquakartproducts/image/upload/v1717355833/Blogs/TitleImages/z5sqkhkvawe0xcaliiei.jpg",
      "description": "Stay informed with Aquakart Blogs. Learn about water softeners, RO purifiers, and the latest advancements in water filtration technology.",
      "follow": true
    }
  },
  {
    "path": "/compare",
    "seoKey": "compare",
    "sitemap": {
      "changefreq": "weekly",
      "priority": "0.6"
    },
    "seo": {
      "title": "Compare Water Softeners & RO Purifiers | Aquakart",
      "keywords": "Compare Water Softeners, Compare RO Purifiers, Best Water Filters, Water Softener Price Comparison, Hyderabad RO Purifier Reviews, Local Water Filter Comparison Hyderabad",
      "keyphrases": "Water Softener Comparison, RO Purifier Reviews, Best Water Filters, Compare Filters in Hyderabad, RO Price Comparison Gachibowli",
      "url": "https://aquakart.co.in/compare",
      "photos": "https://aquakart.co.in/images/compare.jpg",
      "description": "Compare top water softeners, RO purifiers, and filtration systems. Get the best deals and choose the right water solution for your needs.",
      "follow": true
    }
  },
  {
    "path": "/softener-planner",
    "seoKey": "softener-planner",
    "sitemap": {
      "changefreq": "monthly",
      "priority": "0.7"
    },
    "seo": {
      "title": "Softener Planning | Aquakart Water Softener Solutions",
      "keywords": "Aquakart Softener Planning, Water Softener Calculator, RO Purifier Calculator, Best Water Filters, Hyderabad RO Offers, Water Filter Coupons Jubilee Hills",
      "keyphrases": "Water Softener Discounts, RO Purifier Coupons, Aquakart Special Offers, Local Water Filter Deals Hyderabad",
      "url": "https://aquakart.co.in/softener-planner",
      "photos": "https://res.cloudinary.com/aquakartproducts/image/upload/v1717355833/Blogs/TitleImages/z5sqkhkvawe0xcaliiei.jpg",
      "description": "Explore special offers and discounts on Aquakart water softeners, RO purifiers, and filtration products. Limited-time deals available now!",
      "follow": true
    }
  },
  {
    "path": "/softeners-hyderabad",
    "seoKey": "softeners-hyderabad",
    "sitemap": {
      "changefreq": "weekly",
      "priority": "0.7"
    },
    "seo": {
      "title": "Softeners Installed in Hyderabad | Aquakart Water softener Solutions",
      "keywords": "Softeners in Hyderabad, RO purifiers in Hyderabad, Aquakart Softener Planning, Water Softener Calculator, RO Purifier Calculator, Best Water Filters, Hyderabad RO Offers, Water Filter Coupons Jubilee Hills",
      "keyphrases": "Water Softener Discounts, RO Purifier Coupons, Aquakart Special Offers, Local Water Filter Deals Hyderabad",
      "url": "https://aquakart.co.in/softeners-hyderabad",
      "photos": "https://res.cloudinary.com/aquakartproducts/image/upload/v1717355833/Blogs/TitleImages/z5sqkhkvawe0xcaliiei.jpg",
      "description": "Unlike typical installers, Aquakart is a leading water softener company in Hyderabad that combines expert installation with complete technical knowledge and long-term system support.",
      "follow": true
    }
  },
  {
    "path": "/about",
    "seoKey": "about",
    "sitemap": {
      "changefreq": "monthly",
      "priority": "0.5"
    },
    "seo": {
      "title": "About Aquakart | Leading Water Softener & Purifier Provider",
      "keywords": "About Aquakart, Water Softener Company, RO Purifier Manufacturer, Best Water Solutions Provider, Water Filter Brand Hyderabad",
      "keyphrases": "Aquakart Mission, Best Water Softener Company, Water Solutions, Hyderabad Water Technology Brand",
      "url": "https://aquakart.co.in/about",
      "photos": "https://aquakart.co.in/images/about.jpg",
      "description": "Learn more about Aquakart, a leading provider of water softeners, RO purifiers, and filtration systems. Trusted solutions for clean and healthy water.",
      "follow": true
    }
  },
  {
    "path": "/contact-us",
    "seoKey": "contact-us",
    "sitemap": {
      "changefreq": "monthly",
      "priority": "0.5"
    },
    "seo": {
      "title": "Contact Aquakart | Customer Support & Inquiries",
      "keywords": "Contact Aquakart, Customer Support, Water Softener Queries, RO Purifier Assistance, Hyderabad Water Filter Help",
      "keyphrases": "Aquakart Customer Support, Water Softener Help, Contact Us Hyderabad",
      "url": "https://aquakart.co.in/contact-us",
      "photos": "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
      "description": "Need assistance? Contact Aquakart for customer support, product inquiries, and expert advice on water purification solutions.",
      "follow": true
    }
  },
  {
    "path": "/privacy-policy",
    "seoKey": "privacy-policy",
    "sitemap": {
      "changefreq": "yearly",
      "priority": "0.2"
    },
    "seo": {
      "title": "Privacy Policy | Aquakart Water Solutions",
      "keywords": "Aquakart Privacy Policy, Data Security, Customer Information Protection",
      "keyphrases": "Privacy Policy, Customer Data Protection, Aquakart Privacy",
      "url": "https://aquakart.co.in/privacy-policy",
      "photos": "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
      "description": "Read Aquakart's privacy policy to learn how we protect your data and ensure security for a safe online shopping experience.",
      "follow": false
    }
  },
  {
    "path": "/shipping-policy",
    "seoKey": "shipping-policy",
    "sitemap": {
      "changefreq": "yearly",
      "priority": "0.2"
    },
    "seo": {
      "title": "Shipping Policy | Aquakart Water Solutions",
      "keywords": "Aquakart Shipping, Delivery Policy, Water Softener Delivery, Free Shipping India",
      "keyphrases": "Aquakart delivery times, shipping charges, free delivery water softeners",
      "url": "https://aquakart.co.in/shipping-policy",
      "photos": "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
      "description": "Learn about Aquakart's shipping policy, delivery timelines, and shipping charges for water softeners, purifiers, and accessories across India.",
      "follow": false
    }
  },
  {
    "path": "/terms-and-conditions",
    "seoKey": "terms-and-conditions",
    "sitemap": {
      "changefreq": "yearly",
      "priority": "0.2"
    },
    "seo": {
      "title": "Terms & Conditions | Aquakart Water Solutions",
      "keywords": "Aquakart Terms & Conditions, Online Purchase Terms, Customer Agreement",
      "keyphrases": "Terms of Service, Customer Agreement, Aquakart Policies",
      "url": "https://aquakart.co.in/terms-and-conditions",
      "photos": "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
      "description": "Review the terms and conditions for using Aquakart and purchasing water softeners, RO purifiers, and other products online.",
      "follow": false
    }
  }
]);

export const normalizePublicPath = (pathname = "") => {
  const raw = String(pathname || "/").split("?")[0].split("#")[0] || "/";
  const prefixed = raw.startsWith("/") ? raw : `/${raw}`;
  return prefixed === "/" ? "/" : prefixed.replace(/\/+$/, "");
};

const PUBLIC_ROUTE_BY_PATH = new Map(
  PUBLIC_ROUTES.map((route) => [normalizePublicPath(route.path), route]),
);

export const getPublicRoute = (pathname) =>
  PUBLIC_ROUTE_BY_PATH.get(normalizePublicPath(pathname)) || null;

export const getPublicSeoKey = (pathname) =>
  getPublicRoute(pathname)?.seoKey || null;

export const PUBLIC_SEO_CONFIG = Object.freeze(
  Object.fromEntries(
    PUBLIC_ROUTES.map((route) => [route.seoKey, route.seo]),
  ),
);

export const getStaticSitemapEntries = () =>
  PUBLIC_ROUTES.filter((route) => route.sitemap !== false).map((route) => ({
    loc: route.path,
    changefreq: route.sitemap.changefreq,
    priority: route.sitemap.priority,
  }));
