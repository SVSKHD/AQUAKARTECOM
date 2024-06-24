import { useDispatch } from "react-redux";

const useDialog = () => {
  const dispatch = useDispatch();

  const openAuthDialog = () => {
    dispatch({
      type: "SET_AUTH_DIALOG_VISIBLE",
      payload: true,
    });
  };

  const closeAuthDialog = () => {
    dispatch({
      type: "SET_AUTH_DIALOG_VISIBLE",
      payload: false,
    });
  };

  return { openAuthDialog, closeAuthDialog };
};

export default useDialog;
