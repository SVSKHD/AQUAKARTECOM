export const cartDrawerReducer = (state = false, action) => {
  switch (action.type) {
    case "SET_CART_DRAWER_VISIBLE":
      return action.payload;
    default:
      return state;
  }
};
