import config from "@/components/Layout/seo/config";
import { PUBLIC_SEO_PAGES } from "@/config/publicSeoPages";

const BASE_URL = "https://aquakart.co.in";
const DEFAULT_IMAGE =
  "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png";

const splitKeywords = (value) =>
  Array.isArray(value)
    ? value.filter(Boolean)
    : String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

const firstImage = (value) => {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    const first = value.find(Boolean);
    if (typeof first === "string") return first;
    return first?.secure_url || first?.url || "";
  }
  return value?.secure_url || value?.url || "";
};

const schemaTypeFor = (pageKey) => {
  if (pageKey === "about") return "AboutPage";
  if (pageKey === "contact-us") return "ContactPage";
  if (pageKey === "shop" || pageKey === "categories") return "CollectionPage";
  if (pageKey === "blogs") return "Blog";
  return "WebPage";
};

const buildSchema = ({ pageKey, route, title, description }) => {
  const url = route === "/" ? BASE_URL : `${BASE_URL}${route}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": schemaTypeFor(pageKey),
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    isPartOf: { "@id": `${BASE_URL}#website` },
  };

  if (pageKey === "about") {
    schema.mainEntity = { "@id": `${BASE_URL}#organization` };
  }

  if (pageKey === "contact-us") {
    schema.about = { "@id": `${BASE_URL}#organization` };
  }

  return schema;
};

const toRecommendation = (page) => {
  const seo = config[page.pageKey] || {};
  const canonicalUrl =
    seo.canonical ||
    seo.url ||
    (page.route === "/" ? BASE_URL : `${BASE_URL}${page.route}`);
  const image = seo.ogImage || firstImage(seo.photos) || DEFAULT_IMAGE;
  const title = seo.title || page.label;
  const description = seo.description || "";

  return {
    id: page.id,
    label: page.label,
    pageKey: page.pageKey,
    route: page.route,
    type: "static",
    recommendation: {
      pageKey: page.pageKey,
      route: page.route,
      title,
      description,
      keywords: splitKeywords(seo.keywords),
      canonicalUrl,
      robots:
        seo.robots ||
        `index,${seo.follow === false ? "nofollow" : "follow"},max-image-preview:large,max-snippet:-1,max-video-preview:-1`,
      ogTitle: seo.ogTitle || title,
      ogDescription: seo.ogDescription || description,
      ogImage: image,
      twitterTitle: seo.twitterTitle || seo.ogTitle || title,
      twitterDescription:
        seo.twitterDescription || seo.ogDescription || description,
      twitterImage: seo.twitterImage || image,
      schemaJson:
        seo.schemaJson ||
        buildSchema({
          pageKey: page.pageKey,
          route: page.route,
          title,
          description,
        }),
      active: true,
    },
  };
};

export async function getServerSideProps({ res }) {
  const data = PUBLIC_SEO_PAGES.map(toRecommendation);

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=3600",
  );
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.write(
    JSON.stringify({
      success: true,
      source: "aquakart-storefront-fallback",
      data,
    }),
  );
  res.end();

  return { props: {} };
}

export default function SeoManifest() {
  return null;
}
