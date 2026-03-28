import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

const cartTotal = (cart) => {
  return (
    cart?.reduce(
      (total, item) =>
        total +
        (item.quantity || 1) *
          (item?.discountPriceStatus ? item.discountPrice : item.price),
      0,
    ) || 0
  );
};

const useCart = () => {
  const dispatch = useDispatch();
  const cartData = useSelector((state) => state.cartData);

  const addItemToCart = useCallback(
    (item) => {
      const isProductInCart = cartData.some(
        (cartItem) => cartItem._id === item._id,
      );

      if (!isProductInCart) {
        dispatch({
          type: "ADD_TO_CART",
          payload: { ...item, quantity: 1 },
        });
      } else {
        const productInCart = cartData.find((ci) => ci._id === item._id);
        if (productInCart) {
          const newQuantity = Math.min((productInCart.quantity || 1) + 1, 5);
          dispatch({
            type: "UPDATE_QUANTITY",
            payload: { productId: item._id, quantity: newQuantity },
          });
        }
      }
    },
    [cartData, dispatch],
  );

  const removeItemFromCart = useCallback(
    (itemId) => {
      dispatch({ type: "REMOVE_FROM_CART", payload: itemId });
    },
    [dispatch],
  );

  const changeItemQuantity = useCallback(
    (itemId, quantity) => {
      const clamped = Math.min(Math.max(quantity, 1), 5);
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { productId: itemId, quantity: clamped },
      });
    },
    [dispatch],
  );

  const increaseItemQuantity = useCallback(
    (product) => {
      const productInCart = cartData.find((item) => item._id === product._id);
      if (productInCart) {
        const newQuantity = Math.min((productInCart.quantity || 1) + 1, 5);
        changeItemQuantity(product._id, newQuantity);
      } else {
        addItemToCart(product);
      }
    },
    [cartData, changeItemQuantity, addItemToCart],
  );

  const decreaseItemQuantity = useCallback(
    (product) => {
      const productInCart = cartData.find((item) => item._id === product._id);
      if (productInCart) {
        const newQuantity = Math.max((productInCart.quantity || 1) - 1, 1);
        changeItemQuantity(product._id, newQuantity);
      }
    },
    [cartData, changeItemQuantity],
  );

  const getTotalPrice = useCallback(() => cartTotal(cartData), [cartData]);

  return {
    addItemToCart,
    removeItemFromCart,
    increaseItemQuantity,
    decreaseItemQuantity,
    changeItemQuantity,
    getTotalPrice,
  };
};

export default useCart;
