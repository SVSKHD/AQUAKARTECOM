import { useCallback } from "react";
import { useDispatch } from "react-redux";

const useDrawer = () => {
  const dispatch = useDispatch();

  const openCartDrawer = useCallback(() => {
    dispatch({ type: "SET_CART_DRAWER_VISIBLE", payload: true });
  }, [dispatch]);

  const closeCartDrawer = useCallback(() => {
    dispatch({ type: "SET_CART_DRAWER_VISIBLE", payload: false });
  }, [dispatch]);

  const openFavDrawer = useCallback(() => {
    dispatch({ type: "SET_FAV_DRAWER_VISIBLE", payload: true });
  }, [dispatch]);

  const closeFavDrawer = useCallback(() => {
    dispatch({ type: "SET_FAV_DRAWER_VISIBLE", payload: false });
  }, [dispatch]);

  return { openCartDrawer, closeCartDrawer, openFavDrawer, closeFavDrawer };
};

export default useDrawer;
