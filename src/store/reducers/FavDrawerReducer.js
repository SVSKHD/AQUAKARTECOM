export const favDrawerReducer = (state = false, action) => {
  switch (action.type) {
    case "SET_FAV_DRAWER_VISIBLE":
      return action.payload;
    default:
      return state;
  }
};
