export const authDialogReducer = (state = false, action) => {
  switch (action.type) {
    case "SET_AUTH_DIALOG_VISIBLE":
      return action.payload;
    default:
      return state;
  }
};
