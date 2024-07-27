export const addressData = (state = null, action) => {
  switch (action.type) {
    case "SET_ADDRESS_DATA":
      return action.payload;
    default:
      return state;
  }
};
