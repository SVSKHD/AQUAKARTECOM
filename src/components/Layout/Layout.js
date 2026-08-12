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
import useManagedSeo from "@/hooks/useManagedSeo";
import { getManagedSeoPageKey } from "@/utils/managedSeo";

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

// Festival widget: also lazy-load (often non-critical for LCP)
const FestivalCornerWidget = dynamic(
  () => import("../reusables/FestivalCornerWidget"),
  { ssr: false },
);

// Mobile bottom nav: client-only
const MobileBottomNav = dynamic(() => import("./MobileBottomNav"), {
  ssr: false,
});

const AquaLayout = (props) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const allowPageSticky = Boolean(props.allowPageSticky);

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
  const managedSeo = useManagedSeo(
    getManagedSeoPageKey(router.pathname),
    props.managedSeo,
  );

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
        <div className="aqua-site-layer flex min-h-screen w-full max-w-full flex-col overflow-x-hidden pt-24">
          <main className="aqua-site-content flex min-w-0 flex-1 flex-col items-center justify-center overflow-x-hidden">
            <div className="glass-card mx-4 max-w-md rounded-3xl p-10 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100/80">
                <svg
                  className="h-8 w-8 text-rose-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-3">
                Network Error
              </h1>
              <p className="text-slate-500 mb-6">
                Please check your internet connection and try again.
              </p>
              <button
                onClick={handleRetry}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-full shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
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
        data={managedSeo || props.seo}
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
          <FestivalCornerWidget />
        </>
      )}

      <div
        className={`aqua-site-layer relative flex min-h-screen w-full max-w-full flex-col pt-24 pb-16 sm:pb-0 ${
          allowPageSticky ? "overflow-x-clip" : "overflow-x-hidden"
        }`}
      >
        <main
          className={`aqua-site-content relative z-10 min-w-0 flex-1 ${
            allowPageSticky ? "overflow-x-clip" : "overflow-x-hidden"
          }`}
        >
          {props.children}
        </main>
        <AquaFooter categories={categories} subcategories={subcategories} />
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </>
  );
};

export default AquaLayout;
