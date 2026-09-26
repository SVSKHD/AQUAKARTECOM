import AquaAllCategoriesComponent from "@/pageComponents/categories";
import CategoryServiceOperations from "@/services/category";

const AquaCategories = ({ categories, error }) => (
  <AquaAllCategoriesComponent
    initialCategories={categories}
    initialError={error}
  />
);

export async function getServerSideProps({ res }) {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=900",
  );

  try {
    const categoriesResponse = await CategoryServiceOperations.Allcategories();

    return {
      props: {
        categories: Array.isArray(categoriesResponse?.data?.data)
          ? categoriesResponse.data.data
          : [],
        error: "",
      },
    };
  } catch (error) {
    console.error("Failed to fetch categories on server:", error?.message || error);
    return {
      props: {
        categories: [],
        error: "We couldn’t load the categories right now. Please retry in a moment.",
      },
    };
  }
}

export default AquaCategories;
