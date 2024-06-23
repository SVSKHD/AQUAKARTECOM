// Initial state loaded from local storage or set to an empty array
let initialState = [];
if (typeof window !== "undefined") {
  const storedCart = localStorage.getItem("fav");
  initialState = storedCart ? JSON.parse(storedCart) : [];
}

// Reducer function for cart operations
export const favDataReducer = (state = initialState, action) => {
  switch (action.type) {
    case "ADD_TO_FAV":
      const itemIndex = state.findIndex(
        (item) => item._id === action.payload._id,
      );
      if (itemIndex >= 0) {
        return state; // Item already exists, no addition
      } else {
        const newState = [...state, action.payload];
        localStorage.setItem("fav", JSON.stringify(newState));
        return newState;
      }

    case "REMOVE_FROM_FAV":
      const newState = state.filter((item) => item._id !== action.payload);
      localStorage.setItem("fav", JSON.stringify(newState));
      return newState;

    default:
      return state;
  }
};
