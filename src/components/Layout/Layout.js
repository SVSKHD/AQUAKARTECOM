import AquaCartDrawer from "../common/commonDrawers/cartDrawer";
import AquafavDrawer from "../common/commonDrawers/favDrawer";
import AquaToast from "../reusables/toast";
import AquaFooter from "./Footer";
import AquaHeader from "./Header";
import AquaSeoRevamp from "./seo/RefactoredSeo";
import AquaUserDataDrawer from "../common/commonDrawers/userDataDrawer";
import AquaUserAuthDialog from "../common/commonDialogs/authDialog";
import AquaCartAddressDialog from "../common/commonDialogs/cartAddress";
import AquaTailwindToast from "../toast/TailwindToast";
import useNetworkStatus from "@/utils/connectivity";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import CategoryServiceOperations from "@/services/category";
import SubCategoryServiceOperations from "@/services/subcategory";
import FestivalCornerWidget from "../reusables/FestivalCornerWidget";

const AquaLayout = (props) => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [seo, setSeo] = useState({
    path: "",
    product: "",
    category: "",
    subCategory: "",
  });

  const { categories, subcategories } = useSelector(
    (state) => state.dynamicData,
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!categories || categories.length === 0) {
        const catData = await CategoryServiceOperations.Allcategories();
        dispatch({ type: "SET_CATEGORIES", payload: catData?.data?.data });
      }
      if (!subcategories || subcategories.length === 0) {
        const subCatData =
          await SubCategoryServiceOperations.AllSubcategories();
        dispatch({
          type: "SET_SUBCATEGORIES",
          payload: subCatData?.data?.data,
        });
      }
    };
    fetchData();
  }, [categories, subcategories, dispatch]);

  useEffect(() => {
    const { pathname } = router;
    const formattedPath = pathname.split("/")[1];

    const newSeo = {
      path: "",
      product: "",
      category: "",
      subCategory: "",
    };

    if (pathname === "/") {
      newSeo.path = "home";
    } else if (formattedPath === "product") {
      newSeo.product = "product";
    } else if (formattedPath === "category") {
      newSeo.category = "category";
    } else if (formattedPath === "subcategory") {
      newSeo.subCategory = "subcategory";
    } else if (formattedPath) {
      newSeo.path = formattedPath;
    }

    setSeo(newSeo);
  }, [router.pathname, dispatch]);

  const Status = useNetworkStatus();
  const handleRetry = () => {
    window.location.reload(); // This reloads the page
  };
  return (
    <>
      {Status ? (
        <>
          <AquaSeoRevamp
            path={seo?.path}
            category={seo?.category}
            categoryData={props?.categoryData}
            subcategory={seo?.subCategory}
            subcategoryData={props?.subcategoryData}
            product={seo?.product}
            productData={props?.productPageData}
            productList={props?.productListData}
            blogList={props?.blogListData}
            blogPage={props?.blogPageData}
          />
          <AquaCartAddressDialog />
          <AquaUserDataDrawer />
          <AquaUserAuthDialog />
          <AquaHeader />

          <AquaCartDrawer />
          <AquafavDrawer />
          <AquaTailwindToast />
          <AquaToast />
          <FestivalCornerWidget />

          <div className="flex min-h-screen flex-col bg-white pt-24">
            <main className="flex-1">{props.children}</main>

            <AquaFooter categories={categories} subcategories={subcategories} />
          </div>
        </>
      ) : (
        <>
          <AquaHeader />

          <div className="flex min-h-screen flex-col bg-white">
            <main className="flex flex-1 flex-col items-center justify-center">
              <div className="text-center p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">
                  Network Error
                </h1>
                <p className="text-gray-600">
                  Please check your internet connection and try again.
                </p>
                <button
                  onClick={handleRetry}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700 transition duration-300"
                >
                  Retry
                </button>
              </div>
            </main>

            <AquaFooter categories={categories} subcategories={subcategories} />
          </div>
        </>
      )}
    </>
  );
};

export default AquaLayout;
