// src/app/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./reducers/rootReducer"; // Adjust the path if necessary

const store = configureStore({
  reducer: rootReducer,
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export default store;
