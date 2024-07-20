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

  return {
    AddAndRemoveCart,
    AddAndRemoveFav,
    UpdateCart,
    AddToFav,
    RemoveFromFav,
  };
};

export default useProduct;
