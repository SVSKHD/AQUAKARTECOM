export const userDataDrawerReducer = (state = false, action) => {
  switch (action.type) {
    case "SET_USER_DATA_DRAWER":
      return action.payload;
    default:
      return state;
  }
};
