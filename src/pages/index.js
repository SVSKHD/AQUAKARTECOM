import AquaHomeComponent from "@/pageComponents/home";
import CategoryServiceOperations from "@/services/category";
import SubCategoryServiceOperations from "@/services/subcategory";
import ProductServiceOperations from "@/services/products";

const AquaHomePage = (props) => {
  return (
    <>
      <AquaHomeComponent {...props} />
    </>
  );
};

export async function getStaticProps() {
  try {
    const [categoriesRes, subCategoriesRes, productsRes] = await Promise.all([
      CategoryServiceOperations.Allcategories(),
      SubCategoryServiceOperations.AllSubcategories(),
      ProductServiceOperations.AllProducts(), // Consider creating a lighter endpoint or limiting fields if possible
    ]);

    return {
      props: {
        initialCategories: categoriesRes.data?.data || [],
        initialSubCategories: subCategoriesRes.data?.data || [],
        initialProducts: productsRes.data?.data || [],
      },
      // Revalidate every hour
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Failed to fetch home page data:", error);
    return {
      props: {
        initialCategories: [],
        initialSubCategories: [],
        initialProducts: [],
      },
      revalidate: 60,
    };
  }
}

export default AquaHomePage;
