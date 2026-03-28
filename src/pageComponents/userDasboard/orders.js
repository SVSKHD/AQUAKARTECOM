import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import AquaUserDashbordLayout from "./layout/layout";
import orderServiceOperations from "@/services/order";
import {
  ClipboardList,
  Wallet,
  Banknote,
  AlertCircle,
  CalendarClock,
  MapPin,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react";

const STATUS_TONES = {
  delivered: "bg-emerald-100 text-emerald-700",
  processing: "bg-indigo-100 text-indigo-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-rose-100 text-rose-700",
  refunded: "bg-sky-100 text-sky-700",
};

const PAYMENT_TONES = {
  cod: "bg-slate-900 text-white",
  online: "bg-emerald-500 text-white",
};

const PAYMENT_STATUS_TONES = {
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
};

const formatDateLabel = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    return value;
  }
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "₹0";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "₹0";
  return numeric.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
};

const composeAddress = (address = {}) => {
  if (!address || typeof address !== "object") return "—";
  return [address.street, address.city, address.state, address.postalCode]
    .filter(Boolean)
    .map((part) => `${part}`.trim())
    .join(", ");
};

const toLowerSafe = (value) => `${value || ""}`.toLowerCase();

const AquaOrdersPageComponent = () => {
  const { userData } = useSelector((state) => ({ ...state }));
  const dispatch = useDispatch();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState("cod");
  const [trackingOrder, setTrackingOrder] = useState(null);

  const userId = userData?.user?._id;
  const token = userData?.token;

  const handleReLogin = () => {
    dispatch({ type: "LOGOUT", payload: null });
    router.push("/");
  };

  useEffect(() => {
    if (!userId || !token) return;

    let isMounted = true;
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      setAuthError(false);
      try {
        const response = await orderServiceOperations.getOrdersByUserId(
          userId,
          token,
        );

        if (!isMounted) return;
        const fetchedOrders = Array.isArray(response?.data)
          ? response.data
          : [];
        setOrders(fetchedOrders);
      } catch (fetchError) {
        if (!isMounted) return;
        if (fetchError?.authError) {
          setAuthError(true);
          setError(
            fetchError.message ||
              "Your session has expired. Please sign in again.",
          );
        } else {
          setError(
            fetchError?.message ||
              "Unable to load your orders right now. Please try again later.",
          );
        }
        console.error("Error fetching orders:", fetchError);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [userId, token]);

  const resolvedOrders = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        paymentChipTone: toLowerSafe(order?.orderType).includes(
          "cash on delivery",
        )
          ? PAYMENT_TONES.cod
          : PAYMENT_TONES.online,
        paymentChipLabel: toLowerSafe(order?.orderType).includes(
          "cash on delivery",
        )
          ? "Cash on delivery"
          : "Prepaid",
        paymentStatusTone:
          PAYMENT_STATUS_TONES[toLowerSafe(order?.paymentStatus)] ||
          PAYMENT_STATUS_TONES.pending,
        orderStatusTone:
          STATUS_TONES[toLowerSafe(order?.orderStatus)] ||
          STATUS_TONES.processing,
        addressLabel:
          composeAddress(order?.shippingAddress) ||
          composeAddress(order?.billingAddress),
        orderedOn: formatDateLabel(order?.createdAt),
        deliveryEta: formatDateLabel(order?.estimatedDelivery),
        totalLabel: formatCurrency(order?.totalAmount),
        items: Array.isArray(order?.items) ? order.items : [],
      })),
    [orders],
  );

  const resolvedCodOrders = useMemo(
    () =>
      resolvedOrders.filter((order) =>
        toLowerSafe(order?.paymentChipLabel).includes("cash"),
      ),
    [resolvedOrders],
  );

  const resolvedOnlineOrders = useMemo(
    () =>
      resolvedOrders.filter(
        (order) => !toLowerSafe(order?.paymentChipLabel).includes("cash"),
      ),
    [resolvedOrders],
  );

  const pendingPaymentCount = useMemo(
    () =>
      resolvedOrders.filter(
        (order) => toLowerSafe(order?.paymentStatus) === "pending",
      ).length,
    [resolvedOrders],
  );

  useEffect(() => {
    if (resolvedCodOrders.length === 0 && resolvedOnlineOrders.length > 0) {
      setActiveTab("online");
    } else if (
      resolvedOnlineOrders.length === 0 &&
      resolvedCodOrders.length > 0 &&
      activeTab !== "cod"
    ) {
      setActiveTab("cod");
    }
  }, [resolvedCodOrders.length, resolvedOnlineOrders.length, activeTab]);

  const paymentSummaryCards = [
    {
      label: "Total orders",
      value: resolvedOrders.length,
      icon: ClipboardList,
      tone: "bg-slate-100 text-slate-700",
    },
    {
      label: "Cash on delivery",
      value: resolvedCodOrders.length,
      icon: Banknote,
      tone: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Online payments",
      value: resolvedOnlineOrders.length,
      icon: Wallet,
      tone: "bg-indigo-100 text-indigo-700",
    },
    {
      label: "Payment pending",
      value: pendingPaymentCount,
      icon: AlertCircle,
      tone: "bg-amber-100 text-amber-700",
    },
  ];

  const activeOrders =
    activeTab === "online" ? resolvedOnlineOrders : resolvedCodOrders;

  const timelineSteps = useMemo(() => {
    if (!trackingOrder) return [];

    const TIMELINE_STEPS = [
      {
        key: "placed",
        label: "Order placed",
        description: "We have received your order details",
      },
      {
        key: "processing",
        label: "Processing",
        description: "Order is being confirmed and packed",
      },
      {
        key: "shipped",
        label: "Shipped",
        description: "Package handed over to delivery partner",
      },
      {
        key: "out_for_delivery",
        label: "Out for delivery",
        description: "Courier is on the way to you",
      },
      {
        key: "delivered",
        label: "Delivered",
        description: "Order delivered successfully",
      },
    ];

    const statusRank = {
      placed: 0,
      processing: 1,
      packed: 1,
      shipped: 2,
      dispatched: 2,
      "out for delivery": 3,
      out_for_delivery: 3,
      delivered: 4,
      cancelled: 4,
    };

    const rawStatus = toLowerSafe(trackingOrder?.orderStatus);
    let statusKey = "placed";

    if (rawStatus.includes("deliver")) {
      statusKey = "delivered";
    } else if (rawStatus.includes("out")) {
      statusKey = "out_for_delivery";
    } else if (rawStatus.includes("ship") || rawStatus.includes("dispatch")) {
      statusKey = "shipped";
    } else if (rawStatus.includes("process") || rawStatus.includes("pack")) {
      statusKey = "processing";
    }

    const currentIndex = statusRank[statusKey] ?? 1;

    return TIMELINE_STEPS.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  }, [trackingOrder]);

  return (
    <AquaUserDashbordLayout>
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold text-slate-900">
              Your orders
            </h1>
            <p className="text-sm text-slate-500">
              Track payments, delivery progress, and keep an eye on pending
              actions.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {paymentSummaryCards.map(({ label, value, icon: Icon, tone }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${tone}`}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-3xl border border-slate-100 bg-white/60"
              />
            ))}
          </div>
        ) : error ? (
          <div className="glass-tint-rose rounded-3xl p-8 text-center">
            <p className="font-medium text-rose-700">{error}</p>
            {authError ? (
              <button
                type="button"
                onClick={handleReLogin}
                className="btn-glass btn-glass-primary mt-4"
              >
                Sign in again
              </button>
            ) : (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn-glass btn-glass-secondary mt-4"
              >
                Retry
              </button>
            )}
          </div>
        ) : resolvedOrders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
            You haven’t placed any orders yet. Explore our catalogue to get
            started.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("cod")}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  activeTab === "cod"
                    ? "bg-emerald-500 text-white focus:ring-emerald-500"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 focus:ring-slate-300"
                }`}
              >
                Cash on delivery ({resolvedCodOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("online")}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  activeTab === "online"
                    ? "bg-indigo-500 text-white focus:ring-indigo-500"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 focus:ring-slate-300"
                }`}
              >
                Prepaid / gateway ({resolvedOnlineOrders.length})
              </button>
            </div>

            {activeOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                No orders found under this category yet.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
                {activeOrders.map((order) => (
                  <article
                    key={order?._id || order?.orderId}
                    className="flex h-full flex-col gap-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
                  >
                    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Order ID
                        </p>
                        <h2 className="text-lg font-semibold text-slate-900">
                          #{order?.orderId || "—"}
                        </h2>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize ${order.paymentChipTone}`}
                        >
                          {order.paymentChipLabel}
                        </span>
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize ${order.paymentStatusTone}`}
                        >
                          {order?.paymentStatus || "Pending"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize ${order.orderStatusTone}`}
                        >
                          {order?.orderStatus || "Processing"}
                        </span>
                      </div>
                    </header>

                    <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Items (
                        {order.items.reduce(
                          (sum, item) => sum + (item?.quantity || 0),
                          0,
                        )}
                        )
                      </p>
                      <ul className="space-y-2">
                        {order.items.slice(0, 3).map((item) => (
                          <li
                            key={item?._id || item?.productId}
                            className="flex items-center justify-between text-sm text-slate-600"
                          >
                            <span className="line-clamp-1 pr-3 font-medium text-slate-700">
                              {item?.name || "Product"}
                            </span>
                            <span className="whitespace-nowrap text-slate-500">
                              ×{item?.quantity || 1}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {order.items.length > 3 ? (
                        <p className="text-xs text-slate-500">
                          + {order.items.length - 3} more item(s)
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <ClipboardList className="h-3.5 w-3.5" /> Ordered on
                        </span>
                        <span className="text-sm font-medium text-slate-700">
                          {order.orderedOn}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <CalendarClock className="h-3.5 w-3.5" /> ETA
                        </span>
                        <span className="text-sm font-medium text-slate-700">
                          {order.deliveryEta}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <MapPin className="h-3.5 w-3.5" /> Deliver to
                      </span>
                      <span className="text-sm text-slate-600">
                        {order.addressLabel}
                      </span>
                    </div>

                    <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-semibold text-slate-900">
                        Total payable:{" "}
                        <span className="text-lg">{order.totalLabel}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setTrackingOrder(order)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          Track order
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Download invoice
                        </button>
                      </div>
                    </footer>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {trackingOrder ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-4 pb-6 pt-10 sm:items-center">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setTrackingOrder(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
              aria-label="Close tracking dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col gap-6 p-6 md:p-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tracking order
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">
                    #{trackingOrder?.orderId || "—"}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    Payment: {trackingOrder?.paymentStatus || "Pending"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    Method:{" "}
                    {trackingOrder?.orderType ||
                      trackingOrder?.paymentMethod ||
                      "—"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Delivery timeline
                </p>
                <ol className="mt-4 space-y-4">
                  {timelineSteps.map((step) => (
                    <li key={step.key} className="flex items-start gap-4">
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estimated delivery
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDateLabel(trackingOrder?.estimatedDelivery)}
                  </p>
                  <p className="text-xs text-slate-500">
                    We will keep you posted if there are any changes.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Delivering to
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {composeAddress(trackingOrder?.shippingAddress) ||
                      composeAddress(trackingOrder?.billingAddress)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Share tracking link
                </button>
                <button
                  type="button"
                  onClick={() => setTrackingOrder(null)}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AquaUserDashbordLayout>
  );
};

export default AquaOrdersPageComponent;
