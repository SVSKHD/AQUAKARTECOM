import { useState, useEffect } from "react";
import React from "react";
import useCurrency from "@/utils/currency";
import useProduct from "@/utils/product";
import { FaHeart, FaHeartBroken } from "react-icons/fa";
import { FaCartArrowDown, FaCartShopping } from "react-icons/fa6";
import { useSelector } from "react-redux";
import Image from "next/image";

const AquaProductCard = ({ product }) => {
  const [loading, setLoading] = useState(false);
  const [cart, setAddCart] = useState(false);
  const [fav, setAddFav] = useState(false);
  const { title, photos, price, color } = product;
  const { formatCurrencyINRWithK } = useCurrency;
  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();
  const { cartData, favData } = useSelector((state) => ({ ...state }));

  useEffect(() => {
    const isProductInCart = cartData.some((item) => item._id === product?._id);
    const isProductInFav = favData.some((item) => item._id === product?._id);
    setAddCart(isProductInCart);
    setAddFav(isProductInFav);
  }, [cartData, product?._id, favData]);

  return (
    <div className="relative mb-5">
      <div className="relative h-72 w-full overflow-hidden rounded-lg">
        <img
          src={photos[0].secure_url}
          alt={title}
          className="h-full w-full object-cover object-center"
        />
      </div>
      <div className="relative mt-4">
        <h3 className="text-lg font-medium text-gray-900">
          <a href={`/product/${title}`}>{title}</a>
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
      <div className="mt-6">
        <span className="isolate inline-flex rounded-md shadow-sm">
          <button
            type="button"
            className={`relative inline-flex items-center rounded-l-md ${cart ? "bg-green-500" : "bg-white"}  px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:z-10`}
            onClick={() => AddAndRemoveCart(product, setAddCart)}
          >
            {cart ? (
              <>
                <span>Added To Cart</span>
                <FaCartArrowDown size={25} />
              </>
            ) : (
              <>
                <span>Add To Cart</span>
                <FaCartShopping size={25} />
              </>
            )}
          </button>
          <button
            type="button"
            className="relative -ml-px inline-flex items-center bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:z-10"
            onClick={() => AddAndRemoveFav(product, setAddFav)}
          >
            {fav ? (
              <>
                <span>Added to WishList</span>
                <FaHeart className="text-red-700" size={25} />
              </>
            ) : (
              <>
                <span>Add to WishList</span>
                <FaHeartBroken className="text-red-700" size={25} />
              </>
            )}
          </button>
        </span>
      </div>
    </div>
  );
};

export default AquaProductCard;
