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

const AquaLayout = (props) => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [seo, setSeo] = useState({
    path: "",
    product: "",
    category: "",
    subCategory: "",
  });

  const [setDataCategories, setcategories] = useState([]);
  const [setDataSubCategories, setsubcategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const catData = await CategoryServiceOperations.Allcategories();
      console.log("catData", catData?.data?.data);
      setcategories(catData?.data?.data);

      const subCatData = await SubCategoryServiceOperations.AllSubcategories();
      console.log("subCatData", subCatData?.data?.data);
      setsubcategories(subCatData?.data?.data);
    };

    fetchData();
  }, [setDataCategories.length, setDataSubCategories.length]);

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
          {/* <AquaSeo seo={props.seo} /> */}

          <AquaSeoRevamp
            path={seo?.path}
            category={seo?.category}
            categoryData={props?.categoryData}
            subcategory={seo?.subCategory}
            subcategoryData={props?.subcategoryData}
            product={seo?.product}
            productData={props?.productPageData}
          />
          <AquaCartAddressDialog />
          <AquaUserDataDrawer />
          <AquaUserAuthDialog />
          <AquaHeader />

          <AquaCartDrawer />
          <AquafavDrawer />
          <AquaTailwindToast />
          <AquaToast />

          <main className="bg-white min-h-screen">{props.children}</main>

          <AquaFooter
            categories={setDataCategories}
            subcategories={setDataSubCategories}
          />
        </>
      ) : (
        <>
          <AquaHeader />
          <main className="bg-white min-h-screen flex flex-col justify-center items-center">
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
          <AquaFooter
            categories={setDataCategories}
            subcategories={setDataSubCategories}
          />
        </>
      )}
    </>
  );
};

export default AquaLayout;
