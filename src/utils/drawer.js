import { useDispatch } from "react-redux";

const useCartDrawer = () => {
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

  return { openCartDrawer, closeCartDrawer };
};

export default useCartDrawer;
