import CategoryServiceOperations from "@/services/category";
import SubCategoryServiceOperations from "@/services/subcategory";

// Cached states
let categoriesState = [];
let subCategoriesState = [];

// Redux-action-enabled cache reducer
export const dataCacheReducer = async (dispatch) => {
  // Categories
  if (categoriesState.length === 0) {
    try {
      const res = await CategoryServiceOperations.Allcategories();
      categoriesState = res.data?.data || [];
      console.log("✅ Categories fetched and cached.");

      dispatch({
        type: "SET_CATEGORIES",
        payload: categoriesState,
      });
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
    }
  } else {
    dispatch({
      type: "SET_CATEGORIES",
      payload: categoriesState,
    });
  }

  // Subcategories
  if (subCategoriesState.length === 0) {
    try {
      const res = await SubCategoryServiceOperations.AllSubcategories();
      subCategoriesState = res.data?.data || [];
      console.log("✅ Subcategories fetched and cached.");

      dispatch({
        type: "SET_SUBCATEGORIES",
        payload: subCategoriesState,
      });
    } catch (err) {
      console.error("❌ Error fetching subcategories:", err);
    }
  } else {
    dispatch({
      type: "SET_SUBCATEGORIES",
      payload: subCategoriesState,
    });
  }

  return {
    categories: categoriesState,
    subcategories: subCategoriesState,
  };
};