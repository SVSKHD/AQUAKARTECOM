import AquaDashboardComponent from "@/components/Layout/userDasboard/dahsboard";
import useCurrency from "@/utils/currency";
import { useSelector } from "react-redux";
import useCart from "@/utils/cart";
import useProduct from "@/utils/product";

const AquaCartComponent = () => {
  const { cartData } = useSelector((state) => ({ ...state }));
  const { changeItemQuantity, getTotalPrice } = useCart();
  const { removeFromCart } = useProduct();
  const { formatCurrencyINR } = useCurrency;

  const handleQuantityChange = (event, id) => {
    const quantity = parseInt(event.target.value, 10);
    changeItemQuantity(id, quantity);
  };
  return (
    <>
      <AquaDashboardComponent title={"Cart"}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {cartData.length > 0 ? (
            cartData.map((product, productIdx) => (
              <li
                key={product._id}
                className="flex flex-col py-6 sm:py-10 bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="flex-shrink-0">
                  <img
                    src={product?.photos[0]?.secure_url}
                    alt={product.imageAlt}
                    className="h-48 w-full object-cover object-center"
                  />
                </div>

                <div className="flex-1 p-4">
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

                <div className="p-4">
                  <hr />
                  <label
                    htmlFor={`quantity-${productIdx}`}
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Quantity
                  </label>
                  <select
                    id={`quantity-${productIdx}`}
                    name={`quantity-${productIdx}`}
                    value={product.quantity}
                    onChange={(e) => handleQuantityChange(e, product._id)}
                    className="mt-2 block w-full rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-10 text-left text-base font-medium leading-5 text-gray-600 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  >
                    {[1, 2, 3, 4, 5].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mr-5 ml-5">
                  <button
                    type="button"
                    className="w-full rounded-md bg-red-400 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                    onClick={() => removeFromCart(product._id)}
                  >
                    Remove From Cart
                  </button>
                </div>
              </li>
            ))
          ) : (
            <div className="min-w-0 flex-1 text-center col-span-full">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                No Products In Cart Yet...
              </h2>
            </div>
          )}
        </div>
        {cartData.length > 0 && (
          <div className="mt-10">
            <h2 className="text-gray-900 font-semibold text-3xl">
              Cart Total :{" "}
              <span className=" text-green-700 font-bold">
                {formatCurrencyINR(getTotalPrice())}
              </span>
            </h2>
          </div>
        )}
      </AquaDashboardComponent>
    </>
  );
};
export default AquaCartComponent;
