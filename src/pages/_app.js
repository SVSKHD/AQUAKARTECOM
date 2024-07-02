import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import rootReducer from "@/store";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { PersistGate } from "redux-persist/integration/react";
import { useRouter } from "next/router";

const persistConfig = {
  key: "root",
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = createStore(persistedReducer);
const persistor = persistStore(store);

export default function App({ Component, pageProps }) {

 const [show , setShow] = useState(false)

const Toast = ({ message, onClose }) => {
  return (
    <div className="fixed bottom-5 right-5 bg-white border border-gray-300 rounded-lg shadow-lg p-4 flex items-center space-x-4">
      <div className="text-sm text-gray-700">
        {message}
      </div>
      <button
        onClick={onClose}
        className="bg-blue-500 text-white px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
      >
        Close
      </button>
    </div>
  );
};

const handleShowToast = () => {
  setShowToast(true);
  setTimeout(() => setShowToast(false), 3000); // Auto-hide toast after 3 seconds
};


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
        <div className="flex items-center justify-center h-screen">
      <button
        onClick={handleShowToast}
        className="bg-green-500 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
      >
        Show Toast
      </button>

      {show && (
        <Toast 
          message="This is a toast notification!" 
          onClose={() => setShow(false)}
        />
      )}
    </div>
      </PersistGate>
    </Provider>
  );
}
