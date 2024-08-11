import { useDispatch, useSelector } from "react-redux";
import AquaToast from "@/components/reusables/react-toastify";

const useProduct = () => {
  const dispatch = useDispatch();
  const { cartData, favData } = useSelector((state) => ({ ...state }));

  const AddAndRemoveCart = (productData, setCartAdd) => {
    const isProductInCart = cartData.some(
      (item) => item._id === productData?._id,
    );

    if (!isProductInCart) {
      dispatch({
        type: "ADD_TO_CART",
        payload: { ...productData, quantity: 1 },
      });

      AquaToast({
        message: "Successfully Added to Cart",
        type: "success",
      });
      setCartAdd(true);
    } else {
      dispatch({
        type: "REMOVE_FROM_CART",
        payload: productData?._id,
      });

      AquaToast({
        message: "Successfully removed from cart",
        type: "info",
      });

      setCartAdd(false);
    }
  };

  const AddAndRemoveCartFromFavourites = (productData) => {
    const isProductInCart = cartData.some(
      (item) => item._id === productData?._id,
    );

    if (!isProductInCart) {
      dispatch({
        type: "ADD_TO_CART",
        payload: { ...productData, quantity: 1 },
      });

      AquaToast({
        message: "Successfully Added to Cart",
        type: "success",
      });
    } else {
      dispatch({
        type: "REMOVE_FROM_CART",
        payload: productData?._id,
      });

      AquaToast({
        message: "Successfully removed from cart",
        type: "info",
      });
    }
  };

  const AddAndRemoveFav = (productData, setAddFav) => {
    const isProductInFav = favData.some(
      (item) => item._id === productData?._id,
    );

    if (!isProductInFav) {
      dispatch({
        type: "ADD_TO_FAV",
        payload: productData,
      });
      AquaToast({
        message: "Successfully added from Favourites",
        type: "success",
      });
      setAddFav(true);
    } else {
      dispatch({
        type: "REMOVE_FROM_FAV",
        payload: productData?._id,
      });
      AquaToast({
        message: "Successfully removed from Favourites",
        type: "info",
      });
      setAddFav(false);
    }
  };

  const UpdateCart = () => {};
  const AddToFav = () => {};

  const RemoveFromFav = () => {};
  const EmptyCart = () => {
    dispatch({
      type: "EMPTY_CART",
    });
    AquaToast({
      message: "Cart emptied successfully",
      type: "info",
    });
  };
  const removeFromCart = (productId) => {
    // Check if productId is provided
    if (!productId) {
      AquaToast({
        message: "Product ID is required",
        type: "error",
      });
      return;
    }

    // Check if the product is in the cart
    const isProductInCart = cartData.some((item) => item._id === productId);

    if (isProductInCart) {
      // Dispatch action to remove the product from the cart
      dispatch({
        type: "REMOVE_FROM_CART",
        payload: productId,
      });

      // Show toast notification for successful removal
      AquaToast({
        message: "Successfully removed from cart",
        type: "info",
      });
    } else {
      // Show toast notification if the product was not found in the cart
      AquaToast({
        message: "Product not found in cart",
        type: "error",
      });
    }
  };
  return {
    AddAndRemoveCart,
    AddAndRemoveCartFromFavourites,
    AddAndRemoveFav,
    UpdateCart,
    AddToFav,
    RemoveFromFav,
    EmptyCart,
    removeFromCart,
  };
};

export default useProduct;
