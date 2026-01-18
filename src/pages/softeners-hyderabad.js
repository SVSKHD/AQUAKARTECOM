import AquaSoftenerHyderabadComponent from "@/pageComponents/softenersHyderabad";
import AquaSoftnerOperations from "@/services/softenersHyderabad";
import ProductServiceOperations from "@/services/products";

const AquaSoftenersHyderabad = ({
  initialSections,
  initialError,
  initialProducts,
}) => (
  <AquaSoftenerHyderabadComponent
    initialSections={initialSections}
    initialError={initialError}
    initialProducts={initialProducts}
  />
);

export const getServerSideProps = async () => {
  try {
    const [softenersResponse, productsResponse] = await Promise.all([
      AquaSoftnerOperations.getSofteners(),
      ProductServiceOperations.AllProducts(),
    ]);

    const sections = Array.isArray(softenersResponse?.data)
      ? softenersResponse.data
      : [];
    const products = Array.isArray(productsResponse?.data?.data)
      ? productsResponse.data.data
      : [];

    return {
      props: {
        initialSections: sections,
        initialProducts: products,
        initialError: "",
      },
    };
  } catch (error) {
    console.error(
      "Failed to fetch data on the server:",
      error?.message || error,
    );

    return {
      props: {
        initialSections: [],
        initialProducts: [],
        initialError:
          "We couldn’t load the content right now. Please try again in a moment.",
      },
    };
  }
};

export default AquaSoftenersHyderabad;
