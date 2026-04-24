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

export async function getServerSideProps({ res }) {
  res.setHeader(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0",
  );

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
    };
  } catch (error) {
    console.error("Failed to fetch home page data:", error);
    return {
      props: {
        initialCategories: [],
        initialSubCategories: [],
        initialProducts: [],
      },
    };
  }
}

export default AquaHomePage;
