import useCurrency from "@/utils/currency";
import React from "react";

const AquaFavoriteCompareCard = ({ product, onCompare }) => {
  const { title, price, photos, productLink } = product;
  
  // Correctly invoke the useCurrency hook
  const { formatCurrencyINR } = useCurrency

  return (
    <div className="group relative">
      <div className="aspect-h-3 aspect-w-4 overflow-hidden rounded-lg bg-gray-100">
        <img
          src={photos[0].secure_url}
          alt={title}
          className="object-cover object-center"
        />
        <div
          className="flex items-end p-4 opacity-0 group-hover:opacity-100"
          aria-hidden="true"
        >
          <button
            onClick={onCompare ? onCompare : () => {}}
            className="w-full rounded-md bg-white bg-opacity-75 px-4 py-2 text-center text-sm font-medium text-gray-900 backdrop-blur backdrop-filter"
          >
            Add to Compare
          </button>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between space-x-8 text-base font-medium text-gray-900">
        <h3>
          <a href={productLink}>
            <span aria-hidden="true" className="absolute inset-0"></span>
            {title}
          </a>
        </h3>
        <p>{formatCurrencyINR(price)}</p>
      </div>
    </div>
  );
};

export default AquaFavoriteCompareCard;
