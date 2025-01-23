const initialState = {
  toasts: [], // Array to hold multiple toasts
};

// Reducer
export const toastReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SHOW_NOTIFICATION":
      return {
        ...state,
        toasts: [
          ...(Array.isArray(state.toasts) ? state.toasts : []), // No need for optional chaining here
          {
            id: Date.now(), // Unique ID for each toast
            messageType: action.payload.messageType,
            message: action.payload.message,
          },
        ],
      };
    case "HIDE_NOTIFICATION":
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.payload),
      };
    default:
      return state;
  }
};

// Actions
export const showToast = (message, messageType) => ({
  type: "SHOW_NOTIFICATION",
  payload: { message, messageType },
});

export const hideToast = (id) => ({
  type: "HIDE_NOTIFICATION",
  payload: id, // Pass the toast ID to hide
});
