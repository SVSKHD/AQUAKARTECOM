import "@/styles/globals.css";
import { Provider } from "react-redux";
import { createStore } from "redux";
import rootReducer from "@/store";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { PersistGate } from "redux-persist/integration/react";

const persistConfig = {
  key: "root",
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = createStore(persistedReducer);
export const persistor = persistStore(store);

export default function App({ Component, pageProps }) {
  return(
  <Provider store={store}>
    <PersistGate persistor={persistor}>
      <Component {...pageProps} />
    </PersistGate>
  </Provider>
)
}
