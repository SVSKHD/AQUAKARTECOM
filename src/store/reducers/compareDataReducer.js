const MAX_COMPARE_ITEMS = 4;

const persistCompare = (items) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("compare", JSON.stringify(items));
};

// Empty until redux-persist rehydrates after mount (see _app.js), so the first
// client render matches the server HTML.
const initialState = [];

export const compareDataReducer = (state = initialState, action) => {
  const currentState = Array.isArray(state) ? state : [];

  switch (action.type) {
    case "ADD_TO_COMPARE": {
      const exists = currentState.some(
        (item) => item?._id === action.payload?._id,
      );

      if (exists || currentState.length >= MAX_COMPARE_ITEMS) {
        return currentState;
      }

      const nextState = [...currentState, action.payload];
      persistCompare(nextState);
      return nextState;
    }

    case "REMOVE_FROM_COMPARE": {
      const nextState = currentState.filter(
        (item) => item?._id !== action.payload,
      );
      persistCompare(nextState);
      return nextState;
    }

    default:
      return currentState;
  }
};

export { MAX_COMPARE_ITEMS };
