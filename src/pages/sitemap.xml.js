import CategoryServiceOperations from "@/services/category";
import SubCategoryServiceOperations from "@/services/subcategory";
import ProductServiceOperations from "@/services/products";

const BASE_URL = "https://aquakart.co.in";

const staticPages = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/shop", changefreq: "daily", priority: "0.9" },
  { loc: "/categories", changefreq: "weekly", priority: "0.8" },
  { loc: "/blogs", changefreq: "weekly", priority: "0.8" },
  { loc: "/compare", changefreq: "weekly", priority: "0.6" },
  { loc: "/softener-planner", changefreq: "monthly", priority: "0.7" },
  { loc: "/softeners-hyderabad", changefreq: "weekly", priority: "0.7" },
  { loc: "/about", changefreq: "monthly", priority: "0.5" },
  { loc: "/contact-us", changefreq: "monthly", priority: "0.5" },
  { loc: "/privacy-policy", changefreq: "yearly", priority: "0.2" },
  { loc: "/shipping-policy", changefreq: "yearly", priority: "0.2" },
  { loc: "/terms-and-conditions", changefreq: "yearly", priority: "0.2" },
];

function escapeXml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toUrlEntry({ loc, lastmod, changefreq, priority }) {
  return `  <url>
    <loc>${escapeXml(BASE_URL + loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function SitemapPage() {
  // This component never renders — getServerSideProps writes XML directly
  return null;
}

export async function getServerSideProps({ res }) {
  const urls = [...staticPages];

  try {
    // Fetch all dynamic content in parallel
    const [categoriesRes, subCategoriesRes, productsRes] =
      await Promise.allSettled([
        CategoryServiceOperations.Allcategories(),
        SubCategoryServiceOperations.AllSubcategories(),
        ProductServiceOperations.AllProducts(),
      ]);

    const categories =
      categoriesRes.status === "fulfilled"
        ? categoriesRes.value?.data?.data || []
        : [];
    const subcategories =
      subCategoriesRes.status === "fulfilled"
        ? subCategoriesRes.value?.data?.data || []
        : [];
    const products =
      productsRes.status === "fulfilled"
        ? productsRes.value?.data?.data || []
        : [];

    // Add category pages
    categories.forEach((cat) => {
      if (!cat?.title) return;
      urls.push({
        loc: `/category/${encodeURIComponent(cat.title)}`,
        lastmod: cat.updatedAt
          ? new Date(cat.updatedAt).toISOString().split("T")[0]
          : undefined,
        changefreq: "weekly",
        priority: "0.7",
      });
    });

    // Add subcategory pages
    subcategories.forEach((sub) => {
      if (!sub?.title) return;
      urls.push({
        loc: `/subcategory/${encodeURIComponent(sub.title)}`,
        lastmod: sub.updatedAt
          ? new Date(sub.updatedAt).toISOString().split("T")[0]
          : undefined,
        changefreq: "weekly",
        priority: "0.6",
      });
    });

    // Add product pages
    products.forEach((product) => {
      const slug = product?.slug || product?._id;
      if (!slug) return;
      urls.push({
        loc: `/product/${encodeURIComponent(slug)}`,
        lastmod: product.updatedAt
          ? new Date(product.updatedAt).toISOString().split("T")[0]
          : undefined,
        changefreq: "weekly",
        priority: "0.8",
      });
    });
  } catch (err) {
    // If API fails, we still serve static URLs
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(toUrlEntry).join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400",
  );
  res.write(xml);
  res.end();

  return { props: {} };
}

export default SitemapPage;
