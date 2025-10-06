import AquaShopComponent from "@/pageComponents/shop";
import ProductServiceOperations from "@/services/products";
import CategoryServiceOperations from "@/services/category";
import SubCategoryServiceOperations from "@/services/subcategory";

const AquaShop = ({
  products = [],
  error = "",
  categories = [],
  subcategories = [],
}) => {
  return (
    <AquaShopComponent
      initialProducts={products}
      initialError={error}
      initialCategories={categories}
      initialSubcategories={subcategories}
    />
  );
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

    const [productsResponse, categoriesResponse, subcategoriesResponse] =
      await Promise.all([
        ProductServiceOperations.AllProducts(),
        CategoryServiceOperations.Allcategories().catch(() => null),
        SubCategoryServiceOperations.AllSubcategories().catch(() => null),
      ]);

    const products = Array.isArray(productsResponse?.data?.data)
      ? productsResponse.data.data
      : [];
    const categories = Array.isArray(categoriesResponse?.data?.data)
      ? categoriesResponse.data.data
      : [];
    const subcategories = Array.isArray(subcategoriesResponse?.data?.data)
      ? subcategoriesResponse.data.data
      : [];

    return {
      props: {
        products,
        categories,
        subcategories,
        error: products.length === 0 ? "No products available at the moment." : "",
      },
    };
  } catch (serverError) {
    console.error("Shop page SSR error:", serverError);
    return {
      props: {
        products: [],
        categories: [],
        subcategories: [],
        error: "We couldn’t load the catalogue. Please refresh the page or visit later.",
      },
    };
  }
};

export default AquaShop;
