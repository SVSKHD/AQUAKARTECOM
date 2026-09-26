import CategoryServiceOperations from "@/services/category";
import SubCategoryServiceOperations from "@/services/subcategory";
import ProductServiceOperations from "@/services/products";
import BlogServiceOperations from "@/services/blog";

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
    const [categoriesRes, subCategoriesRes, productsRes, blogsRes] =
      await Promise.allSettled([
        CategoryServiceOperations.Allcategories(),
        SubCategoryServiceOperations.AllSubcategories(),
        ProductServiceOperations.AllProducts(),
        BlogServiceOperations.AllBlogs(),
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
    const blogs =
      blogsRes.status === "fulfilled" ? blogsRes.value?.data?.data || [] : [];

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

    blogs.forEach((blog) => {
      const slug = blog?.slug || blog?._id;
      if (!slug) return;
      urls.push({
        loc: `/blog/${encodeURIComponent(slug)}`,
        lastmod: blog.updatedAt
          ? new Date(blog.updatedAt).toISOString().split("T")[0]
          : blog.createdAt
            ? new Date(blog.createdAt).toISOString().split("T")[0]
            : undefined,
        changefreq: "monthly",
        priority: "0.7",
      });
    });
  } catch (err) {
    // If an API fails, static URLs still remain available to crawlers.
  }

  const uniqueUrls = Array.from(
    new Map(urls.map((entry) => [entry.loc, entry])).values(),
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map(toUrlEntry).join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=3600",
  );
  res.write(xml);
  res.end();

  return { props: {} };
}

export default SitemapPage;
