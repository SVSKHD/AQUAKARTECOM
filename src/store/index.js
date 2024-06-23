import { combineReducers } from "redux";
// reducers
import { favDrawerReducer } from "./reducers/FavDrawerReducer";
import { cartDrawerReducer } from "./reducers/cartDrawerReducer";
import { authDialogReducer } from "./reducers/authDialog";
import { favDataReducer } from "./reducers/favDataReducer";
import { cartDataReducer } from "./reducers/cartDataReducer";

const rootReducer = combineReducers({
  favDrawer: favDrawerReducer,
  cartDrawer: cartDrawerReducer,
  authDialog: authDialogReducer,
  favData: favDataReducer,
  cartData: cartDataReducer,
});

export default rootReducer;
