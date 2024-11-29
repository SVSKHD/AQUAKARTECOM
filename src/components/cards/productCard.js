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
    <div className="relative mb-5 p-3 transition-transform duration-300 transform md:hover:scale-105 md:hover:shadow-xl rounded-md">
      <div className="relative h-72 w-full overflow-hidden rounded-lg">
        <img
          src={photos[0]?.secure_url}
          alt={title}
          className="h-full w-full object-cover object-center md:group-hover:opacity-75 transition-opacity duration-300"
        />

        {/* Cart button - top left */}
        <button
          onClick={() => AddAndRemoveCart(product, setAddCart)}
          className={`absolute top-2 left-2 z-10 p-1.5 rounded-lg border-none focus:outline-none transition-all duration-300 ${
            cart ? "bg-white" : "bg-gray-600"
          } md:hover:p-3 md:hover:rounded-full`}
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
          } md:hover:p-3 md:hover:rounded-full`}
        >
          <FaHeart
            aria-hidden="true"
            size={20}
            className={fav ? "text-red-500" : "text-gray-300"}
          />
        </button>
      </div>

      <div className="relative mt-4 pr-3 pl-3 pb-3">
        <h3 className="text-lg font-medium text-gray-900">
          <a href={`/product/${slug}`}>{title}</a>
        </h3>
        <p className="mt-1 text-sm text-gray-500">{color}</p>
      </div>

      <div className="absolute inset-x-0 top-0 flex h-72 items-end justify-end overflow-hidden rounded-lg p-4">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black opacity-50"
        />
        <p className="bg-gray-800 rounded-md p-1 relative text-lg font-semibold text-white">
          {formatCurrencyINRWithK(price)}
        </p>
      </div>
    </div>
  );
};

export default AquaProductCard;
