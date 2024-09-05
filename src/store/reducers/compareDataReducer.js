let initialState = [];
if (typeof window !== "undefined") {
  const storedCompare = localStorage.getItem("compare");
  initialState = storedCompare ? JSON.parse(storedCompare) : [];
}

export const compareDataReducer = (state = initialState, action) => {
  switch (action.type) {
    case "ADD_TO_COMPARE":
      const itemIndex = state.findIndex(
        (item) => item._id === action.payload._id
      );
      if (itemIndex >= 0) {
        return state; // Item already exists, no addition
      } else {
        const updatedState = [...state, action.payload];
        localStorage.setItem("compare", JSON.stringify(updatedState));
        return updatedState;
      }

    case "REMOVE_FROM_COMPARE":
      const filteredState = state.filter((item) => item._id !== action.payload);
      localStorage.setItem("compare", JSON.stringify(filteredState));
      return filteredState;

    case "UPDATE_COMPARE":
      const updatedStateWithQuantity = state.map((item) => {
        if (item._id === action.payload.productId) {
          const updatedQuantity = Math.max(action.payload.quantity, 1);
          return { ...item, quantity: updatedQuantity };
        }
        return item;
      });
      localStorage.setItem("compare", JSON.stringify(updatedStateWithQuantity));
      return updatedStateWithQuantity;

    case "EMPTY_COMPARE":
      localStorage.removeItem("compare");
      return [];

    default:
      return state;
  }
};
