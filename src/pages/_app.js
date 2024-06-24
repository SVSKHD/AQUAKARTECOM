import "@/styles/globals.css";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import rootReducer from "@/store";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { PersistGate } from "redux-persist/integration/react";
import { useStore } from "react-redux";
import { useRouter } from "next/router";

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
  // This useEffect will run only on the client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      persistor.persist();
    }
  }, []);

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={<div>Loading...</div>}>
        <Component {...pageProps} />
      </PersistGate>
    </Provider>
  );
}
