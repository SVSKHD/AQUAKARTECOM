"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { legacy_createStore as createStore, type Reducer } from "redux";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import rootReducer from "@/store";

// Same reducer and persist key as pages/_app.js, so cart, favourites and the
// signed-in user are shared with the rest of the site.
const persistConfig = {
  key: "root",
  storage,
  blacklist: [
    "toastNotify",
    "favDrawer",
    "cartDrawer",
    "authDialog",
    "userDataDrawer",
    "addressDialog",
  ],
};

// The JS reducers' inferred types are too narrow (e.g. `toasts: never[]`); treat the root state loosely.
type AnyState = Record<string, unknown>;

function makeStore() {
  const store = createStore(
    persistReducer<AnyState>(
      persistConfig,
      rootReducer as unknown as Reducer<AnyState>,
    ),
  );
  // `manualPersist` exists at runtime (redux-persist 6) but is missing from its typings.
  const persistor = persistStore(store, { manualPersist: true } as Parameters<
    typeof persistStore
  >[1]);
  return { store, persistor };
}

export default function AquaProviders({ children }: { children: ReactNode }) {
  const [{ store, persistor }] = useState(makeStore);
  // Rehydrate after mount so the first client render matches the server HTML.
  useEffect(() => {
    persistor.persist();
  }, [persistor]);
  return <Provider store={store}>{children}</Provider>;
}
