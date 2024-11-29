import { useState, useEffect } from "react";
import React from "react";
import useCurrency from "@/utils/currency";
import useProduct from "@/utils/product";
import { FaShoppingCart, FaHeart } from "react-icons/fa";
import { useSelector } from "react-redux";

const AquaProductCard = ({ product }) => {
  const [cart, setAddCart] = useState(false);
  const [fav, setAddFav] = useState(false);
  const { title, photos, price, color, slug } = product;
  const { formatCurrencyINRWithK } = useCurrency;
  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();
  const { cartData, favData } = useSelector((state) => ({
    cartData: state.cartData,
    favData: state.favData,
  }));

  useEffect(() => {
    const isProductInCart = cartData.some((item) => item._id === product?._id);
    const isProductInFav = favData.some((item) => item._id === product?._id);
    setAddCart(isProductInCart);
    setAddFav(isProductInFav);
  }, [cartData, product?._id, favData]);

  return (
    <div className="relative mb-5 p-5 bg-white rounded-lg shadow-lg h-96 flex flex-col justify-between">
      {/* Image Section */}
      <div className="relative overflow-hidden rounded-lg bg-gray-100 flex-1">
        <img
          src={photos[0]?.secure_url}
          alt={title}
          className="h-full w-full object-cover rounded-lg"
        />

        {/* Cart button - top left */}
        <button
          onClick={() => AddAndRemoveCart(product, setAddCart)}
          className={`absolute top-2 left-2 z-10 p-1.5 rounded-lg border-none focus:outline-none transition-all duration-300 ${
            cart ? "bg-white" : "bg-gray-600"
          } hover:p-3 hover:rounded-full`}
        >
          <FaShoppingCart
            aria-hidden="true"
            size={20}
            className={cart ? "text-green-700" : "text-gray-300"}
          />
        </button>

        {/* Favorite button - top right */}
        <button
          onClick={() => AddAndRemoveFav(product, setAddFav)}
          className={`absolute top-2 right-2 z-10 p-1.5 rounded-lg border-none focus:outline-none transition-all duration-300 ${
            fav ? "bg-white" : "bg-gray-600"
          } hover:p-3 hover:rounded-full`}
        >
          <FaHeart
            aria-hidden="true"
            size={20}
            className={fav ? "text-red-500" : "text-gray-300"}
          />
        </button>
      </div>

      {/* Product Details */}
      <div className="mt-4 text-center">
        <h3 className="text-lg font-medium text-gray-900">
          <a href={`/product/${slug}`}>
            {title.length > 200 ? `${title.slice(0, 200)}...` : title}
          </a>
        </h3>
        <p className="mt-1 text-sm text-gray-500">{color}</p>
      </div>

      {/* Price Section */}
      <div className="mt-4 flex items-center justify-center">
        <p className="text-lg font-semibold text-gray-900">
          {formatCurrencyINRWithK(price)}
        </p>
      </div>
    </div>
  );
};

export default AquaProductCard;