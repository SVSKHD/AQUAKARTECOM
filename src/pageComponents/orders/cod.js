import { useState, useEffect } from "react";
import AquaLayout from "@/components/Layout/Layout";
import orderServiceOperations from "@/services/order";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import AquaToast from "@/components/reusables/react-toastify";
import useCurrency from "@/utils/currency";
import Link from "next/link";
import moment from "moment";

const AquaCodOrderPageComponent = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const { userData } = useSelector((state) => ({ ...state }));
  const { formatCurrencyINR } = useCurrency;

  const fetchCodOrder = async (id) => {
    setLoading(true);
    try {
      console.log("Fetching order with ID:", id);
      const response = await orderServiceOperations.getOrdersByTransactionId(
        id,
        userData.token,
      );
      setOrder(response.data);
      setLoading(false);
    } catch (error) {
      AquaToast({
        message: "Oops! Something has gone wrong.",
        type: "error",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady || !userData.token) return;
    const { id } = router.query;
    if (id) {
      setLoading(true);
      fetchCodOrder(id);
    }
  }, [router.isReady, router.query.id, userData.token]);

  const getOrderStep = (orderStatus) => {
    switch (orderStatus) {
      case "Pending":
        return 0;
      case "Processing":
        return 1;
      case "Shipped":
        return 2;
      case "Delivered":
        return 3;
      case "Completed":
        return 4;
      case "Cancelled":
        return -1; // Optional: handle cancelled status separately if needed
      default:
        return 0;
    }
  };

  const AquaOrderTimeline = ({ order }) => {
    const currentStep = getOrderStep(order.orderStatus);

    return (
      <div className="border-t border-gray-200 px-4 py-6 sm:px-6 lg:p-8">
        <h4 className="sr-only">Status</h4>
        <p className="text-sm font-medium text-gray-900">
          {order.orderStatus} on{" "}
          <time dateTime={order.updatedAt}>
            {new Date(order.updatedAt).toLocaleDateString()}
          </time>
        </p>
        <div aria-hidden="true" className="mt-6">
          <div className="overflow-hidden rounded-full bg-gray-200">
            <div
              style={{
                width: `calc((${currentStep} * 2 + 1) / 8 * 100%)`,
              }}
              className="h-2 rounded-full bg-indigo-600"
            />
          </div>
          <div className="mt-6 hidden grid-cols-4 text-sm font-medium text-gray-600 sm:grid">
            <div
              className={classNames(
                "text-center",
                currentStep >= 0 && "text-indigo-600",
              )}
            >
              Order placed
            </div>
            <div
              className={classNames(
                "text-center",
                currentStep >= 1 && "text-indigo-600",
              )}
            >
              Processing
            </div>
            <div
              className={classNames(
                "text-center",
                currentStep >= 2 && "text-indigo-600",
              )}
            >
              Shipped
            </div>
            <div
              className={classNames(
                "text-right",
                currentStep >= 3 && "text-indigo-600",
              )}
            >
              Delivered
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Failed":
        return "red";
      case "Paid":
        return "green";
      case "Pending":
        return "yellow";
      default:
        return "gray";
    }
  };

  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }

  return (
    <AquaLayout>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-screen bg-white">
          {/* <AquaSpinner color="blue" size="lg" /> */}
          <p className="mt-4 text-sm text-gray-500 animate-pulse">
            Loading your order details...
          </p>
        </div>
      ) : order ? (
        <main className="mx-auto max-w-2xl pb-24 pt-8 sm:px-6 sm:pt-16 lg:max-w-7xl lg:px-8">
          <>
            <div className="space-y-2 px-4 sm:flex sm:items-baseline sm:justify-between sm:space-y-0 sm:px-0">
              <div className="flex sm:items-baseline sm:space-x-4">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Order #{order?.orderId} - Cash On Delivery
                </h1>
              </div>
              <p className="text-sm text-gray-600">
                Order placed{" "}
                <time
                  dateTime="2021-03-22"
                  className="font-medium text-gray-900"
                >
                  {moment(order?.createdAt).format("DD MMM YYYY")}
                </time>
              </p>
              <a
                href="#"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 sm:hidden"
              >
                View invoice
                <span aria-hidden="true"> &rarr;</span>
              </a>
            </div>

            {/* Products */}
            <section aria-labelledby="products-heading" className="mt-6">
              <h2 id="products-heading" className="sr-only">
                Products purchased
              </h2>

              <div className="space-y-8">
                {order?.items?.map((product) => (
                  <div
                    key={product.name}
                    className="border-b border-t border-gray-200 bg-white shadow-sm sm:rounded-lg sm:border"
                  >
                    <div className="px-4 py-6 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:p-8">
                      <div className="sm:flex lg:col-span-7">
                        <div className="mt-6 sm:ml-6 sm:mt-0">
                          <h3 className="text-base font-medium text-gray-900">
                            <Link href={`/product/${product.name}`}>
                              {product.name}
                            </Link>
                          </h3>
                          <p className="mt-2 text-sm font-medium text-green-900">
                            {formatCurrencyINR(product.price)}
                          </p>
                          <p className="mt-3 text-sm text-gray-500">
                            {product.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 lg:col-span-5 lg:mt-0">
                        <dl className="grid grid-cols-2 gap-x-6 text-sm">
                          <div>
                            <dt className="font-medium text-gray-900">
                              Delivery address
                            </dt>
                            <dd className="mt-3 text-gray-500">
                              <p>{order.shippingAddress.street}</p>
                              <p>
                                {order.shippingAddress.city},{" "}
                                {order.shippingAddress.state}
                              </p>
                              <p>{order.shippingAddress.postalCode}</p>
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-900">
                              Shipping updates
                            </dt>
                            <dd className="mt-3 space-y-3 text-gray-500">
                              <p>{order.email}</p>
                              <p>{order.phone}</p>
                              <button
                                type="button"
                                className="font-medium text-indigo-600 hover:text-indigo-500"
                              >
                                Edit
                              </button>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {AquaOrderTimeline({ order })}
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="summary-heading" className="mt-16">
              <h2 id="summary-heading" className="sr-only">
                Billing Summary
              </h2>

              <div className="bg-white rounded-lg shadow-md p-6 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:px-8 lg:py-8">
                <dl className="grid grid-cols-2 gap-6 text-lg sm:grid-cols-2 md:gap-x-8 lg:col-span-7">
                  <div>
                    <dt className="font-medium text-gray-900">
                      Billing address
                    </dt>
                    <dd className="mt-3 text-gray-500">
                      <span className="block">
                        {order?.shippingAddress?.street}
                      </span>
                      <span className="block">
                        {order?.shippingAddress?.city}
                      </span>
                      <span className="block">
                        {order?.shippingAddress?.state}
                      </span>
                      <span className="block">
                        {order?.shippingAddress?.postalCode}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900">
                      Payment information
                    </dt>
                    <dd className="-ml-4 -mt-1 flex flex-wrap">
                      <div className="ml-4 mt-4">COD</div>
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            {/* Billing */}
            {order?.orderType === "Cash On Delivery" ? (
              <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <dl className="space-y-6 border-t border-gray-200 pt-10 text-lg">
                  <div className="flex justify-between items-center">
                    <dt className="font-medium text-gray-900 text-xl">Total</dt>
                    <dd className="text-gray-900 font-bold text-2xl text-green-600">
                      {formatCurrencyINR(order?.totalAmount)}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              ""
            )}
          </>
        </main>
      ) : (
        <div className="flex flex-col items-center justify-center h-screen bg-white">
          <p className="mt-4 text-sm text-gray-500">Order not found</p>
        </div>
      )}
    </AquaLayout>
  );
};
export default AquaCodOrderPageComponent;
