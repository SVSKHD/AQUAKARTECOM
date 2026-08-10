import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Circle,
  CreditCard,
  MapPin,
  PackageCheck,
  Receipt,
  Wallet,
  IndianRupee,
} from "lucide-react";
import AquaLayout from "@/components/Layout/Layout";
import AquaSpinner from "@/components/common/spinner";
import AquaToast from "@/components/reusables/react-toastify";
import orderServiceOperations from "@/services/order";
import { useAuth } from "@/context/AuthContext";

const TIMELINE_STEPS = [
  {
    key: "placed",
    label: "Order placed",
    description: "We’ve received your order.",
  },
  {
    key: "processing",
    label: "Processing",
    description: "Your items are being prepared.",
  },
  {
    key: "shipped",
    label: "Shipped",
    description: "Package handed over to the courier.",
  },
  {
    key: "out_for_delivery",
    label: "Out for delivery",
    description: "Courier is on the way.",
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Order delivered successfully.",
  },
];

const statusRank = {
  placed: 0,
  pending: 0,
  processing: 1,
  packed: 1,
  shipped: 2,
  dispatched: 2,
  out_for_delivery: 3,
  "out for delivery": 3,
  delivered: 4,
  completed: 4,
  cancelled: 0,
};

const toLowerSafe = (value) => `${value || ""}`.toLowerCase();

const formatCurrencyINR = (amount) => {
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return "₹0";
  return numeric.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
};

const composeAddress = (address) => {
  if (!address) return "—";
  return [address.street, address.city, address.state, address.postalCode]
    .filter(Boolean)
    .map((part) => `${part}`.trim())
    .join(", ");
};

const deriveTimeline = (orderStatus = "") => {
  const key = toLowerSafe(orderStatus);
  let matchedKey = "placed";
  if (key.includes("deliver")) matchedKey = "delivered";
  else if (key.includes("out")) matchedKey = "out_for_delivery";
  else if (key.includes("ship") || key.includes("dispatch"))
    matchedKey = "shipped";
  else if (key.includes("process") || key.includes("pack"))
    matchedKey = "processing";

  const currentIndex = statusRank[matchedKey] ?? 1;

  return TIMELINE_STEPS.map((step, index) => ({
    ...step,
    completed: index <= currentIndex,
    current: index === currentIndex,
  }));
};

const AquaOrderPage = () => {
  const router = useRouter();
  const { signOut } = useAuth();
  const { id } = router.query;
  const userData = useSelector((state) => state.userData);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true); // Start true to avoid flash
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [switchingToCod, setSwitchingToCod] = useState(false);
  const pollCountRef = useRef(0);

  const token = userData?.token;
  const userId = userData?.user?._id;

  const handleReLogin = () => {
    // Full sign-out (Firebase included) so the next sign-in issues a fresh token.
    signOut({ notify: false });
  };

  const fetchOrder = useCallback(
    async (signal) => {
      if (!id || !token) {
        setLoading(false);
        return;
      }
      setError("");
      setAuthError(false);

      try {
        const response = await orderServiceOperations.getOrdersByTransactionId(
          id,
          token,
          { signal },
        );
        // API may return { data: order } or order directly
        const orderData = response?.data || response;
        setOrder(orderData || null);
        return orderData;
      } catch (fetchError) {
        if (signal?.aborted) return null;
        console.error("Order fetch error:", fetchError);
        if (fetchError?.authError) {
          setAuthError(true);
          setError(
            fetchError.message || "Session expired. Please sign in again.",
          );
        } else {
          setError(
            fetchError?.message ||
              "We couldn’t load this order. Please try again.",
          );
        }
        setOrder(null);
        return null;
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [id, token],
  );

  // Initial fetch + polling for payment verification (max 3 retries over 15s)
  useEffect(() => {
    if (!router.isReady || !token || !id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    pollCountRef.current = 0;
    const controller = new AbortController();

    const poll = async () => {
      const result = await fetchOrder(controller.signal);
      if (controller.signal.aborted) return;

      // If order not found yet (payment gateway may not have notified backend),
      // retry a few times with delay
      if (!result && pollCountRef.current < 3) {
        pollCountRef.current += 1;
        setTimeout(() => {
          if (!controller.signal.aborted) {
            setLoading(true);
            setError("");
            poll();
          }
        }, pollCountRef.current * 3000); // 3s, 6s, 9s
      }
    };

    poll();
    return () => controller.abort();
  }, [router.isReady, id, token, fetchOrder]);

  const summary = useMemo(() => {
    if (!order) return null;

    const gateway = order.paymentGatewayDetails?.statusResponse;
    const gatewayData = gateway?.data;

    return {
      orderId: order.orderId,
      transactionId: order.transactionId,
      orderDate: order.createdAt
        ? new Date(order.createdAt).toLocaleString("en-IN")
        : "—",
      deliveryEta: order.estimatedDelivery
        ? new Date(order.estimatedDelivery).toLocaleDateString("en-IN")
        : "—",
      orderStatus: order.orderStatus || "Processing",
      paymentStatus: order.paymentStatus || gateway?.code || "Pending",
      paymentState: gatewayData?.state || order.paymentStatus,
      paymentMethod: order.orderType || order.paymentMethod,
      totalAmount: formatCurrencyINR(order.totalAmount),
      itemCount: Array.isArray(order.items)
        ? order.items.reduce((acc, item) => acc + (item?.quantity || 0), 0)
        : 0,
      shippingCost: formatCurrencyINR(order.shippingCost || 0),
      gatewayMessage: gateway?.message,
      instrument: order.paymentInstrument || gatewayData?.paymentInstrument,
    };
  }, [order]);

  const timeline = useMemo(
    () => (order ? deriveTimeline(order.orderStatus) : []),
    [order],
  );

  const paymentSettled = useMemo(() => {
    const status = toLowerSafe(summary?.paymentStatus);
    const state = toLowerSafe(summary?.paymentState);
    return (
      status.includes("paid") ||
      status.includes("success") ||
      state.includes("complete") ||
      state.includes("success")
    );
  }, [summary]);

  const paymentFailed = useMemo(() => {
    const status = toLowerSafe(summary?.paymentStatus);
    return status.includes("fail");
  }, [summary]);

  const allowCod = useMemo(() => {
    if (!order) return false;
    const total = Number(order.totalAmount);
    if (Number.isNaN(total)) return false;
    return total <= 65000;
  }, [order]);

  const buildOrderPayload = (overrides = {}) => {
    if (!order) return null;

    const baseOrderId =
      order.orderId ||
      `AQOD${dayjs().format("DDMMYYYY")}${nanoid(2).toUpperCase()}`;
    const base = {
      user: order.user || userId,
      customerName: order.customerName || "",
      email: order.email || "",
      phone: order.phone || "",
      orderId: baseOrderId,
      items: (order.items || []).map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount || 0,
      currency: order.currency || "INR",
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress,
      shippingMethod: order.shippingMethod || "Standard",
      shippingCost: order.shippingCost ?? 0,
      estimatedDelivery:
        order.estimatedDelivery ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      orderStatus: order.orderStatus || "Processing",
      ...overrides,
    };

    return base;
  };

  const handleRetryPayment = async () => {
    if (!order) return;
    const payload = buildOrderPayload({
      transactionId: `AQTR-PGPP${nanoid(5).toUpperCase()}R${dayjs().format("DDMMYYYY")}`,
      orderType: "Payment Method(Phone Pe Gateway)",
      paymentMethod: "OTHER THAN CASH ON DELIVERY",
      paymentStatus: "Pending",
    });

    if (!payload) {
      AquaToast({ message: "Unable to prepare payment", type: "error" });
      return;
    }

    try {
      setRetrying(true);
      const response = await orderServiceOperations.createPhonePePayOrder(
        payload,
        token,
      );
      const redirectUrl =
        response?.url || response?.data?.url || response?.redirectUrl;
      if (redirectUrl) {
        AquaToast({
          message: "Redirecting to payment gateway",
          type: "success",
        });
        window.location.href = redirectUrl;
      } else {
        console.error("No redirect URL in response:", response);
        AquaToast({
          message: "Payment gateway did not return a redirect URL",
          type: "error",
        });
      }
    } catch (retryError) {
      console.error("Retry payment error:", retryError);
      AquaToast({
        message: retryError?.message || "Failed to initiate payment retry",
        type: "error",
      });
    } finally {
      setRetrying(false);
    }
  };

  const handleSwitchToCod = async () => {
    if (!order) return;
    const payload = buildOrderPayload({
      transactionId: `AQTR-COD-${nanoid(5).toUpperCase()}${dayjs().format("DDMMYYYY")}`,
      orderType: "Cash On Delivery",
      paymentMethod: "Cash On Delivery",
      paymentStatus: "Pending",
    });

    if (!payload) {
      AquaToast({ message: "Unable to prepare COD order", type: "error" });
      return;
    }

    try {
      setSwitchingToCod(true);
      const response = await orderServiceOperations.createCodOrder(payload);
      AquaToast({
        message: "Cash on delivery order created",
        type: "success",
      });

      const nextTransaction =
        response?.data?.transactionId || payload.transactionId;
      if (nextTransaction) {
        router.push(`/order/cod/${nextTransaction}`);
      }
    } catch (codError) {
      console.error("Switch to COD error:", codError);
      AquaToast({ message: "Failed to create COD order", type: "error" });
    } finally {
      setSwitchingToCod(false);
    }
  };

  return (
    <AquaLayout>
      <div className="min-h-screen">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" /> Back to orders
            </Link>
          </div>

          {loading ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 glass-card rounded-3xl p-10">
              <AquaSpinner color="emerald" size="lg" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">
                  {pollCountRef.current > 0
                    ? "Confirming your payment..."
                    : "Loading your order details..."}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {pollCountRef.current > 0
                    ? "This may take a few seconds while we verify with the payment gateway."
                    : "Please wait while we fetch your order."}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 glass-tint-rose rounded-3xl p-10 text-center">
              <p className="text-lg font-semibold text-rose-700">{error}</p>
              {authError ? (
                <button
                  type="button"
                  onClick={handleReLogin}
                  className="btn-glass btn-glass-primary"
                >
                  Sign in again
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    fetchOrder();
                  }}
                  className="btn-glass btn-glass-secondary"
                >
                  Try again
                </button>
              )}
            </div>
          ) : !order ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
              We couldn’t find this order.
            </div>
          ) : (
            <div className="space-y-8">
              <section className="glass-card rounded-3xl p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span>Order placed on {summary?.orderDate}</span>
                      <span>•</span>
                      <span>#{summary?.orderId}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">
                      Order Details
                    </h1>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                      <PackageCheck className="h-4 w-4" />
                      {summary?.orderStatus}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                      <Wallet className="h-4 w-4" /> {summary?.paymentMethod}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                        paymentSettled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      <CreditCard className="h-4 w-4" />
                      {summary?.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                  <div className="flex h-full flex-col justify-between glass-tint-indigo rounded-2xl p-5 transition-all hover:shadow-lg">
                    <div>
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <CreditCard className="h-4 w-4" /> Payment Summary
                      </p>
                      <ul className="mt-4 space-y-3 text-sm text-slate-600">
                        <li className="flex items-center justify-between">
                          <span>Items Total</span>
                          <span>
                            {formatCurrencyINR(
                              order.totalAmount - (order.shippingCost || 0),
                            )}
                          </span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Shipping</span>
                          <span>{summary?.shippingCost}</span>
                        </li>
                        <li className="border-t border-slate-200 pt-3 flex items-center justify-between font-bold text-slate-900 text-base">
                          <span>Grand Total</span>
                          <span>{summary?.totalAmount}</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex h-full flex-col glass-tint-indigo rounded-2xl p-5 transition-all hover:shadow-lg">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <MapPin className="h-4 w-4" /> Delivery Details
                    </p>
                    <div className="mt-4 flex flex-1 flex-col gap-4 text-sm text-slate-600">
                      <div className="flex gap-3">
                        <CalendarClock className="h-5 w-5 flex-shrink-0 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">
                            Estimated Delivery
                          </p>
                          <p>{summary?.deliveryEta}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <MapPin className="h-5 w-5 flex-shrink-0 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">
                            Shipping Address
                          </p>
                          <p className="leading-relaxed">
                            {composeAddress(order.shippingAddress) ||
                              composeAddress(order.billingAddress)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex h-full flex-col glass-tint-indigo rounded-2xl p-5 transition-all hover:shadow-lg">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <Receipt className="h-4 w-4" /> Payment Info
                    </p>
                    {summary?.instrument ? (
                      <div className="mt-4 space-y-3 text-sm text-slate-600">
                        <div className="flex gap-2">
                          <span className="font-medium text-slate-900 min-w-[60px]">
                            Type:
                          </span>
                          <span>{summary.instrument.type || "—"}</span>
                        </div>
                        {summary.instrument.utr && (
                          <div className="flex gap-2">
                            <span className="font-medium text-slate-900 min-w-[60px]">
                              UTR:
                            </span>
                            <span className="break-all">
                              {summary.instrument.utr}
                            </span>
                          </div>
                        )}
                        {summary.instrument.payerVpa && (
                          <div className="flex gap-2">
                            <span className="font-medium text-slate-900 min-w-[60px]">
                              VPA:
                            </span>
                            <span className="break-all">
                              {summary.instrument.payerVpa}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500 italic">
                        No additional payment details available.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {paymentFailed || !paymentSettled ? (
                <section className="glass-tint-amber rounded-3xl p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100">
                      <IndianRupee className="h-5 w-5 text-amber-700" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-amber-900">
                        {paymentFailed ? "Payment failed" : "Payment pending"}
                      </h2>
                      <p className="mt-1 text-sm text-amber-800">
                        {paymentFailed
                          ? "Your payment could not be processed. Retry or switch to cash on delivery."
                          : "Your payment hasn’t completed yet. You can retry online or switch to COD."}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleRetryPayment}
                      disabled={retrying || switchingToCod}
                      className={`btn-glass inline-flex items-center justify-center gap-2 ${
                        retrying
                          ? "cursor-wait bg-indigo-300 text-white"
                          : "btn-glass-primary"
                      }`}
                    >
                      <CreditCard className="h-4 w-4" />
                      {retrying ? "Redirecting…" : "Retry payment"}
                    </button>
                    {allowCod ? (
                      <button
                        type="button"
                        onClick={handleSwitchToCod}
                        disabled={retrying || switchingToCod}
                        className={`btn-glass inline-flex items-center justify-center gap-2 ${
                          switchingToCod
                            ? "cursor-wait bg-slate-100 text-slate-400"
                            : "btn-glass-secondary"
                        }`}
                      >
                        {switchingToCod
                          ? "Creating COD order…"
                          : "Switch to cash on delivery"}
                      </button>
                    ) : null}
                  </div>
                </section>
              ) : null}

              <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
                <div className="glass-card rounded-3xl p-5 sm:p-6">
                  <h2 className="text-lg font-bold text-slate-900 border-b border-white/30 pb-4 mb-4">
                    Items Ordered
                  </h2>
                  <div className="space-y-4">
                    {(order.items || []).map((item) => (
                      <div
                        key={item?._id || item?.productId}
                        className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex-1">
                          <p className="text-base font-semibold text-slate-900">
                            {item?.name || "Product"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Quantity:{" "}
                            <span className="font-medium text-slate-700">
                              {item?.quantity || 1}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">
                            {formatCurrencyINR(order?.totalAmount)}
                          </p>
                          {item?.quantity > 1 && (
                            <p className="text-xs text-slate-500">
                              {formatCurrencyINR(order?.totalAmount)} each
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Order timeline
                  </h2>
                  <ol className="mt-5 space-y-4">
                    {timeline.map((step) => (
                      <li key={step.key} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
                            step.completed
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {step.completed ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {step.label}
                          </p>
                          <p className="text-xs text-slate-500">
                            {step.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>

              {summary?.gatewayMessage ? (
                <section className="glass-card rounded-3xl p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Payment gateway response
                  </h2>
                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-700">
                    {summary.gatewayMessage}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </AquaLayout>
  );
};

export default AquaOrderPage;
