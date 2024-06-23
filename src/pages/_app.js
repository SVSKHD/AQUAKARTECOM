import "@/styles/globals.css";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import rootReducer from "@/store";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { PersistGate } from "redux-persist/integration/react";
import { useStore } from "react-redux";

const persistConfig = {
  key: "root",
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = createStore(persistedReducer);
const persistor = persistStore(store);

export default function App({ Component, pageProps }) {
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
