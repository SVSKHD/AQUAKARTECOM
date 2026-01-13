import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";

import AquaFooter from "./Footer";
import AquaHeader from "./Header";
import AquaSeoRevamp from "./seo/RefactoredSeo";
import AquaUserDataDrawer from "../common/commonDrawers/userDataDrawer";
import AquaUserAuthDialog from "../common/commonDialogs/authDialog";
import AquaCartAddressDialog from "../common/commonDialogs/cartAddress";
import useNetworkStatus from "@/utils/connectivity";

import CategoryServiceOperations from "@/services/category";
import SubCategoryServiceOperations from "@/services/subcategory";

// Lazy client-only overlays (don’t hurt SSR/LCP)
const AquaCartDrawer = dynamic(
  () => import("../common/commonDrawers/cartDrawer"),
  { ssr: false },
);
const AquafavDrawer = dynamic(
  () => import("../common/commonDrawers/favDrawer"),
  {
    ssr: false,
  },
);
const AquaToast = dynamic(() => import("../reusables/toast"), { ssr: false });
const AquaTailwindToast = dynamic(() => import("../toast/TailwindToast"), {
  ssr: false,
});

// Festival widget: also lazy-load (often non-critical for LCP)
const FestivalCornerWidget = dynamic(
  () => import("../reusables/FestivalCornerWidget"),
  { ssr: false },
);

const AquaLayout = (props) => {
  const router = useRouter();
  const dispatch = useDispatch();

  const { categories, subcategories } = useSelector(
    (state) => state.dynamicData,
  );

  // Mount heavy overlays only after user interaction (reduces LCP + main-thread work)
  const [mountOverlays, setMountOverlays] = useState(false);

  // Build SEO info from route without extra setState rerenders
  const seo = useMemo(() => {
    const pathname = router.pathname || "";
    const formattedPath = (pathname.split("/")[1] || "").trim();

    const next = {
      path: "",
      product: "",
      category: "",
      subCategory: "",
    };

    if (pathname === "/") next.path = "home";
    else if (formattedPath === "product") next.product = "product";
    else if (formattedPath === "category") next.category = "category";
    else if (formattedPath === "subcategory") next.subCategory = "subcategory";
    else if (formattedPath) next.path = formattedPath;

    return next;
  }, [router.pathname]);

  // Mount overlays on first interaction OR after a short delay
  useEffect(() => {
    if (typeof window === "undefined") return;

    const enable = () => setMountOverlays(true);

    window.addEventListener("pointerdown", enable, { once: true });
    window.addEventListener("keydown", enable, { once: true });

    // Fallback: if user never interacts, still mount after a bit
    const t = window.setTimeout(enable, 2500);

    return () => {
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("keydown", enable);
      window.clearTimeout(t);
    };
  }, []);

  // Defer categories fetch until browser is idle (prevents competing with LCP)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const run = async () => {
      // Don’t refetch if already present
      if (categories?.length && subcategories?.length) return;

      try {
        const tasks = [];

        tasks.push(
          !categories?.length
            ? CategoryServiceOperations.Allcategories()
            : Promise.resolve(null),
        );
        tasks.push(
          !subcategories?.length
            ? SubCategoryServiceOperations.AllSubcategories()
            : Promise.resolve(null),
        );

        const [catData, subCatData] = await Promise.all(tasks);
        if (cancelled) return;

        if (catData?.data?.data) {
          dispatch({ type: "SET_CATEGORIES", payload: catData.data.data });
        }
        if (subCatData?.data?.data) {
          dispatch({
            type: "SET_SUBCATEGORIES",
            payload: subCatData.data.data,
          });
        }
      } catch (e) {
        // optionally log
      }
    };

    const hasRIC = typeof window.requestIdleCallback === "function";
    const ricId = hasRIC
      ? window.requestIdleCallback(run, { timeout: 3000 })
      : null;
    const t = window.setTimeout(run, 1200);

    return () => {
      cancelled = true;
      if (hasRIC && ricId) window.cancelIdleCallback(ricId);
      window.clearTimeout(t);
    };
    // Intentionally run once on mount to avoid re-fetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Status = useNetworkStatus();

  const handleRetry = () => {
    window.location.reload();
  };

  if (!Status) {
    return (
      <>
        <AquaHeader />
        <div className="flex min-h-screen pt-24 flex-col bg-white">
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
    );
  }

  return (
    <>
      <AquaSeoRevamp
        path={seo.path}
        category={seo.category}
        categoryData={props?.categoryData}
        subcategory={seo.subCategory}
        subcategoryData={props?.subcategoryData}
        product={seo.product}
        productData={props?.productPageData}
        productList={props?.productListData}
        blogList={props?.blogListData}
        blogPage={props?.blogPageData}
      />

      {/* Essential UI */}
      <AquaCartAddressDialog />
      <AquaUserDataDrawer />
      <AquaUserAuthDialog />
      <AquaHeader />

      {/* Heavy overlays later */}
      {mountOverlays && (
        <>
          <AquaCartDrawer />
          <AquafavDrawer />
          <AquaTailwindToast />
          <AquaToast />
          <FestivalCornerWidget />
        </>
      )}

      <div className="flex min-h-screen flex-col bg-white pt-24">
        <main className="flex-1">{props.children}</main>
        <AquaFooter categories={categories} subcategories={subcategories} />
      </div>
    </>
  );
};

export default AquaLayout;
