import useCurrency from "@/utils/currency";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { X, ShoppingCart, Heart, GitCompare } from "lucide-react";
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
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      {compare && compare.length > 0 ? (
        <>
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Compare Products
            </h1>
            <p className="text-slate-600">
              Analyzing {compare.length}{" "}
              {compare.length === 1 ? "product" : "products"} side by side
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {compare.map((product) => {
              const isInCart = cartData?.some(
                (item) => item._id === product._id,
              );
              const isInFav = favData?.some((item) => item._id === product._id);

              return (
                <div
                  key={product._id}
                  className="group relative flex flex-col rounded-[2rem] border border-white/60 bg-white/60 backdrop-blur-2xl shadow-xl transition-all duration-500 hover:scale-[1.02] hover:bg-white/80 overflow-hidden"
                >
                  <button
                    onClick={() => removeFromCompare(product._id)}
                    className="absolute top-4 right-4 z-20 p-2 bg-white/50 backdrop-blur-md rounded-full shadow-sm hover:bg-red-50 hover:text-red-600 transition-all duration-200 border border-white/40"
                    aria-label="Remove from compare"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="relative aspect-square m-4 rounded-[1.5rem] overflow-hidden bg-white">
                    <img
                      alt={product.title}
                      src={product?.photos[0]?.secure_url}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-900 shadow-sm">
                      Compare Item
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5 pt-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 leading-tight">
                        {product.title}
                      </h3>

                      <div
                        className="text-sm text-slate-500 line-clamp-3 mb-4 prose prose-indigo"
                        dangerouslySetInnerHTML={{
                          __html: product.description,
                        }}
                      />
                    </div>

                    <div className="border-t border-slate-200/60 pt-4 mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                          Price
                        </span>
                        <span className="text-xl font-bold text-slate-900">
                          {formatCurrencyINR(product.price)}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => addToCart(product)}
                          disabled={isInCart}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg ${
                            isInCart
                              ? "bg-emerald-100 text-emerald-800 cursor-not-allowed shadow-none"
                              : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-indigo-500/30 hover:scale-105 active:scale-95"
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {isInCart ? "In Cart" : "Add to Cart"}
                          </span>
                        </button>

                        <button
                          onClick={() => addToFavorites(product)}
                          disabled={isInFav}
                          className={`p-3 rounded-xl transition-all duration-300 border shadow-md ${
                            isInFav
                              ? "bg-red-50 border-red-100 text-red-500"
                              : "bg-white border-white/60 text-slate-400 hover:text-red-500 hover:bg-white active:scale-95"
                          }`}
                          aria-label="Add to favorites"
                        >
                          <Heart
                            className={`w-5 h-5 ${isInFav ? "fill-current" : ""}`}
                          />
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
          <div className="w-32 h-32 rounded-full flex items-center justify-center mb-6 bg-white/40 backdrop-blur-md border border-white/50 shadow-xl">
            <GitCompare
              className="w-12 h-12 text-indigo-300 animate-pulse"
              strokeWidth={1.5}
            />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            No Products to Compare
          </h3>
          <p className="text-slate-500 text-center max-w-md font-light">
            Add products from your favorites or cart to compare their features
            and prices side by side.
          </p>
        </div>
      )}
    </div>
  );
};

export default AquaCompareTabContent;
