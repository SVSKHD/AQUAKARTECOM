// Initial state loaded from local storage or set to an empty array
let initialState = [];
if (typeof window !== "undefined") {
  const storedCart = localStorage.getItem("compare");
  initialState = storedCart ? JSON.parse(storedCart) : [];
}

// Reducer function for cart operations
export const compareDataReducer = (state = initialState, action) => {
  switch (action.type) {
    case "ADD_TO_COMPARE":
      const itemIndex = state.findIndex(
        (item) => item._id === action.payload._id,
      );
      if (itemIndex >= 0) {
        return state; // Item already exists, no addition
      } else {
        const newState = [...state, action.payload];
        localStorage.setItem("compare", JSON.stringify(newState));
        return newState;
      }

    case "REMOVE_FROM_COMPARE":
      const newState = state.filter((item) => item._id !== action.payload);
      localStorage.setItem("compare", JSON.stringify(newState));
      return newState;

    default:
      return state;
  }
};
