import AquaShopComponent from "@/pageComponents/shop";
import ProductServiceOperations from "@/services/products";

const AquaShop = ({ products = [], error = "" }) => {
  return <AquaShopComponent initialProducts={products} initialError={error} />;
};

export const getServerSideProps = async () => {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) {
      return {
        props: {
          products: [],
          error: "Shop catalogue is temporarily unavailable. Please try again soon.",
        },
      };
    }

    const response = await ProductServiceOperations.AllProducts();
    const products = Array.isArray(response?.data?.data) ? response.data.data : [];

    return {
      props: {
        products,
        error: products.length === 0 ? "No products available at the moment." : "",
      },
    };
  } catch (serverError) {
    console.error("Shop page SSR error:", serverError);
    return {
      props: {
        products: [],
        error: "We couldn’t load the catalogue. Please refresh the page or visit later.",
      },
    };
  }
};

export default AquaShop;
