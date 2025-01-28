import axios from "axios";
import AquaServerDynamicProduct from "@/pageComponents/products/ServerSideDynamicProduct";
import AquaProductSeo from "@/components/Layout/seo/productSeo";

function AquaDynamicProduct({ product, related, error }) {
  // Error handling
  if (error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  // Fallback for missing product data
  if (!product) {
    return <div>No product data available.</div>;
  }

  // SEO setup
  const sanitizeText = (input) => {
    if (!input) return "";
    const parser = new DOMParser();
    const parsedString = parser.parseFromString(input, "text/html");
    return parsedString.body.textContent || "";
  };

  const ogDescription = sanitizeText(product?.description)?.substring(0, 150);
  const ProductSeo = {
    title: product?.title,
    keywords: "aquakart, product, ecommerce, online shopping",
    keyphrases: "aquakart, product, ecommerce, online shopping",
    url: `https://aquakart.co.in/product/${product?.slug}`,
    photos: product?.photos[0]?.secure_url,
    follow: true,
    description: ogDescription,
    price: product?.price,
    priceCurrency: "INR",
  };

  return (
    <>
      <AquaProductSeo product={ProductSeo} />
      <AquaServerDynamicProduct product={product} related={related} />
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
    const paths = products.map((product) => ({
      params: { id: product.slug }, // Replace `slug` with the actual key if different
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