// src/app/store/rootReducer.ts
import { combineReducers } from "@reduxjs/toolkit";

import { authStatusReducer } from "./authreducer";

const rootReducer = combineReducers({
  authStatus: authStatusReducer,
});

export default rootReducer;
