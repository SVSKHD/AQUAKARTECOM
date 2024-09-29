import useCurrency from "@/utils/currency";
import { useSelector, useDispatch } from "react-redux";
import React from "react";

const AquaFavoritesTabContent = () => {
  const dispatch = useDispatch();
  const { favData, compare } = useSelector((state) => ({ ...state }));
  const { formatCurrencyINRWithK } = useCurrency;

  const AddToCompare = (product) => {
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
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
      <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4">
        {favData?.length <= 0 ? (
          <h4 className="text-2xl text-black">No Favorites Yet</h4>
        ) : (
          <>
            {favData.map((r, i) => {
              const isInCompare = compare?.some((item) => item._id === r._id); // Check if the product is in compare list

              return (
                <div key={r._id}>
                  <div className="relative">
                    <div className="relative h-72 w-full overflow-hidden rounded-lg">
                      <img
                        alt={r.imageAlt}
                        src={r?.photos[0].secure_url}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div className="relative mt-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        {r.title}
                      </h3>
                    </div>
                    <div className="absolute inset-x-0 top-0 flex h-72 items-end justify-end overflow-hidden rounded-lg p-4">
                      <div
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black opacity-50"
                      />
                      <p className="bg-gray-800 rounded-md p-1 relative text-lg font-semibold text-white">
                        {formatCurrencyINRWithK(r.price)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => AddToCompare(r)}
                      disabled={isInCompare} // Disable the button if the product is already in compare
                      className={`relative flex items-center justify-center rounded-md border border-transparent px-8 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 ${
                        isInCompare
                          ? "bg-green-300 cursor-not-allowed"
                          : "bg-gray-100"
                      }`}
                    >
                      {isInCompare ? "Already in Compare" : "Add to Compare"}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default AquaFavoritesTabContent;
