// src/app/store/rootReducer.ts
import { combineReducers } from "@reduxjs/toolkit";

import { authStatusReducer } from "./authreducer";
import { userReducer } from "./userReducer";
import { cartDrawerReducer } from "./cartdrawer";

const rootReducer = combineReducers({
  authStatus: authStatusReducer,
  user: userReducer,
  cartDrawer: cartDrawerReducer,
});

export default rootReducer;
