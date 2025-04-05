import { useDispatch, useSelector } from "react-redux";

// Function to calculate the total price
const cartTotal = (cart) => {
  return cart?.reduce((total, item) => total + item.quantity * (item?.discountPriceStatus ? item.discountPrice : item.price), 0);
};

// Custom hook to manage cart state
const useCart = () => {
  const dispatch = useDispatch();
  const { cartData } = useSelector((state) => ({ ...state })); // Select cart state from Redux

  // Function to add item to cart
  const addItemToCart = (item) => {
    const isProductInCart = cart.some((cartItem) => cartItem._id === item._id);

    if (!isProductInCart) {
      dispatch({
        type: "ADD_TO_CART",
        payload: { ...item, quantity: 1 },
      });
      dispatch({
        type: "SHOW_NOTIFICATION",
        payload: {
          message: "Successfully Added to Cart",
          messageType: "success",
        },
      });
    } else {
      // If the product is already in the cart, update its quantity
      increaseItemQuantity(item);
    }
  };

  // Function to remove item from cart
  const removeItemFromCart = (itemId) => {
    dispatch({
      type: "REMOVE_FROM_CART",
      payload: itemId,
    });
    dispatch({
      type: "SHOW_NOTIFICATION",
      payload: {
        message: "Successfully removed from cart",
        messageType: "info",
      },
    });
  };

  // Function to change item quantity in cart
  const changeItemQuantity = (itemId, quantity) => {
    if (quantity > 5) {
      dispatch({
        type: "SHOW_NOTIFICATION",
        payload: {
          message: "You can only add up to 5",
          messageType: "info",
        },
      });
    } else {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { productId: itemId, quantity },
      });
    }
  };
  // Function to increase item quantity
  const increaseItemQuantity = (product) => {
    const productInCart = cart.find((item) => item._id === product._id);
    if (productInCart) {
      const newQuantity = Math.min(productInCart.quantity + 1, 5);
      if (newQuantity === 5) {
        dispatch({
          type: "SHOW_NOTIFICATION",
          payload: {
            message: "You can only add up to 5",
            messageType: "info",
          },
        });
      }
      changeItemQuantity(product._id, newQuantity);
    } else {
      addItemToCart(product);
    }
  };

  // Function to decrease item quantity
  const decreaseItemQuantity = (product) => {
    const productInCart = cart.find((item) => item._id === product._id);
    if (productInCart) {
      const newQuantity = Math.max(productInCart.quantity - 1, 1);
      if (newQuantity === 1) {
        dispatch({
          type: "SHOW_NOTIFICATION",
          payload: {
            message: "Cannot reduce quantity below 1",
            messageType: "info",
          },
        });
      }
      changeItemQuantity(product._id, newQuantity);
    } else {
      dispatch({
        type: "SHOW_NOTIFICATION",
        payload: {
          message: "Product is not in the cart",
          messageType: "info",
        },
      });
    }
  };

  // Function to get the total price of items in the cart
  const getTotalPrice = () => {
    return cartTotal(cartData);
  };

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
