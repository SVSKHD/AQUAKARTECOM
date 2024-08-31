import useCurrency from "@/utils/currency";
import useProduct from "@/utils/product";
import { useState, useEffect } from "react";
import { FaShoppingCart, FaHeart } from "react-icons/fa";
import { useSelector } from "react-redux";

const ReusableProductCard = ({ product }) => {
  const [fav, setAddFav] = useState(false);
  const [cart, setAddCart] = useState(false);
  const { formatCurrencyINR } = useCurrency;
  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();
  const { cartData, favData } = useSelector((state) => ({ ...state }));
  const { title, photos, price, color, slug } = product;

  useEffect(() => {
    const isProductInCart = cartData.some((item) => item._id === product?._id);
    const isProductInFav = favData.some((item) => item._id === product?._id);
    setAddCart(isProductInCart);
    setAddFav(isProductInFav);
  }, [cartData, product?._id, favData]);

  return (
    <div className="bg-white relative mb-5 shadow-lg hover:shadow-2xl transition-shadow duration-300 rounded-lg p-4">
      <div className="relative h-72 w-full overflow-hidden rounded-lg">
        <img
          src={photos[0].secure_url}
          alt={title}
          className="h-full w-full object-cover object-center group-hover:opacity-75"
        />

        {/* Cart button - top left */}
        <button
          onClick={() => AddAndRemoveCart(product, setAddCart)}
          className={`absolute top-2 left-2 z-10 p-3 rounded-full border-none focus:outline-none transition-colors duration-300 ${cart ? "bg-white" : "bg-gray-600"}`}
        >
          <FaShoppingCart
            aria-hidden="true"
            size={25}
            className={cart ? "text-green-700" : "text-gray-300"}
          />
        </button>

        {/* Favorite button - top right */}
        <button
          onClick={() => AddAndRemoveFav(product, setAddFav)}
          className={`absolute top-2 right-2 z-10 p-3 rounded-full border-none focus:outline-none transition-colors duration-300 ${fav ? "bg-white" : "bg-gray-600"}`}
        >
          <FaHeart
            aria-hidden="true"
            size={25}
            className={fav ? "text-red-500" : "text-gray-300"}
          />
        </button>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-medium text-gray-900">
          <a href={`/product/${slug}`}>{title}</a>
        </h3>
        <p className="mt-1 text-base font-medium text-gray-900">
          {formatCurrencyINR(price)}
        </p>
      </div>
    </div>
  );
};

export default ReusableProductCard;
