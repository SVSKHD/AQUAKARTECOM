// UI state for the AquaKart assistant widget. The conversation itself lives in
// the widget (and sessionStorage), not here.
// `context` is set by a page that hosts the assistant its own way (the receipt
// page opens it as a drawer with product questions and other products).
const initialState = {
  open: false,
  prefill: "",
  available: false,
  tab: "chat",
  context: null,
};

export const assistantReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_ASSISTANT_AVAILABLE":
      return { ...state, available: Boolean(action.payload) };
    case "OPEN_ASSISTANT":
      return {
        ...state,
        open: true,
        prefill: action.payload?.prefill || "",
        tab: action.payload?.tab || "chat",
      };
    case "CLOSE_ASSISTANT":
      return { ...state, open: false, prefill: "" };
    case "CLEAR_ASSISTANT_PREFILL":
      return { ...state, prefill: "" };
    case "SET_ASSISTANT_CONTEXT":
      return { ...state, context: action.payload || null };
    default:
      return state;
  }
};
