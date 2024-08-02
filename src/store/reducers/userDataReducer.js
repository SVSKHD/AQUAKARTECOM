export const userReducer = (state = null, action) => {
  switch (action.type) {
    case "LOGGED_IN_USER":
    case "LOGOUT":
      return action.payload;
    case "UPDATE_USER_DETAILS":
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        },
      };
    case "UPDATE_SELECTED_ADDRESS":
      const newState = {
        ...state,
        user: {
          ...state.user,
          selectedAddress: action.payload.selectedAddress,
        },
      };
      console.log("Updated state", newState);
      return newState;

    case "UPDATE_USER_ADDRESSES":
      return {
        ...state,
        user: {
          ...state.user,
          addresses: action.payload.addresses,
        },
      };
    case "UPDATE_USER_PHONE":
      return {
        ...state,
        user: {
          ...state.user,
          phone: action.payload.phone,
        },
      };
    default:
      return state;
  }
};
