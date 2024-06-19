export interface SetCartDrawerVisibleAction {
  type: "SET_CART_DRAWER_VISIBLE";
  payload: boolean;
}

// Define the type for actions
export type CartDrawerAction = SetCartDrawerVisibleAction;

// Define the initial state
const initialState: boolean = false;

// Define the reducer
export const cartDrawerReducer = (
  state = initialState,
  action: CartDrawerAction,
): boolean => {
  switch (action.type) {
    case "SET_CART_DRAWER_VISIBLE":
      return action.payload;
    default:
      return state;
  }
};
