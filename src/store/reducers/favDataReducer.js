// Empty on the server and on the first client render alike: the saved list
// comes back through redux-persist after mount (see _app.js). Reading
// localStorage here made the header badge render on the client only and
// broke hydration.
const initialState = [];

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
