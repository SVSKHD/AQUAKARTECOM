import axios from "axios";
import AquaDynamicProductComponent from "@/pageComponents/products/dynamicProduct";
import AquaServerDynamicProduct from "@/pageComponents/products/ServerSideDynamicProduct";

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

  return (
    <>
      {/* Example usage of a separate component: */}
      {/* <AquaDynamicProductComponent product={product} /> */}

      {/* Server-side product rendering component */}
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
