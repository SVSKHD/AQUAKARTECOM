import useCurrency from "@/utils/currency";
import React from "react";
import { useSelector } from "react-redux";

const AquaCompareTabContent = () => {
  const { compare } = useSelector((state) => ({ ...state }));
  const { formatCurrencyINR } = useCurrency;
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
      {compare && compare.length > 0 ? (
        <>
          <h1 className="text-2xl text-black mb-4">Compare List</h1>
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {compare.map((r, i) => (
              <div
                key={i}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
              >
                <div className="aspect-h-4 aspect-w-3 bg-gray-200 sm:aspect-none group-hover:opacity-75 sm:h-96">
                  <img
                    alt={r.title}
                    src={r?.photos[0].secure_url}
                    className="h-full w-full object-cover object-center sm:h-full sm:w-full"
                  />
                </div>
                <div className="flex flex-1 flex-col space-y-2 p-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    <a href={r.href}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {r.title}
                    </a>
                  </h3>
                  <div className="flex flex-1 flex-col justify-end">
                    <p className="text-base font-medium text-gray-900">
                      {formatCurrencyINR(r.price)}
                    </p>
                  </div>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: r.description,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <h4 className="text-3xl text-center text-black">
          Add Something to Compare
        </h4>
      )}
    </div>
  );
};

export default AquaCompareTabContent;
