// UI state for the AquaKart assistant widget. The conversation itself lives in
// the widget (and sessionStorage), not here.
const initialState = { open: false, prefill: "", available: false };

export const assistantReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_ASSISTANT_AVAILABLE":
      return { ...state, available: Boolean(action.payload) };
    case "OPEN_ASSISTANT":
      return { ...state, open: true, prefill: action.payload?.prefill || "" };
    case "CLOSE_ASSISTANT":
      return { ...state, open: false, prefill: "" };
    case "CLEAR_ASSISTANT_PREFILL":
      return { ...state, prefill: "" };
    default:
      return state;
  }
};
