import { Fragment, useState, useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import AquaLayout from "@/components/Layout/Layout";
import { useRouter } from "next/router";
import orderServiceOperations from "@/services/order";
import useCurrency from "@/utils/currency";
import moment from "moment";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import AquaToast from "@/components/reusables/react-toastify";
import AquaBadge from "@/components/reusables/badge";
import AquaPaymentDetails from "@/components/utils/paymentTypeDetails";
import AquaSpinner from "@/components/common/spinner";

const currencies = ["CAD", "USD", "AUD", "EUR", "GBP"];
const navigation = {
  categories: [
    {
      name: "Women",
      featured: [
        { name: "Sleep", href: "#" },
        { name: "Swimwear", href: "#" },
        { name: "Underwear", href: "#" },
      ],
      collection: [
        { name: "Everything", href: "#" },
        { name: "Core", href: "#" },
        { name: "New Arrivals", href: "#" },
        { name: "Sale", href: "#" },
      ],
      categories: [
        { name: "Basic Tees", href: "#" },
        { name: "Artwork Tees", href: "#" },
        { name: "Bottoms", href: "#" },
        { name: "Underwear", href: "#" },
        { name: "Accessories", href: "#" },
      ],
      brands: [
        { name: "Full Nelson", href: "#" },
        { name: "My Way", href: "#" },
        { name: "Re-Arranged", href: "#" },
        { name: "Counterfeit", href: "#" },
        { name: "Significant Other", href: "#" },
      ],
    },
    {
      name: "Men",
      featured: [
        { name: "Casual", href: "#" },
        { name: "Boxers", href: "#" },
        { name: "Outdoor", href: "#" },
      ],
      collection: [
        { name: "Everything", href: "#" },
        { name: "Core", href: "#" },
        { name: "New Arrivals", href: "#" },
        { name: "Sale", href: "#" },
      ],
      categories: [
        { name: "Artwork Tees", href: "#" },
        { name: "Pants", href: "#" },
        { name: "Accessories", href: "#" },
        { name: "Boxers", href: "#" },
        { name: "Basic Tees", href: "#" },
      ],
      brands: [
        { name: "Significant Other", href: "#" },
        { name: "My Way", href: "#" },
        { name: "Counterfeit", href: "#" },
        { name: "Re-Arranged", href: "#" },
        { name: "Full Nelson", href: "#" },
      ],
    },
  ],
  pages: [
    { name: "Company", href: "#" },
    { name: "Stores", href: "#" },
  ],
};

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const AquaOrder = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState({});
  const [mode, setMode] = useState({ COD: false, payment: false });
  const [loading, setLoading] = useState(false);
  const { formatCurrencyINR } = useCurrency;
  const formattedDate = moment(order?.createdAt).format("DD MMM YYYY");
  const { userData } = useSelector((state) => ({ ...state }));

  const handleRetryPayment = async (id) => {
    console.log("order", order);
  };
  const handleRetryCOD = async (id) => {
    console.log("order", order);
    orderServiceOperations
      .updateOrderStatus(id._id, userData.token, {
        paymentMethod: "Cash On Delivery",
      })
      .then(() => {
        AquaToast({
          message: "Order is successfully accepted as COD",
          type: "success",
        });
      })
      .catch(() => {
        AquaToast({
          message: "Error in accepting COD",
          type: "error",
        });
      });
  };

  useEffect(() => {
    if (!router.isReady || !userData?.token) return;

    const { id } = router.query;
    const paymentMode = id.includes("PGPP");
    const CODMode = id.includes("COD");

    setLoading(true);

    const fetchOrder = paymentMode
      ? orderServiceOperations.verifyPayment(id, userData.token)
      : orderServiceOperations.getOrdersByTransactionId(id, userData.token);

    fetchOrder
      .then((res) => {
        const orderData = res.data;
        setOrder(orderData);
        dispatch({ type: "EMPTY_CART" });
        setMode({ payment: paymentMode, COD: CODMode });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Order fetch error:", err);
        AquaToast({
          message: "Oops! Something has gone wrong.",
          type: "error",
        });
        setLoading(false);
      });
  }, [router.isReady, router.query, userData]);
  const Seo = {
    title: "Aquakart | orders",
  };
  const [open, setOpen] = useState(false);

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

  return (
    <>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-screen bg-white">
          <AquaSpinner color="blue" size="lg" />
          <p className="mt-4 text-sm text-gray-500 animate-pulse">
            Loading your order details...
          </p>
        </div>
      ) : (
        <div className="bg-gray-50">
          {/* Mobile menu */}
          <Dialog
            open={open}
            onClose={setOpen}
            className="relative z-40 lg:hidden"
          >
            <DialogBackdrop
              transition
              className="fixed inset-0 bg-black bg-opacity-25 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
            />

            <div className="fixed inset-0 z-40 flex">
              <DialogPanel
                transition
                className="relative flex w-full max-w-xs transform flex-col overflow-y-auto bg-white pb-12 shadow-xl transition duration-300 ease-in-out data-[closed]:-translate-x-full"
              >
                <div className="flex px-4 pb-2 pt-5">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="-m-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400"
                  >
                    <span className="sr-only">Close menu</span>
                    <XMarkIcon aria-hidden="true" className="h-6 w-6" />
                  </button>
                </div>

                {/* Links */}
                <TabGroup className="mt-2">
                  <div className="border-b border-gray-200">
                    <TabList className="-mb-px flex space-x-8 px-4">
                      {navigation.categories.map((category) => (
                        <Tab
                          key={category.name}
                          className="flex-1 whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-base font-medium text-gray-900 data-[selected]:border-indigo-600 data-[selected]:text-indigo-600"
                        >
                          {category.name}
                        </Tab>
                      ))}
                    </TabList>
                  </div>
                  <TabPanels as={Fragment}>
                    {navigation.categories.map((category, categoryIdx) => (
                      <TabPanel
                        key={category.name}
                        className="space-y-12 px-4 pb-6 pt-10"
                      >
                        <div className="grid grid-cols-1 items-start gap-x-6 gap-y-10">
                          <div className="grid grid-cols-1 gap-x-6 gap-y-10">
                            <div>
                              <p
                                id={`mobile-featured-heading-${categoryIdx}`}
                                className="font-medium text-gray-900"
                              >
                                Featured
                              </p>
                              <ul
                                role="list"
                                aria-labelledby={`mobile-featured-heading-${categoryIdx}`}
                                className="mt-6 space-y-6"
                              >
                                {category.featured.map((item) => (
                                  <li key={item.name} className="flex">
                                    <a
                                      href={item.href}
                                      className="text-gray-500"
                                    >
                                      {item.name}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p
                                id="mobile-categories-heading"
                                className="font-medium text-gray-900"
                              >
                                Categories
                              </p>
                              <ul
                                role="list"
                                aria-labelledby="mobile-categories-heading"
                                className="mt-6 space-y-6"
                              >
                                {category.categories.map((item) => (
                                  <li key={item.name} className="flex">
                                    <a
                                      href={item.href}
                                      className="text-gray-500"
                                    >
                                      {item.name}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-x-6 gap-y-10">
                            <div>
                              <p
                                id="mobile-collection-heading"
                                className="font-medium text-gray-900"
                              >
                                Collection
                              </p>
                              <ul
                                role="list"
                                aria-labelledby="mobile-collection-heading"
                                className="mt-6 space-y-6"
                              >
                                {category.collection.map((item) => (
                                  <li key={item.name} className="flex">
                                    <a
                                      href={item.href}
                                      className="text-gray-500"
                                    >
                                      {item.name}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <p
                                id="mobile-brand-heading"
                                className="font-medium text-gray-900"
                              >
                                Brands
                              </p>
                              <ul
                                role="list"
                                aria-labelledby="mobile-brand-heading"
                                className="mt-6 space-y-6"
                              >
                                {category.brands.map((item) => (
                                  <li key={item.name} className="flex">
                                    <a
                                      href={item.href}
                                      className="text-gray-500"
                                    >
                                      {item.name}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </TabPanel>
                    ))}
                  </TabPanels>
                </TabGroup>

                <div className="space-y-6 border-t border-gray-200 px-4 py-6">
                  {navigation.pages.map((page) => (
                    <div key={page.name} className="flow-root">
                      <a
                        href={page.href}
                        className="-m-2 block p-2 font-medium text-gray-900"
                      >
                        {page.name}
                      </a>
                    </div>
                  ))}
                </div>

                <div className="space-y-6 border-t border-gray-200 px-4 py-6">
                  <div className="flow-root">
                    <a
                      href="#"
                      className="-m-2 block p-2 font-medium text-gray-900"
                    >
                      Create an account
                    </a>
                  </div>
                  <div className="flow-root">
                    <a
                      href="#"
                      className="-m-2 block p-2 font-medium text-gray-900"
                    >
                      Sign in
                    </a>
                  </div>
                </div>

                <div className="space-y-6 border-t border-gray-200 px-4 py-6">
                  {/* Currency selector */}
                  <form>
                    <div className="inline-block">
                      <label htmlFor="mobile-currency" className="sr-only">
                        Currency
                      </label>
                      <div className="group relative -ml-2 rounded-md border-transparent focus-within:ring-2 focus-within:ring-white">
                        <select
                          id="mobile-currency"
                          name="currency"
                          className="flex items-center rounded-md border-transparent bg-none py-0.5 pl-2 pr-5 text-sm font-medium text-gray-700 focus:border-transparent focus:outline-none focus:ring-0 group-hover:text-gray-800"
                        >
                          {currencies.map((currency) => (
                            <option key={currency}>{currency}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                          <ChevronDownIcon
                            aria-hidden="true"
                            className="h-5 w-5 text-gray-500"
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </DialogPanel>
            </div>
          </Dialog>

          <AquaLayout seo={Seo}>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-screen bg-white">
                <AquaSpinner color="blue" size="lg" />
                <p className="mt-4 text-sm text-gray-500 animate-pulse">
                  Loading your order details...
                </p>
              </div>
            ) : (
              <main className="mx-auto max-w-2xl pb-24 pt-8 sm:px-6 sm:pt-16 lg:max-w-7xl lg:px-8">
                {mode.COD && (
                  <>
                    <div className="space-y-2 px-4 sm:flex sm:items-baseline sm:justify-between sm:space-y-0 sm:px-0">
                      <div className="flex sm:items-baseline sm:space-x-4">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                          Order #{order?.orderId} - Cash On Delivery
                        </h1>

                        <Link
                          href="#"
                          className="hidden text-sm font-medium text-indigo-600 hover:text-indigo-500 sm:block"
                        >
                          View invoice
                          <span aria-hidden="true"> &rarr;</span>
                        </Link>
                      </div>
                      <p className="text-sm text-gray-600">
                        Order placed{" "}
                        <time
                          dateTime="2021-03-22"
                          className="font-medium text-gray-900"
                        >
                          {formattedDate}
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
                    <section
                      aria-labelledby="products-heading"
                      className="mt-6"
                    >
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

                    <section
                      aria-labelledby="summary-heading"
                      className="mt-16"
                    >
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
                            <dt className="font-medium text-gray-900 text-xl">
                              Total
                            </dt>
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
                )}
                {mode.payment && (
                  <>
                    <div className="space-y-2 px-4 sm:flex sm:items-baseline sm:justify-between sm:space-y-0 sm:px-0">
                      <div className="flex sm:items-baseline sm:space-x-4">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                          Order #{order?.orderId} -{" "}
                          {order?.orderType === "Cash On Delivery"
                            ? "Cash On Delivery"
                            : "Online Payment"}
                          --
                          <AquaBadge
                            text={order?.paymentStatus}
                            color={getStatusColor(order?.paymentStatus)}
                            size="large" // Adjust size as needed
                          />
                        </h1>
                      </div>
                      <p className="text-sm text-gray-600">
                        Order placed{" "}
                        <time
                          dateTime="2021-03-22"
                          className="font-medium text-gray-900"
                        >
                          {formattedDate}
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
                    <section
                      aria-labelledby="products-heading"
                      className="mt-6"
                    >
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
                                  <p className="mt-3 text-sm text-gray-500">
                                    Qunatity Placed : {product.quantity}
                                  </p>
                                  <p className="mt-2 text-sm font-medium text-green-900">
                                    Price : {formatCurrencyINR(product.price)}
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
                                    </dd>
                                  </div>
                                </dl>
                              </div>
                            </div>
                            {order?.paymentGatewayDetails?.success ? (
                              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
                                <strong className="font-bold">
                                  Payment Success!
                                </strong>
                                <p className="mt-2 text-sm">
                                  Your payment was successfully processed. Thank
                                  you for your order.
                                </p>
                              </div>
                            ) : (
                              <div className="bg-red-100 border border-red-400 text-red-700 p-6 rounded-lg mb-6 m-5">
                                <strong className="font-bold">
                                  Payment Pending or Failed
                                </strong>
                                <p className="mt-2 text-sm">
                                  It looks like your payment did not go through.
                                  You can try again or opt for Cash on Delivery.
                                </p>
                                <div className="mt-4 flex gap-4">
                                  <button
                                    onClick={() => handleRetryPayment(id)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                  >
                                    Pay Again
                                  </button>
                                  <button
                                    onClick={() => handleRetryCOD(id)}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
                                  >
                                    Switch to COD
                                  </button>
                                </div>
                              </div>
                            )}
                            {AquaOrderTimeline({ order })}
                          </div>
                        ))}
                      </div>
                    </section>

                    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                      <div className="flex justify-between items-center">
                        <dt className="font-medium text-gray-900 text-xl">
                          Total
                        </dt>
                        <dd className="text-gray-900 font-bold text-2xl text-green-600">
                          {formatCurrencyINR(order?.totalAmount)}
                        </dd>
                      </div>
                    </div>
                  </>
                )}
              </main>
            )}
          </AquaLayout>
        </div>
      )}
    </>
  );
};

export default AquaOrder;

// payment gateway code.
