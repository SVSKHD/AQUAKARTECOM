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
      {/* <AquaServerDynamicProduct product={product} related={related} /> */}
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
// ----------------------------------------
// getStaticProps
// ----------------------------------------
export async function getStaticProps({ params }) {
  const staticProductData = {
    title: "Sample Product Title",
    description:
      "This is a sample product description for testing purposes. It includes key metadata fields like title, description, and images.",
    slug: "sample-product",
    photos: [
      {
        secure_url: "https://example.com/sample-product-image.jpg",
      },
    ],
    price: "999.00",
    priceCurrency: "INR",
    related: [
      {
        title: "Related Product 1",
        slug: "related-product-1",
      },
      {
        title: "Related Product 2",
        slug: "related-product-2",
      },
    ],
  };

  const product = staticProductData;
  const related = staticProductData.related;

  return {
    props: {
      product,
      related,
    },
    revalidate: 60, // Revalidate the page every 60 seconds
  };
}

export default AquaDynamicProduct;
