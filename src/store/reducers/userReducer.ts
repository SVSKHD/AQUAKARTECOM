interface User {
  selectedAddress?: string;
  addresses?: string[];
  phone?: string;
  [key: string]: any; // for additional properties
}

interface UserState {
  user: User | null;
}

type Action =
  | { type: "LOGGED_IN_USER"; payload: User }
  | { type: "LOGOUT"; payload: null }
  | { type: "UPDATE_USER_DETAILS"; payload: Partial<User> }
  | { type: "UPDATE_SELECTED_ADDRESS"; payload: { selectedAddress: string } }
  | { type: "UPDATE_USER_ADDRESSES"; payload: { addresses: string[] } }
  | { type: "UPDATE_USER_PHONE"; payload: { phone: string } };

export const userReducer = (
  state: UserState | null = null,
  action: Action,
): UserState | null => {
  switch (action.type) {
    case "LOGGED_IN_USER":
    case "LOGOUT":
      return { user: action.payload };
    case "UPDATE_USER_DETAILS":
      return {
        ...state,
        user: {
          ...state?.user,
          ...action.payload,
        },
      };
    case "UPDATE_SELECTED_ADDRESS":
      return {
        ...state,
        user: {
          ...state?.user,
          selectedAddress: action.payload.selectedAddress,
        },
      };
    case "UPDATE_USER_ADDRESSES":
      return {
        ...state,
        user: {
          ...state?.user,
          addresses: action.payload.addresses,
        },
      };
    case "UPDATE_USER_PHONE":
      return {
        ...state,
        user: {
          ...state?.user,
          phone: action.payload.phone,
        },
      };
    default:
      return state;
  }
};
