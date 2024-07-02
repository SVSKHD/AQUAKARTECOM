// Initial State
const initialState = {
  show: false,
  messageType: '',
  message: '',
};

// Reducer
export const toastReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SHOW_NOTIFICATION":
      return {
        ...state,
        show: true,
        messageType: action.payload.messageType,
        message: action.payload.message,
      };
    case "HIDE_NOTIFICATION":
      return initialState;
    default:
      return state;
  }
};
