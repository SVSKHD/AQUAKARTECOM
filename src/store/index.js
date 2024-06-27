import { combineReducers } from "redux";
// reducers
import { favDrawerReducer } from "./reducers/FavDrawerReducer";
import { cartDrawerReducer } from "./reducers/cartDrawerReducer";
import { authDialogReducer } from "./reducers/authDialog";
import { favDataReducer } from "./reducers/favDataReducer";
import { cartDataReducer } from "./reducers/cartDataReducer";
import { userReducer } from "./reducers/userDataReducer";
import { userStatusReducer } from "./reducers/userStatusReducer";

const rootReducer = combineReducers({
  favDrawer: favDrawerReducer,
  cartDrawer: cartDrawerReducer,
  authDialog: authDialogReducer,
  favData: favDataReducer,
  cartData: cartDataReducer,
  userData: userReducer,
  userStatus:userStatusReducer
});

export default rootReducer;
