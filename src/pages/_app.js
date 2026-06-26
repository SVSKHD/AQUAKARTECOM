import "@/styles/globals.css";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import rootReducer from "@/store";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { PersistGate } from "redux-persist/integration/react";
import { useRouter } from "next/router";
import Script from "next/script";
import { Roboto_Mono, Montserrat } from "next/font/google";
import AquaAppLoader from "@/components/common/AquaAppLoader";

// ╔═══════════════════════════════════════════════════════╗
// ║  FONT CONTROL — primary = Roboto Mono, fallback = Montserrat
// ║  Tweak weights/subsets here, or adjust the stack in globals.css
// ╚═══════════════════════════════════════════════════════╝
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

// Lazy-load Toaster — it's never needed for FCP/LCP
const Toaster = dynamic(() => import("sonner").then((mod) => mod.Toaster), {
  ssr: false,
});

const GA_ID = "G-FS41RRVRD4";

const persistConfig = {
  key: "root",
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = createStore(persistedReducer);
const persistor = persistStore(store);

const PersistLoader = () => (
  <AquaAppLoader
    variant="screen"
    message="Preparing Aquakart"
    subtext="Syncing your cart, profile and order experience."
  />
);

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [routeLoading, setRouteLoading] = useState(false);
  const loaderTimerRef = useRef(null);

  // Track route changes in GA
  useEffect(() => {
    const handleRouteChange = (url) => {
      window.gtag?.("config", GA_ID, { page_path: url });
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  useEffect(() => {
    const showRouteLoader = () => {
      window.clearTimeout(loaderTimerRef.current);
      loaderTimerRef.current = window.setTimeout(() => {
        setRouteLoading(true);
      }, 120);
    };

    const hideRouteLoader = () => {
      window.clearTimeout(loaderTimerRef.current);
      setRouteLoading(false);
    };

    router.events.on("routeChangeStart", showRouteLoader);
    router.events.on("routeChangeComplete", hideRouteLoader);
    router.events.on("routeChangeError", hideRouteLoader);

    return () => {
      window.clearTimeout(loaderTimerRef.current);
      router.events.off("routeChangeStart", showRouteLoader);
      router.events.off("routeChangeComplete", hideRouteLoader);
      router.events.off("routeChangeError", hideRouteLoader);
    };
  }, [router.events]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      persistor.persist();
    }
  }, []);

  return (
    <Provider store={store}>
      {/* Expose next/font family strings as CSS vars on :root so globals.css can consume them */}
      <style jsx global>{`
        :root {
          --font-roboto-mono: ${robotoMono.style.fontFamily};
          --font-montserrat: ${montserrat.style.fontFamily};
        }
      `}</style>

      {/* Google Analytics — loaded after page is interactive, not blocking */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>

      <PersistGate persistor={persistor} loading={<PersistLoader />}>
        <div className={`${robotoMono.variable} ${montserrat.variable}`}>
          {routeLoading ? (
            <AquaAppLoader
              variant="route"
              message="Opening Aquakart"
              subtext="Loading the next page with fresh details."
            />
          ) : null}
          <main className="aqua-page-shell">
            <Component {...pageProps} />
          </main>
          <Toaster position="top-right" richColors closeButton />
        </div>
      </PersistGate>
    </Provider>
  );
}
