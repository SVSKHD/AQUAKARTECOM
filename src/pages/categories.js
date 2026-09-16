import AquaAllCategoriesComponent from "@/pageComponents/categories";
import CategoryServiceOperations from "@/services/category";
import { getManagedSeoServerSide } from "@/services/seo";

const AquaCategories = ({ categories, error, managedSeo }) => (
  <AquaAllCategoriesComponent
    initialCategories={categories}
    initialError={error}
    managedSeo={managedSeo}
  />
);

export async function getServerSideProps({ res }) {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=900",
  );

  try {
    const [categoriesResponse, managedSeo] = await Promise.all([
      CategoryServiceOperations.Allcategories(),
      getManagedSeoServerSide("categories"),
    ]);

    return {
      props: {
        categories: Array.isArray(categoriesResponse?.data?.data)
          ? categoriesResponse.data.data
          : [],
        error: "",
        managedSeo,
      },
    };
  } catch (error) {
    console.error("Failed to fetch categories on server:", error?.message || error);
    return {
      props: {
        categories: [],
        error: "We couldn’t load the categories right now. Please retry in a moment.",
        managedSeo: await getManagedSeoServerSide("categories"),
      },
    };
  }
}

export default AquaCategories;
