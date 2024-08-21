import AquaDashboardComponent from "@/components/Layout/userDasboard/dahsboard";
import useCurrency from "@/utils/currency";
import { useSelector } from "react-redux";
import Image from "next/image";
import useCart from "@/utils/cart";
import useProduct from "@/utils/product";

const AquaCartComponent = () => {
  const { cartData } = useSelector((state) => ({ ...state }));
  const { changeItemQuantity } = useCart();
  const { removeFromCart } = useProduct();
  const { formatCurrencyINR } = useCurrency;

  const handleQuantityChange = (event, id) => {
    const quantity = parseInt(event.target.value, 10);
    changeItemQuantity(id, quantity);
  };
  return (
    <>
      <AquaDashboardComponent title={"Cart"}>
        {cartData.length > 0 ? (
          cartData.map((product, productIdx) => (
            <li key={product._id} className="flex py-6 sm:py-10">
              <div className="flex-shrink-0">
                <img
                  src={product?.photos[0]?.secure_url}
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
          ))
        ) : (
          <>
            <div className="min-w-0 flex-1 text-center">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                No Products In Cart Yet...
              </h2>
            </div>
          </>
        )}
      </AquaDashboardComponent>
    </>
  );
};
export default AquaCartComponent;
