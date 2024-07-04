import { useSelector } from "react-redux";
import AquaReuseDrawer from "../../reusables/drawer";
import useDrawer from "@/utils/drawer";
import {
  CheckIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import useCurrency from "@/utils/currency";

const AquaCartDrawer = () => {
  const { cartDrawer, cartData } = useSelector((state) => ({ ...state }));
  const { closeCartDrawer } = useDrawer();
  const { formatCurrencyINR } = useCurrency;
  return (
    <AquaReuseDrawer
      open={cartDrawer}
      close={() => closeCartDrawer()}
      title="Cart"
    >
      {cartData.length > 0 ? (
        cartData.map((product, productIdx) => (
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
    </AquaReuseDrawer>
  );
};
export default AquaCartDrawer;
