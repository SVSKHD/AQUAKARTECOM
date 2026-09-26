import AquaHomeComponent from "@/pageComponents/home";
import CategoryServiceOperations from "@/services/category";
import ProductServiceOperations from "@/services/products";

const AquaHomePage = (props) => {
  return (
    <>
      <AquaHomeComponent {...props} />
    </>
  );
};

export async function getServerSideProps({ res }) {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=900",
  );

  try {
    const [categoriesRes, productsRes] = await Promise.all([
      CategoryServiceOperations.Allcategories(),
      ProductServiceOperations.AllProducts(),
    ]);

    return {
      props: {
        initialCategories: categoriesRes.data?.data || [],
        initialProducts: productsRes.data?.data || [],
      },
    };
  } catch (error) {
    console.error("Failed to fetch home page data:", error);
    return {
      props: {
        initialCategories: [],
        initialProducts: [],
      },
    };
  }
}

export default AquaHomePage;
