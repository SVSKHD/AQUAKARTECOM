import "@/styles/globals.css";
import "@/styles/aqua-loader.css";
import "@/styles/mobile-viewport.css";
import "@/styles/product-loader-fixes.css";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import rootReducer from "@/store";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { useRouter } from "next/router";
import Script from "next/script";
import { Roboto_Mono, Montserrat } from "next/font/google";
import AquaAppLoader from "@/components/common/AquaAppLoader";
import { AuthProvider } from "@/context/AuthContext";
import { startAnalyticsVisit } from "@/services/analyticsTracker";

const robotoMono = Roboto_Mono({ subsets: ["latin"], display: "swap", variable: "--font-roboto-mono" });
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", variable: "--font-montserrat" });
const Toaster = dynamic(() => import("sonner").then((mod) => mod.Toaster), { ssr: false });

const GA_ID = "G-FS41RRVRD4";
const APP_BOOT_MIN_MS = 0;
const APP_BOOT_MAX_MS = 1200;
const ROUTE_LOADER_DELAY_MS = 120;
const ROUTE_LOADER_MIN_MS = 180;
const persistConfig = { key: "root", storage };
const persistedReducer = persistReducer(persistConfig, rootReducer);
const store = createStore(persistedReducer);
const persistor = persistStore(store);
const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

const waitForWindowLoad = () =>
  new Promise((resolve) => {
    if (typeof window === "undefined" || document.readyState === "complete") {
      resolve();
      return;
    }
    window.addEventListener("load", resolve, { once: true });
  });

const routePathname = (url = "") => url.split("?")[0].split("#")[0];
const isDashboardTabChange = (from, to) =>
  from.startsWith("/dashboard") && routePathname(to).startsWith("/dashboard");

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [routeLoading, setRouteLoading] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const loaderTimerRef = useRef(null);
  const loaderStartedAtRef = useRef(0);
  const routeHideTimerRef = useRef(null);
  const skipRouteLoaderRef = useRef(false);
  const analyticsStopRef = useRef(null);

  useEffect(() => {
    const beginVisit = (url) => {
      analyticsStopRef.current?.();
      analyticsStopRef.current = startAnalyticsVisit(url);
    };

    beginVisit(router.asPath);
    router.events.on("routeChangeComplete", beginVisit);
    return () => {
      router.events.off("routeChangeComplete", beginVisit);
      analyticsStopRef.current?.();
      analyticsStopRef.current = null;
    };
  }, [router.events]);

  useEffect(() => {
    const handleRouteChange = (url) => window.gtag?.("config", GA_ID, { page_path: url });
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  useEffect(() => {
    let isMounted = true;
    const prepareFirstPaint = async () => {
      await Promise.race([Promise.all([wait(APP_BOOT_MIN_MS), waitForWindowLoad()]), wait(APP_BOOT_MAX_MS)]);
      if (isMounted) setAppReady(true);
    };
    prepareFirstPaint();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const showRouteLoader = (url) => {
      skipRouteLoaderRef.current = isDashboardTabChange(router.asPath, url);
      if (skipRouteLoaderRef.current) {
        setRouteLoading(false);
        return;
      }
      window.clearTimeout(loaderTimerRef.current);
      window.clearTimeout(routeHideTimerRef.current);
      loaderTimerRef.current = window.setTimeout(() => {
        loaderStartedAtRef.current = Date.now();
        setRouteLoading(true);
      }, ROUTE_LOADER_DELAY_MS);
    };

    const hideRouteLoader = () => {
      if (skipRouteLoaderRef.current) {
        skipRouteLoaderRef.current = false;
        setRouteLoading(false);
        return;
      }
      window.clearTimeout(loaderTimerRef.current);
      const elapsed = Date.now() - loaderStartedAtRef.current;
      const remaining = Math.max(ROUTE_LOADER_MIN_MS - elapsed, 0);
      routeHideTimerRef.current = window.setTimeout(() => setRouteLoading(false), remaining);
    };

    router.events.on("routeChangeStart", showRouteLoader);
    router.events.on("routeChangeComplete", hideRouteLoader);
    router.events.on("routeChangeError", hideRouteLoader);
    return () => {
      window.clearTimeout(loaderTimerRef.current);
      window.clearTimeout(routeHideTimerRef.current);
      router.events.off("routeChangeStart", showRouteLoader);
      router.events.off("routeChangeComplete", hideRouteLoader);
      router.events.off("routeChangeError", hideRouteLoader);
    };
  }, [router.asPath, router.events]);

  useEffect(() => { if (typeof window !== "undefined") persistor.persist(); }, []);
  const shouldShowLoader = !appReady || routeLoading;

  return (
    <Provider store={store}>
        <style jsx global>{`
          :root {
            --font-roboto-mono: ${robotoMono.style.fontFamily};
            --font-montserrat: ${montserrat.style.fontFamily};
          }
        `}</style>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
        <AuthProvider>
          <div className={`${robotoMono.variable} ${montserrat.variable}`}>
            {!appReady ? <AquaAppLoader variant="screen" message="Welcome to Aquakart" subtext="Getting the page ready for you." /> : null}
            {routeLoading ? <AquaAppLoader variant="route" message="Opening Aquakart" subtext="Preparing the next page smoothly." /> : null}
            <main
              key={router.pathname.startsWith("/dashboard") ? "dashboard-shell" : router.asPath}
              className="aqua-page-shell aqua-page-enter"
              data-route={router.pathname}
              aria-busy={shouldShowLoader}
              style={{
                opacity: routeLoading ? 0 : 1,
                pointerEvents: shouldShowLoader ? "none" : "auto",
                transform: "none",
                transition: routeLoading ? "none" : "opacity 420ms ease, transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <Component {...pageProps} />
            </main>
            <Toaster position="top-right" richColors closeButton />
          </div>
        </AuthProvider>
    </Provider>
  );
}
