import { useDispatch } from "react-redux";

const useDrawer = () => {
  const dispatch = useDispatch();

  const openCartDrawer = () => {
    dispatch({
      type: "SET_CART_DRAWER_VISIBLE",
      payload: true,
    });
  };

  const closeCartDrawer = () => {
    dispatch({
      type: "SET_CART_DRAWER_VISIBLE",
      payload: false,
    });
  };

  const openFavDrawer = () => {
    dispatch({
      type: "SET_FAV_DRAWER_VISIBLE",
      payload: true,
    });
  };

  const closeFavDrawer = () => {
    dispatch({
      type: "SET_FAV_DRAWER_VISIBLE",
      payload: false,
    });
  };

  return { openCartDrawer, closeCartDrawer, openFavDrawer, closeFavDrawer };
};

export default useDrawer;
