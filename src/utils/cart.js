import { useState } from 'react';

// Function to calculate the total price
const calculateTotal = (data) => {
  return data.reduce((acc, item) => acc + item.price, 0);
};

// Custom hook to manage cart state
const useCart = () => {
  const [cart, setCart] = useState([]);

  // Function to add item to cart
  const addItemToCart = (item) => {
    setCart([...cart, item]);
  };

  // Function to get the total price of items in the cart
  const getTotalPrice = () => {
    return calculateTotal(cart);
  };

  return {
    cart,
    addItemToCart,
    getTotalPrice,
  };
};

export default useCart;
