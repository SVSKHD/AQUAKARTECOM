// src/app/store/rootReducer.ts
import { combineReducers } from "@reduxjs/toolkit";

import { authStatusReducer } from "./authreducer";
import { userReducer } from "./userReducer";

const rootReducer = combineReducers({
  authStatus: authStatusReducer,
  user: userReducer,
});

export default rootReducer;
