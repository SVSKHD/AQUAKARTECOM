import AquaDashboardComponent from "@/components/Layout/userDasboard/dahsboard";
import useCurrency from "@/utils/currency";
import useProduct from "@/utils/product";
import { useSelector } from "react-redux";

const AquaFavComponent = () => {
  const { favData, cartData } = useSelector((state) => ({ ...state }));
  const { AddAndRemoveCartFromFavourites } = useProduct();
  const isProductInCart = (productId) => {
    return cartData.some((item) => item._id === productId);
  };
  const handleAddToCart = (product) => {
    AddAndRemoveCartFromFavourites(product);
  };
  const { formatCurrencyINR } = useCurrency;
  return (
    <>
      <AquaDashboardComponent title={"Favourites"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favData.length > 0 ? (
            favData.map((product) => (
              <li
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="flex-shrink-0">
                  <img
                    src={product.photos[0].secure_url}
                    alt={product.imageAlt}
                    className="h-48 w-full object-cover object-center"
                  />
                </div>

                <div className="p-4 flex flex-1 flex-col justify-between">
                  <div className="relative">
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
                      {product.size && (
                        <p className="ml-4 border-l border-gray-200 pl-4 text-gray-500">
                          {product.size}
                        </p>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-green-700">
                      {formatCurrencyINR(product.price)}
                    </p>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className={`rounded-md px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 
      ${
        isProductInCart(product._id)
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600"
      }
    `}
                      onClick={() => handleAddToCart(product)}
                      disabled={isProductInCart(product._id)}
                    >
                      {isProductInCart(product._id)
                        ? "Already in Cart"
                        : "Add To Cart"}
                    </button>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <div className="min-w-0 flex-1 text-center col-span-full">
              <h2 className="text-xl font-bold leading-7 text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight">
                No Products In Favorites Yet...
              </h2>
            </div>
          )}
        </div>
      </AquaDashboardComponent>
    </>
  );
};
export default AquaFavComponent;
