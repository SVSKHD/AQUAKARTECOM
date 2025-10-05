import axios from "axios";
import AquaServerDynamicProduct from "@/pageComponents/products/ServerSideDynamicProduct";
import AquaProductSeo from "@/components/Layout/seo/productSeo";

const FALLBACK_IMAGE =
  "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png";

const stripHtml = (value) => {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

const parseStockValue = (stock) => {
  if (stock === null || stock === undefined) return 0;
  if (typeof stock === "number") return stock;

  if (typeof stock === "string") {
    const direct = Number(stock);
    if (!Number.isNaN(direct)) return direct;
  }

  try {
    const parsed = JSON.parse(stock);
    if (typeof parsed === "number") return parsed;
    if (typeof parsed === "string") {
      const parsedNumber = Number(parsed);
      if (!Number.isNaN(parsedNumber)) return parsedNumber;
    }
  } catch (error) {
    // Ignore JSON parsing errors and fall back to zero
  }

  return 0;
};

function AquaDynamicProduct({ product, related, error }) {
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-3 max-w-md text-sm text-slate-600">
          {error}
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Product unavailable
        </h1>
        <p className="mt-3 max-w-md text-sm text-slate-600">
          The product you are looking for is currently not listed. Please check
          back later or explore other categories.
        </p>
      </div>
    );
  }

  const stockCount = parseStockValue(product?.stock);
  const sanitizedDescription = stripHtml(
    product?.metaDescription || product?.description,
  ).slice(0, 155);
  const productKeywords = Array.isArray(product?.keywords)
    ? product.keywords.join(", ")
    : product?.keywords || "aquakart products, online water purifiers";
  const productUrl = `https://aquakart.co.in/product/${product?.slug || product?._id}`;
  const seoPayload = {
    title: product?.metaTitle || product?.title,
    keywords: productKeywords,
    keyphrases: "aquakart, product, ecommerce, online shopping",
    url: productUrl,
    photos:
      Array.isArray(product?.photos) && product.photos.length > 0
        ? product.photos
        : [{ secure_url: FALLBACK_IMAGE }],
    follow: true,
    description: sanitizedDescription,
    price: product?.discountPriceStatus ? product?.discountPrice : product?.price,
    priceCurrency: product?.currency || "INR",
    brand: product?.brand,
    sku: product?.sku,
    stock:
      stockCount > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    rating: product?.rating,
  };

  return (
    <>
      <AquaProductSeo product={seoPayload} />
      <AquaServerDynamicProduct
        product={product}
        related={related}
        stockCount={stockCount}
        fallbackImage={FALLBACK_IMAGE}
      />
    </>
  );
}

// ----------------------------------------
// getStaticPaths
// ----------------------------------------
export async function getStaticPaths() {
  try {
    // Fetch all products for pre-rendering paths
    const response = await axios.get("https://api.aquakart.co.in/v1/products");
    const products = response?.data || [];

    // Generate paths for products
    const paths = products
      .filter((product) => product?.slug)
      .map((product) => ({
        params: { id: product.slug },
      }));

    return {
      paths, // Pre-render these paths
      fallback: "blocking", // Dynamically generate pages on demand
    };
  } catch (err) {
    console.error("Error fetching product paths:", err.message);
    return {
      paths: [],
      fallback: "blocking", // Allow for on-demand generation
    };
  }
}

// ----------------------------------------
// getStaticProps
// ----------------------------------------
export async function getStaticProps({ params }) {
  const { id } = params;

  try {
    // Fetch product data for the given ID
    const response = await axios.get(
      `https://api.aquakart.co.in/v1/product?searchField=slug&value=${id}`,
    );

    const product = response?.data?.data || null;
    const related = response?.data?.related || null;

    return {
      props: {
        product,
        related,
      },
      revalidate: 60, // Revalidate the page every 60 seconds
    };
  } catch (err) {
    console.error("Error fetching product data:", err.message);
    return {
      props: {
        product: null,
        related: null,
        error: "Failed to fetch product data. Please try again later.",
      },
    };
  }
}

export default AquaDynamicProduct;
