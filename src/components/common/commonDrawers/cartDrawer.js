import { useSelector } from "react-redux";
import AquaReuseDrawer from "../../reusables/drawer";
import useDrawer from "@/utils/drawer";
import useCurrency from "@/utils/currency";
import useCart from "@/utils/cart";
import Image from "next/image";
import { useState } from "react";
import useProduct from "@/utils/product";

const AquaCartDrawer = () => {
  const { cartDrawer, cartData } = useSelector((state) => ({ ...state }));
  const { closeCartDrawer } = useDrawer();
  const { formatCurrencyINR } = useCurrency;
  const { getTotalPrice, changeItemQuantity } = useCart();
  const { EmptyCart, removeFromCart } = useProduct();
  const [cart, setCart] = useState(false);

  const handleQuantityChange = (event, id) => {
    const quantity = parseInt(event.target.value, 10);
    changeItemQuantity(id, quantity);
  };

  return (
    <AquaReuseDrawer
      open={cartDrawer}
      close={() => closeCartDrawer()}
      title="Cart"
    >
      {cartData.length > 0 ? (
        cartData.map((product, productIdx) => (
          <>
            <li key={product.id} className="flex py-6 sm:py-10">
              <div className="flex-shrink-0">
                <Image
                  src={product.photos[0].secure_url}
                  alt={product.imageAlt}
                  height={100}
                  width={100}
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
                <div>
                  <hr />
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Quantity
                  </label>
                  <select
                    id={`quantity-${productIdx}`}
                    name={`quantity-${productIdx}`}
                    value={product.quantity}
                    onChange={(e) => handleQuantityChange(e, product._id)}
                    className="mt-2 block w-full max-w-full rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-10 text-left text-base font-medium leading-5 text-gray-600 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                </div>
              </div>
            </li>
            <button
              type="button"
              className="mb-5 w-full rounded-md bg-red-400 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              onClick={() => removeFromCart(product._id)}
            >
              Remove From Cart
            </button>
          </>
        ))
      ) : (
        <>
          <div className="min-w-0 flex-1 text-center">
            <h2 className="text-xl font-bold leading-7 text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight">
              No Products In Cart Yet...
            </h2>
          </div>
        </>
      )}

      {cartData.length > 0 ? (
        <>
          <button
            type="button"
            className="mt-5 mb-5 w-full rounded-md bg-red-500 px-2.5 py-1.5 text-lg font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            onClick={() => EmptyCart()}
          >
            Empty Cart
          </button>
          <div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                Total :{" "}
                <span className="text-green-900">
                  {formatCurrencyINR(getTotalPrice(cartData))}
                </span>
              </h2>
            </div>
          </div>
          <div className="mt-6">
            <a
              href="/checkout"
              className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50"
            >
              Go To Cart
            </a>
          </div>
        </>
      ) : (
        ""
      )}
    </AquaReuseDrawer>
  );
};
export default AquaCartDrawer;
