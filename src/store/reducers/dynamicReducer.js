// Initial State
const initialState = {
  categories: [],
  subcategories: [],
};

// Dynamic Reducer
export const dynamicDataReducer = (state = initialState, action) => {
  const matches = action.type.match(/^SET_(.+)/);

  if (!matches) return state;

  const key = matches[1].toLowerCase(); // E.g., 'CATEGORIES' → 'categories'

  if (!state.hasOwnProperty(key)) return state;

  return {
    ...state,
    [key]: action.payload,
  };
};
