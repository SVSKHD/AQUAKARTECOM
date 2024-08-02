import { useSelector } from "react-redux";
import AquaReuseDrawer from "../../reusables/drawer";
import useDrawer from "@/utils/drawer";
import useCurrency from "@/utils/currency";
import { useState } from "react";
import useProduct from "@/utils/product";

const AquafavDrawer = () => {
  const { openFavDrawer, closeFavDrawer } = useDrawer();
  const { favDrawer, favData } = useSelector((state) => ({ ...state }));
  const { formatCurrencyINR } = useCurrency;
  const [cart, setCart] = useState(false);
  const { AddAndRemoveCart } = useProduct();
  return (
    <AquaReuseDrawer
      open={favDrawer}
      close={() => closeFavDrawer()}
      title="Favourites"
    >
      {favData.length > 0 ? (
        favData.map((product, productIdx) => (
          <li key={product.id} className="flex py-6 sm:py-10">
            <div className="flex-shrink-0">
              <img
                src={product.photos[0].secure_url}
                alt={product.imageAlt}
                className="h-24 w-24 rounded-md object-cover object-center sm:h-48 sm:w-48"
              />
            </div>

            <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
              <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                <div>
                  <div className="flex justify-between">
                    <h3 className="text-sm">
                      <a
                        href={product.href}
                        className="font-medium text-gray-700 hover:text-gray-800"
                      >
                        {product.title}
                      </a>
                    </h3>
                  </div>
                  <div className="mt-1 flex text-sm">
                    <p className="text-gray-500">{product.color}</p>
                    {product.size ? (
                      <p className="ml-4 border-l border-gray-200 pl-4 text-gray-500">
                        {product.size}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-green-700 mt-1 text-sm font-medium text-gray-900">
                    {formatCurrencyINR(product.price)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                onClick={() => AddAndRemoveCart(product, setCart)}
              >
                {cart ? "Remove From Cart" : "Add To Cart"}
              </button>
            </div>
          </li>
        ))
      ) : (
        <>
          <div className="min-w-0 flex-1 text-center">
            <h2 className="text-xl font-bold leading-7 text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight">
              No Products In Favorites Yet...
            </h2>
          </div>
        </>
      )}
    </AquaReuseDrawer>
  );
};
export default AquafavDrawer;
