export const addressDialog = (state = false, action) => {
  switch (action.type) {
    case "SET_ADDRESS_DIALOG":
      return action.payload;
    default:
      return state;
  }
};
