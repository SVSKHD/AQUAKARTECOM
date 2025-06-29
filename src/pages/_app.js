import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import rootReducer from "@/store";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { PersistGate } from "redux-persist/integration/react";
import { useRouter } from "next/router";
import { Toaster } from "sonner";

const persistConfig = {
  key: "root",
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = createStore(persistedReducer);
const persistor = persistStore(store);

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Function to initialize gtag
    function gtag() {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(arguments);
    }

    // Check if script is already loaded
    if (!window.gtag) {
      // Create script element
      const script = document.createElement("script");
      script.src = `https://www.googletagmanager.com/gtag/js?id=G-FS41RRVRD4`;
      script.async = true;
      document.head.appendChild(script);

      // Initialize dataLayer and configure gtag
      script.onload = () => {
        window.dataLayer = window.dataLayer || [];
        function gtag() {
          dataLayer.push(arguments);
        }
        window.gtag = gtag;
        gtag("js", new Date());
        gtag("config", "G-FS41RRVRD4");
      };
    }

    // Route change handler
    const handleRouteChange = (url) => {
      window.gtag("config", "G-FS41RRVRD4", {
        page_path: url,
      });
    };

    // Subscribe to route changes
    router.events.on("routeChangeComplete", handleRouteChange);

    // Cleanup on unmount
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  useEffect(() => {
    // This useEffect will run only on the client side
    if (typeof window !== "undefined") {
      persistor.persist();

      // Disable right-click across the entire app
      const handleContextMenu = (e) => {
        e.preventDefault();
      };

      document.addEventListener("contextmenu", handleContextMenu);
      return () => {
        document.removeEventListener("contextmenu", handleContextMenu);
      };
    }
  }, []);

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={<div>Loading...</div>}>
        <Component {...pageProps} />
        <Toaster position="top-right" richColors closeButton />
      </PersistGate>
    </Provider>
  );
}
