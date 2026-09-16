import AquaSoftenerHyderabadComponent from "@/pageComponents/softenersHyderabad";
import AquaSoftnerOperations from "@/services/softenersHyderabad";
import ProductServiceOperations from "@/services/products";
import { getManagedSeoServerSide } from "@/services/seo";

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

export const getServerSideProps = async ({ res }) => {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=900",
  );

  try {
    const [softenersResponse, productsResponse, managedSeo] = await Promise.all([
      AquaSoftnerOperations.getSofteners(),
      ProductServiceOperations.AllProducts(),
      getManagedSeoServerSide("softeners-hyderabad"),
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
        managedSeo,
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
        managedSeo: await getManagedSeoServerSide("softeners-hyderabad"),
      },
    };
  }
};

export default AquaSoftenersHyderabad;
