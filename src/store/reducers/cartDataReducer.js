// Empty on the server and on the first client render alike: the saved list
// comes back through redux-persist after mount (see _app.js). Reading
// localStorage here made the header badge render on the client only and
// broke hydration.
const initialState = [];

// Reducer function for cart operations
export const cartDataReducer = (state = initialState, action) => {
  switch (action.type) {
    case "ADD_TO_CART":
      const itemIndex = state.findIndex(
        (item) => item._id === action.payload._id,
      );
      if (itemIndex >= 0) {
        return state; // Item already exists, no addition
      } else {
        const newState = [...state, action.payload];
        localStorage.setItem("cart", JSON.stringify(newState));
        return newState;
      }

    case "REMOVE_FROM_CART":
      const newState = state.filter((item) => item._id !== action.payload);
      localStorage.setItem("cart", JSON.stringify(newState));
      return newState;

    case "UPDATE_QUANTITY":
      const newStateUpdate = state.map((item) => {
        if (item._id === action.payload.productId) {
          const updatedQuantity = Math.max(action.payload.quantity, 1);
          return { ...item, quantity: updatedQuantity };
        }
        return item;
      });
      localStorage.setItem("cart", JSON.stringify(newStateUpdate));
      return newStateUpdate;

    case "EMPTY_CART":
      localStorage.removeItem("cart"); // Remove the cart from local storage
      return []; // Return an empty array to reset the cart state

    default:
      return state;
  }
};
