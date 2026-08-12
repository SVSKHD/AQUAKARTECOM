import AquaHomeComponent from "@/pageComponents/home";
import CategoryServiceOperations from "@/services/category";
import ProductServiceOperations from "@/services/products";
import { getManagedSeoServerSide } from "@/services/seo";

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
    const [categoriesRes, productsRes, managedSeo] = await Promise.all([
      CategoryServiceOperations.Allcategories(),
      ProductServiceOperations.AllProducts(),
      getManagedSeoServerSide("home"),
    ]);

    return {
      props: {
        initialCategories: categoriesRes.data?.data || [],
        initialProducts: productsRes.data?.data || [],
        managedSeo,
      },
    };
  } catch (error) {
    console.error("Failed to fetch home page data:", error);
    return {
      props: {
        initialCategories: [],
        initialProducts: [],
        managedSeo: await getManagedSeoServerSide("home"),
      },
    };
  }
}

export default AquaHomePage;
