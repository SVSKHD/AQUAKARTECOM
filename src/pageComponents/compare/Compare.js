import useCurrency from "@/utils/currency";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { X, ShoppingCart, Heart } from "lucide-react";
import AquaToast from "@/components/reusables/react-toastify";

const AquaCompareTabContent = () => {
  const { compare, cartData, favData } = useSelector((state) => ({ ...state }));
  const { formatCurrencyINR } = useCurrency;
  const dispatch = useDispatch();

  const removeFromCompare = (productId) => {
    dispatch({
      type: "REMOVE_FROM_COMPARE",
      payload: productId,
    });
    AquaToast({ message: "Removed from compare", type: "success" });
  };

  const addToCart = (product) => {
    const isInCart = cartData?.some((item) => item._id === product._id);
    if (!isInCart) {
      dispatch({
        type: "ADD_TO_CART",
        payload: product,
      });
      AquaToast({ message: "Added to cart", type: "success" });
    }
  };

  const addToFavorites = (product) => {
    const isInFav = favData?.some((item) => item._id === product._id);
    if (!isInFav) {
      dispatch({
        type: "ADD_TO_FAV",
        payload: product,
      });
      AquaToast({ message: "Added to favorites", type: "success" });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {compare && compare.length > 0 ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Compare Products
            </h1>
            <p className="text-gray-600">
              Compare {compare.length} {compare.length === 1 ? "product" : "products"} side by side
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {compare.map((product) => {
              const isInCart = cartData?.some((item) => item._id === product._id);
              const isInFav = favData?.some((item) => item._id === product._id);

              return (
                <div
                  key={product._id}
                  className="group relative flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <button
                    onClick={() => removeFromCompare(product._id)}
                    className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-md hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                    aria-label="Remove from compare"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    <img
                      alt={product.title}
                      src={product?.photos[0]?.secure_url}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        Compare
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.title}
                      </h3>

                      <div
                        className="text-sm text-gray-600 line-clamp-3 mb-4"
                        dangerouslySetInnerHTML={{
                          __html: product.description,
                        }}
                      />
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          Price
                        </span>
                        <span className="text-xl font-bold text-gray-900">
                          {formatCurrencyINR(product.price)}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => addToCart(product)}
                          disabled={isInCart}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                            isInCart
                              ? "bg-green-100 text-green-700 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {isInCart ? "In Cart" : "Add"}
                          </span>
                        </button>

                        <button
                          onClick={() => addToFavorites(product)}
                          disabled={isInFav}
                          className={`p-2.5 rounded-xl transition-all duration-200 ${
                            isInFav
                              ? "bg-red-100 text-red-600"
                              : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 active:scale-95"
                          }`}
                          aria-label="Add to favorites"
                        >
                          <Heart className={`w-4 h-4 ${isInFav ? "fill-current" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            No Products to Compare
          </h3>
          <p className="text-gray-600 text-center max-w-md">
            Add products from your favorites or cart to compare their features and prices side by side
          </p>
        </div>
      )}
    </div>
  );
};

export default AquaCompareTabContent;
