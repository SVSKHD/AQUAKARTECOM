// reducers/notificationReducer.js

// Action Types

// Initial State
const initialState = {
  show: false,
  messageType: '',
  description: '',
};

// Reducer
const toastReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SHOW_NOTIFICATION":
      return {
        ...state,
        show: true,
        messageType: action.payload.messageType,
        description: action.payload.description,
      };
    case "HIDE_NOTIFICATION":
      return initialState;
    default:
      return state;
  }
};


export default toastReducer;
