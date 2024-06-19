// src/app/store/reducers/authReducer.ts

// Define action types
export const SET_AUTH_STATUS_VISIBLE = "SET_AUTH_STATUS_VISIBLE";

// Define the type for the state
type AuthStatusState = boolean;

// Define the interface for the action
interface SetAuthStatusVisibleAction {
  type: typeof SET_AUTH_STATUS_VISIBLE;
  payload: boolean;
}

// Union type for all possible actions
type AuthStatusActionTypes = SetAuthStatusVisibleAction;

// Define the initial state
const initialState: AuthStatusState = false;

// Create the reducer
export const authStatusReducer = (
  state: AuthStatusState = initialState,
  action: AuthStatusActionTypes,
): AuthStatusState => {
  switch (action.type) {
    case SET_AUTH_STATUS_VISIBLE:
      return action.payload;
    default:
      return state;
  }
};

// Action creator
export const setAuthStatusVisible = (
  status: boolean,
): SetAuthStatusVisibleAction => ({
  type: SET_AUTH_STATUS_VISIBLE,
  payload: status,
});
