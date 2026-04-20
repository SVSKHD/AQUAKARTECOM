import { useMemo, useState, useEffect, useCallback } from "react";
import AquaLayout from "@/components/Layout/Layout";
import orderServiceOperations from "@/services/order";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import AquaToast from "@/components/reusables/react-toastify";
import useCurrency from "@/utils/currency";
import Link from "next/link";
import dayjs from "dayjs";
import { generateInvoicePDF, loadJsPDF } from "@/utils/invoice";
import priceUtils from "@/utils/price";
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
const GST_RATE = 0.18;
const roundToTwo = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const AquaCodOrderPageComponent = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const { userData } = useSelector((state) => ({ ...state }));
  const { formatCurrencyINR } = useCurrency;

  const fetchCodOrder = async (id) => {
    setLoading(true);
    try {
      const response = await orderServiceOperations.getOrdersByTransactionId(
        id,
        userData.token,
      );
      setOrder(response.data);
      dispatch({ type: "EMPTY_CART" });
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

  useEffect(() => {
    loadJsPDF().then((ready) => {
      setIsPdfReady(ready);
      if (!ready) {
        AquaToast({
          message: "Invoice generator failed to load. Please refresh.",
          type: "error",
        });
      }
    });
  }, []);

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

  const AquaOrderTimeline = ({ order }) => {
    const currentStep = getOrderStep(order.orderStatus);

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 rounded-2xl bg-indigo-50/70 p-4 text-sm text-indigo-900 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5" aria-hidden="true" />
            <div>
              <p className="font-semibold">
                Current status: {order.orderStatus}
              </p>
              <p className="text-xs text-indigo-700">
                Last updated{" "}
                {dayjs(order.updatedAt).format("DD MMM YYYY, hh:mm A")}
              </p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50">
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
                        ? "bg-indigo-600"
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
                    {isCurrent && order.estimatedDelivery && (
                      <p className="text-xs font-medium text-indigo-600">
                        Estimated delivery{" "}
                        {dayjs(order.estimatedDelivery).format("DD MMM YYYY")}
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

  const orderSubtotal = useMemo(() => {
    if (!order?.items?.length) return 0;
    const total = order.items.reduce((sum, item) => {
      const unitPrice = toNumber(item?.price);
      const quantity = toNumber(item?.quantity);
      return sum + unitPrice * quantity;
    }, 0);
    return roundToTwo(total);
  }, [order?.items]);

  const { itemsBaseTotal, itemsGstTotal } = useMemo(() => {
    if (!order?.items?.length) {
      return { itemsBaseTotal: 0, itemsGstTotal: 0 };
    }

    return order.items.reduce(
      (acc, item) => {
        const unitPrice = toNumber(item?.price);
        const quantity = toNumber(item?.quantity);
        const grossLine = roundToTwo(unitPrice * quantity);
        const baseLine = roundToTwo(grossLine / (1 + GST_RATE));
        const gstLine = roundToTwo(grossLine - baseLine);
        return {
          itemsBaseTotal: roundToTwo(acc.itemsBaseTotal + baseLine),
          itemsGstTotal: roundToTwo(acc.itemsGstTotal + gstLine),
        };
      },
      { itemsBaseTotal: 0, itemsGstTotal: 0 },
    );
  }, [order?.items]);

  const shippingCharge = useMemo(() => {
    if (!order) return 0;
    const rawShipping =
      order.shippingCost ??
      order.shippingCharge ??
      order.deliveryCharge ??
      order.shipping;
    return roundToTwo(toNumber(rawShipping, 0));
  }, [order]);

  const payableTotal = useMemo(
    () => roundToTwo(toNumber(order?.totalAmount, 0)),
    [order?.totalAmount],
  );

  const handleDownloadInvoice = useCallback(async () => {
    if (!order) return;
    setIsGeneratingInvoice(true);
    try {
      await generateInvoicePDF(order);
      AquaToast({
        message: "Invoice downloaded successfully.",
        type: "success",
      });
    } catch (err) {
      console.error("Invoice error:", err);
      AquaToast({
        message: err?.message || "Unable to generate invoice.",
        type: "error",
      });
    } finally {
      setIsGeneratingInvoice(false);
    }
  }, [order]);

  return (
    <AquaLayout>
      {loading ? (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-6 py-12">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-indigo-100">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Clock className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Fetching your order
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              We’re pulling your COD order details. This might take a few
              seconds.
            </p>
            <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-1/3 animate-[loading_1.5s_infinite] rounded-full bg-indigo-500"></div>
            </div>
          </div>
        </div>
      ) : order ? (
        <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-24 pt-8 sm:gap-10 sm:px-6 sm:pt-12 lg:px-8">
          <div className="flex flex-col gap-4 glass-card rounded-3xl p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600">
                Order confirmed
              </p>
              <h1 className="mt-2 text-xl sm:text-3xl font-semibold tracking-tight text-gray-900 break-all">
                COD Order #{order?.orderId}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Placed on{" "}
                {dayjs(order?.createdAt).format("DD MMM YYYY, hh:mm A")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadInvoice}
                disabled={!isPdfReady || isGeneratingInvoice}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isPdfReady && !isGeneratingInvoice
                    ? "border-indigo-200 bg-white text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50"
                    : "cursor-not-allowed border-indigo-100 bg-indigo-50 text-indigo-300"
                }`}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {isGeneratingInvoice
                  ? "Preparing invoice..."
                  : "Download invoice"}
              </button>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
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
                {order?.items?.map((product) => (
                  <div
                    key={product.productId}
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
                        {formatCurrencyINR(payableTotal)}
                      </p>
                    </div>
                    <div className="w-full rounded-2xl bg-gray-50 p-4 text-sm text-gray-600 sm:w-64">
                      <p className="font-semibold text-gray-900">Delivery to</p>
                      <p className="mt-2 flex items-center gap-2 text-xs">
                        <MapPin className="h-4 w-4 text-indigo-500" />
                        {order.shippingAddress.street},{" "}
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state}{" "}
                        {order.shippingAddress.postalCode}
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-xs">
                        <Phone className="h-4 w-4 text-indigo-500" />
                        {order.phone || "N/A"}
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-xs">
                        <Mail className="h-4 w-4 text-indigo-500" />
                        {order.email || "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <AquaOrderTimeline order={order} />
              </div>
            </article>

            <aside className="col-span-full lg:col-span-3 space-y-6">
              <div className="glass-card rounded-3xl p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Order summary
                </h3>
                <dl className="mt-4 space-y-3 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <dt>Product price</dt>
                    <dd className="font-medium text-gray-900">
                      {formatCurrencyINR(
                        priceUtils?.getBasePrice(payableTotal),
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <dt className="pl-3">
                      Incl. GST ({Math.round(GST_RATE * 100)}%)
                    </dt>
                    <dd>
                      {formatCurrencyINR(priceUtils?.getGSTValue(payableTotal))}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Payment method</dt>
                    <dd className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                      <IndianRupee className="h-3.5 w-3.5" aria-hidden="true" />
                      Cash On Delivery
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
                    <dt>Total to pay</dt>
                    <dd className="text-lg text-indigo-600">
                      {formatCurrencyINR(payableTotal)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="glass-card rounded-3xl bg-indigo-50/40 p-5 sm:p-6 text-sm text-indigo-900">
                <h3 className="text-base font-semibold">Need help?</h3>
                <p className="mt-2">
                  Reach our support team at
                  <span className="font-semibold"> +91 9014774667</span> or
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
              We couldn’t find an order with that reference. Double-check the
              link or go back to your orders.
            </p>
            <Link
              href="/dashboard/orders"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              View my orders
            </Link>
          </div>
        </div>
      )}
    </AquaLayout>
  );
};
export default AquaCodOrderPageComponent;
