import { useMemo, useState, useEffect } from "react";
import AquaLayout from "@/components/Layout/Layout";
import orderServiceOperations from "@/services/order";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import AquaToast from "@/components/reusables/react-toastify";
import useCurrency from "@/utils/currency";
import Link from "next/link";
import dayjs from "dayjs";
import {
  CheckCircle,
  Clock,
  Truck,
  MapPin,
  Download,
  IndianRupee,
  ShoppingBag,
  Home,
  Phone,
  Mail,
} from "lucide-react";

const PAYMENT_METHOD_LABEL = "Online Payment";

const AquaPaymentOrderPageComponent = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => ({ ...state }));

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const { formatCurrencyINR } = useCurrency;

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
        return -1;
      default:
        return 0;
    }
  };

  const timelineSteps = useMemo(
    () => [
      {
        name: "Order placed",
        description: "We received your order",
        icon: ShoppingBag,
      },
      {
        name: "Processing",
        description: "Items are being prepared",
        icon: Clock,
      },
      {
        name: "Shipped",
        description: "On the way to you",
        icon: Truck,
      },
      {
        name: "Delivered",
        description: "Package delivered",
        icon: CheckCircle,
      },
    ],
    [],
  );

  const AquaOrderTimeline = ({ currentOrder }) => {
    const currentStep = getOrderStep(currentOrder.orderStatus);

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 rounded-2xl bg-emerald-50/80 p-4 text-sm text-emerald-900 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5" aria-hidden="true" />
            <div>
              <p className="font-semibold">
                Current status: {currentOrder.orderStatus}
              </p>
              <p className="text-xs text-emerald-700">
                Last updated{" "}
                {dayjs(currentOrder.updatedAt).format("DD MMM YYYY, hh:mm A")}
              </p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-50">
            Track package
          </button>
        </div>

        <div className="relative">
          <div
            className="absolute left-[13px] top-0 h-full w-0.5 bg-gray-200"
            aria-hidden="true"
          />
          <ol className="space-y-6">
            {timelineSteps.map((step, index) => {
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              const Icon = step.icon;

              return (
                <li key={step.name} className="relative flex gap-4">
                  <span
                    className={`relative inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white shadow ${
                      isCompleted
                        ? "bg-emerald-600"
                        : "bg-gray-300 text-gray-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <p
                      className={`text-sm font-semibold ${isCompleted ? "text-gray-900" : "text-gray-500"}`}
                    >
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                    {isCurrent && currentOrder.estimatedDelivery && (
                      <p className="text-xs font-medium text-emerald-600">
                        Estimated delivery{" "}
                        {dayjs(currentOrder.estimatedDelivery).format(
                          "DD MMM YYYY",
                        )}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!router.isReady || !userData?.token) return;

    const { id } = router.query;
    if (!id) return;

    const fetchPaymentOrder = async () => {
      setLoading(true);
      try {
        const response = await orderServiceOperations.verifyPayment(
          id,
          userData.token,
        );
        const orderData = response?.data ?? response;
        setOrder(orderData);
        dispatch({ type: "EMPTY_CART" });
      } catch (error) {
        AquaToast({
          message: "Oops! We couldn't load your payment order.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentOrder();
  }, [router.isReady, router.query.id, userData?.token, dispatch]);

  const shippingCharge =
    typeof order?.shippingCharge === "number" ? order.shippingCharge : 0;
  const subtotal =
    typeof order?.totalAmount === "number" ? order.totalAmount : 0;
  const amountPaid =
    typeof order?.amountPaid === "number"
      ? order.amountPaid
      : subtotal + shippingCharge;
  const paymentMethodLabel = order?.paymentMethod || PAYMENT_METHOD_LABEL;
  const addressParts = [
    order?.shippingAddress?.street,
    order?.shippingAddress?.city,
    order?.shippingAddress?.state,
    order?.shippingAddress?.postalCode,
  ].filter(Boolean);
  const addressLine = addressParts.length
    ? addressParts.join(", ")
    : "Address details will be shared soon.";
  const contactPhone = order?.phone || order?.shippingAddress?.phone || "N/A";
  const contactEmail = order?.email || order?.shippingAddress?.email || "N/A";

  return (
    <AquaLayout>
      {loading ? (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-6 py-12">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-emerald-100">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Clock className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Confirming your payment
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              We’re validating the transaction details. This should only take a
              moment.
            </p>
            <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-1/3 animate-[loading_1.5s_infinite] rounded-full bg-emerald-500"></div>
            </div>
          </div>
        </div>
      ) : order ? (
        <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-24 pt-8 sm:gap-10 sm:px-6 sm:pt-12 lg:px-8">
          <div className="flex flex-col gap-4 glass-card rounded-3xl p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">
                Payment successful
              </p>
              <h1 className="mt-2 text-xl sm:text-3xl font-semibold tracking-tight text-gray-900 break-all">
                Order #{order?.orderId}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Placed on{" "}
                {order?.createdAt
                  ? dayjs(order.createdAt).format("DD MMM YYYY, hh:mm A")
                  : "-"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-50">
                <Download className="h-4 w-4" aria-hidden="true" />
                Download invoice
              </button>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                Continue shopping
              </Link>
            </div>
          </div>

          <section className="grid gap-6 lg:grid-cols-7">
            <article className="col-span-full lg:col-span-4 space-y-6 glass-card rounded-3xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Items in your order
              </h2>
              <div className="space-y-4">
                {order?.items?.map((product, index) => (
                  <div
                    key={product.productId || `${product.name}-${index}`}
                    className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:gap-6"
                  >
                    <div className="flex-1 space-y-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        <Link href={`/product/${product.productId}`}>
                          {product.name}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-500">
                        Qty: {product.quantity}
                      </p>
                      <p className="text-medium font-semibold text-gray-800">
                        {formatCurrencyINR(
                          (product.price || 0) * (product.quantity || 0),
                        )}
                      </p>
                    </div>
                    <div className="w-full rounded-2xl bg-gray-50 p-4 text-sm text-gray-600 sm:w-64">
                      <p className="font-semibold text-gray-900">Delivery to</p>
                      <p className="mt-2 flex items-center gap-2 text-xs">
                        <MapPin className="h-4 w-4 text-emerald-500" />
                        {addressLine}
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-xs">
                        <Phone className="h-4 w-4 text-emerald-500" />
                        {contactPhone}
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-xs">
                        <Mail className="h-4 w-4 text-emerald-500" />
                        {contactEmail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <AquaOrderTimeline currentOrder={order} />
              </div>
            </article>

            <aside className="col-span-full lg:col-span-3 space-y-6">
              <div className="glass-card rounded-3xl p-5 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment details
                </h3>
                <dl className="mt-4 space-y-3 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <dt>Product price</dt>
                    <dd className="font-medium text-gray-900">
                      {formatCurrencyINR(subtotal)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <dt className="pl-3">Incl. GST (18%)</dt>
                    <dd>
                      {formatCurrencyINR(
                        Math.round((subtotal / 1.18) * 0.18 * 100) / 100,
                      )}
                    </dd>
                  </div>
                  {shippingCharge > 0 && (
                    <div className="flex items-center justify-between">
                      <dt>Shipping</dt>
                      <dd className="font-medium text-gray-900">
                        {formatCurrencyINR(shippingCharge)}
                      </dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <dt>Payment method</dt>
                    <dd className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                      <IndianRupee className="h-3.5 w-3.5" aria-hidden="true" />
                      {paymentMethodLabel}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
                    <dt>Total paid</dt>
                    <dd className="text-lg text-emerald-600">
                      {formatCurrencyINR(amountPaid)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="glass-card rounded-3xl bg-emerald-50/40 p-5 sm:p-6 text-sm text-emerald-900">
                <h3 className="text-base font-semibold">Need help?</h3>
                <p className="mt-2">
                  Reach our support team at
                  <span className="font-semibold"> +91 96186 06807</span> or
                  email
                  <span className="font-semibold"> support@aquakart.co.in</span>
                  .
                </p>
              </div>
            </aside>
          </section>
        </main>
      ) : (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
          <div className="max-w-sm rounded-3xl bg-gray-50 p-6 text-center shadow">
            <Home className="mx-auto h-10 w-10 text-gray-400" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Order not found
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              We couldn’t locate an order for this payment reference.
              Double-check the link or visit your orders page.
            </p>
            <Link
              href="/dashboard/orders"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              View my orders
            </Link>
          </div>
        </div>
      )}
    </AquaLayout>
  );
};

export default AquaPaymentOrderPageComponent;
