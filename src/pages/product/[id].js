import axios from "axios";
import AquaServerDynamicProduct from "@/pageComponents/products/ServerSideDynamicProduct";
import AquaProductSeo from "@/components/Layout/seo/productSeo";

function AquaDynamicProduct({ product, related, error }) {
  // If our request in getServerSideProps failed, show an error message
  if (error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  // If there's no error but we still didn't get a product, handle it gracefully
  if (!product) {
    return <div>No product data available.</div>;
  }

  const sanitizeText = (input) => {
    if (!input) return "";
    const parser = new DOMParser();
    const parsedString = parser.parseFromString(input, "text/html");
    const plainText = parsedString.body.textContent || "";
    return plainText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .trim();
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
      {/* Example usage of a separate component: */}
      {/* <AquaDynamicProductComponent product={product} /> */}

      {/* Server-side product rendering component */}
      <AquaProductSeo product={ProductSeo} />
      <AquaServerDynamicProduct product={product} related={related} />
    </>
  );
}

// ----------------------------------------
// getServerSideProps
// ----------------------------------------
export async function getServerSideProps({ params }) {
  const { id } = params;

  try {
    const response = await axios.get(
      `https://api.aquakart.co.in/v1/product?searchField=slug&value=${id}`,
    );

    // Extract relevant fields
    const product = response?.data?.data || null;
    const related = response?.data?.related || null;

    return {
      props: {
        product,
        related,
      },
    };
  } catch (err) {
    console.error("Error fetching product data:", err.message);

    // Pass the error message to the page via props
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
// pages/aqua-dynamic-product/[id].js  <-- example filename
