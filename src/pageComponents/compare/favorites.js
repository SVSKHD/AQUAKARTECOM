import useCurrency from "@/utils/currency";
import { useSelector, useDispatch } from "react-redux";
import React from "react";
import { Heart } from "lucide-react";

const AquaFavoritesTabContent = () => {
  const dispatch = useDispatch();
  const { favData, compare } = useSelector((state) => ({ ...state }));
  const { formatCurrencyINRWithK } = useCurrency;

  const AddToCompare = (product) => {
    console.log("compare", product, compare);
    if (!compare?.find((item) => item._id === product._id)) {
      dispatch({
        type: "ADD_TO_COMPARE",
        payload: product,
      });
      console.log("Added to Compare:", product);
    } else {
      console.log("Product already in Compare list:", product);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {favData && favData.length > 0 ? (
        <>
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Your Wishlist
            </h1>
            <p className="text-slate-600">
              {favData.length} {favData.length === 1 ? "item" : "items"} saved
              for later
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {favData.map((r) => {
              const isInCompare = compare?.some((item) => item._id === r._id);

              return (
                <div
                  key={r._id}
                  className="group relative flex flex-col rounded-[2rem] border border-white/60 bg-white/60 backdrop-blur-2xl shadow-xl transition-all duration-500 hover:scale-[1.02] hover:bg-white/80 overflow-hidden"
                >
                  <div className="relative aspect-square m-4 rounded-[1.5rem] overflow-hidden bg-white">
                    <img
                      alt={r.title}
                      src={r?.photos[0].secure_url}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-900 shadow-sm">
                      {formatCurrencyINRWithK(r.price)}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5 pt-2">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">
                      {r.title}
                    </h3>
                    <div className="mt-auto pt-4">
                      <button
                        onClick={() => AddToCompare(r)}
                        disabled={isInCompare}
                        className={`w-full relative flex items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 shadow-lg ${
                          isInCompare
                            ? "bg-emerald-100 text-emerald-800 cursor-not-allowed shadow-none"
                            : "bg-white text-indigo-900 hover:bg-indigo-50 border border-indigo-100 active:scale-95"
                        }`}
                      >
                        {isInCompare
                          ? "Added for Comparison"
                          : "Add to Compare"}
                      </button>
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
            <Heart className="w-12 h-12 text-pink-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            No Favorites Yet
          </h3>
          <p className="text-slate-500 text-center max-w-md font-light">
            Heart items provided to save them here for quick access and
            comparison.
          </p>
        </div>
      )}
    </div>
  );
};

export default AquaFavoritesTabContent;
