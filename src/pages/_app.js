import "@/styles/globals.css";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import rootReducer from "@/store";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { PersistGate } from "redux-persist/integration/react";
import { useRouter } from "next/router";
import Script from "next/script";

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

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Track route changes in GA
  useEffect(() => {
    const handleRouteChange = (url) => {
      window.gtag?.("config", GA_ID, { page_path: url });
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      persistor.persist();
    }
  }, []);

  return (
    <Provider store={store}>
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

      {/* Render page content immediately — don't block LCP with PersistGate loading screen.
          PersistGate with loading={null} still hydrates Redux from localStorage,
          but renders children right away instead of showing a preloader. */}
      <PersistGate persistor={persistor} loading={null}>
        <Component {...pageProps} />
        <Toaster position="top-right" richColors closeButton />
      </PersistGate>
    </Provider>
  );
}
