import { useEffect, useMemo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import AquaUserDashbordLayout from "./layout/layout";
import orderServiceOperations from "@/services/order";
import { generateInvoicePDF, loadJsPDF } from "@/utils/invoice";
import { useAuth } from "@/context/AuthContext";
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
  Download,
  Loader2,
  Share2,
  ExternalLink,
  Copy,
  PackageCheck,
  ReceiptText,
  Truck,
  ShoppingBag,
} from "lucide-react";

const STATUS_TONES = {
  delivered: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  completed: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  processing: "bg-indigo-100 text-indigo-700 ring-indigo-200",
  packed: "bg-indigo-100 text-indigo-700 ring-indigo-200",
  shipped: "bg-sky-100 text-sky-700 ring-sky-200",
  dispatched: "bg-sky-100 text-sky-700 ring-sky-200",
  pending: "bg-amber-100 text-amber-700 ring-amber-200",
  cancelled: "bg-rose-100 text-rose-700 ring-rose-200",
  refunded: "bg-slate-100 text-slate-700 ring-slate-200",
};

const PAYMENT_TONES = {
  cod: "bg-slate-950 text-white ring-slate-900",
  online: "bg-emerald-500 text-white ring-emerald-500",
};

const PAYMENT_STATUS_TONES = {
  pending: "bg-amber-100 text-amber-700 ring-amber-200",
  completed: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  paid: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  success: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  failed: "bg-rose-100 text-rose-700 ring-rose-200",
};

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
  if (!address || typeof address !== "object") return "";
  return [
    address.street,
    address.landmark,
    address.city,
    address.state,
    address.postalCode,
  ]
    .filter(Boolean)
    .map((part) => `${part}`.trim())
    .join(", ");
};

const toLowerSafe = (value) => `${value || ""}`.toLowerCase();

const getOrderKey = (order) =>
  order?._id || order?.orderId || order?.transactionId;

const getTrackingIdentifier = (order) =>
  order?.transactionId || order?.orderId || order?._id;

const isCashOrder = (order) =>
  [order?.orderType, order?.paymentMethod, order?.paymentChipLabel].some(
    (value) => toLowerSafe(value).includes("cash"),
  );

const buildTrackingPath = (order) => {
  const identifier = getTrackingIdentifier(order);
  if (!identifier) return "/dashboard/orders";
  const safeId = encodeURIComponent(identifier);
  return isCashOrder(order) ? `/order/cod/${safeId}` : `/order/${safeId}`;
};

const buildTrackingLink = (order) => {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_URL || "https://aquakart.co.in";
  return `${baseUrl}${buildTrackingPath(order)}`;
};

const getOrderItemCount = (order) =>
  (order?.items || []).reduce(
    (sum, item) => sum + Number(item?.quantity || 0),
    0,
  );

const getTimelineStatusKey = (orderStatus) => {
  const rawStatus = toLowerSafe(orderStatus);

  if (rawStatus.includes("deliver") || rawStatus.includes("complete")) {
    return "delivered";
  }
  if (rawStatus.includes("out")) {
    return "out_for_delivery";
  }
  if (rawStatus.includes("ship") || rawStatus.includes("dispatch")) {
    return "shipped";
  }
  if (rawStatus.includes("process") || rawStatus.includes("pack")) {
    return "processing";
  }
  return "placed";
};

const getTimelineSteps = (orderStatus) => {
  const statusRank = {
    placed: 0,
    processing: 1,
    packed: 1,
    shipped: 2,
    dispatched: 2,
    "out for delivery": 3,
    out_for_delivery: 3,
    delivered: 4,
    completed: 4,
    cancelled: 0,
  };

  const currentKey = getTimelineStatusKey(orderStatus);
  const currentIndex = statusRank[currentKey] ?? 1;

  return TIMELINE_STEPS.map((step, index) => ({
    ...step,
    completed: index <= currentIndex,
    current: index === currentIndex,
  }));
};

const AquaOrdersPageComponent = () => {
  const { userData } = useSelector((state) => ({ ...state }));
  const { signOut } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [serviceReminders, setServiceReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState("cod");
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [copiedTrackingFor, setCopiedTrackingFor] = useState(null);
  const [sharingFor, setSharingFor] = useState(null);

  const userId = userData?.user?._id;
  const token = userData?.token;

  const [pdfReady, setPdfReady] = useState(false);
  const [generatingFor, setGeneratingFor] = useState(null);

  useEffect(() => {
    loadJsPDF().then(setPdfReady);
  }, []);

  const handleDownloadInvoice = useCallback(
    async (order) => {
      if (!order) return;
      const orderId = getOrderKey(order);
      setGeneratingFor(orderId);
      try {
        if (!pdfReady) {
          const loaded = await loadJsPDF();
          if (!loaded) {
            alert("Invoice generator failed to load. Please refresh.");
            return;
          }
          setPdfReady(true);
        }
        await generateInvoicePDF(order);
      } catch (err) {
        console.error("Invoice generation failed:", err);
        alert(err?.message || "Unable to generate invoice. Please retry.");
      } finally {
        setGeneratingFor(null);
      }
    },
    [pdfReady],
  );

  const handleShareTracking = useCallback(async (order) => {
    if (!order) return;

    const orderKey = getOrderKey(order);
    const trackingLink = buildTrackingLink(order);
    const sharePayload = {
      title: "Aquakart order tracking",
      text: `Track Aquakart order #${
        order?.orderId || order?.transactionId || "order"
      }`,
      url: trackingLink,
    };

    setSharingFor(orderKey);

    try {
      if (navigator?.share) {
        await navigator.share(sharePayload);
      } else if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(trackingLink);
      } else {
        window.prompt("Copy your tracking link", trackingLink);
      }

      setCopiedTrackingFor(orderKey);
      window.setTimeout(() => {
        setCopiedTrackingFor((current) =>
          current === orderKey ? null : current,
        );
      }, 2500);
    } catch (shareError) {
      if (shareError?.name !== "AbortError") {
        try {
          await navigator?.clipboard?.writeText?.(trackingLink);
          setCopiedTrackingFor(orderKey);
        } catch (clipboardError) {
          console.error("Tracking link share failed:", clipboardError);
          window.prompt("Copy your tracking link", trackingLink);
        }
      }
    } finally {
      setSharingFor(null);
    }
  }, []);

  const handleReLogin = () => {
    // Full sign-out (Firebase included) so the next sign-in issues a fresh token.
    signOut({ notify: false });
  };

  useEffect(() => {
    if (!userId || !token) return;

    let isMounted = true;
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      setAuthError(false);
      try {
        const [response, reminderResponse] = await Promise.all([
          orderServiceOperations.getOrdersByUserId(userId, token),
          orderServiceOperations
            .getServiceReminders(token)
            .catch((reminderError) => {
              console.error("Error fetching service reminders:", reminderError);
              return { data: [] };
            }),
        ]);

        if (!isMounted) return;
        const fetchedOrders = Array.isArray(response?.data)
          ? response.data
          : [];
        setOrders(fetchedOrders);
        setServiceReminders(
          Array.isArray(reminderResponse?.data) ? reminderResponse.data : [],
        );
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
      orders
        .map((order) => {
          const paymentLabel = isCashOrder(order)
            ? "Cash on delivery"
            : "Prepaid";
          const lowerPaymentStatus = toLowerSafe(order?.paymentStatus);
          const lowerOrderStatus = toLowerSafe(order?.orderStatus);
          const addressLabel =
            composeAddress(order?.shippingAddress) ||
            composeAddress(order?.billingAddress);

          return {
            ...order,
            paymentChipTone: isCashOrder(order)
              ? PAYMENT_TONES.cod
              : PAYMENT_TONES.online,
            paymentChipLabel: paymentLabel,
            paymentStatusTone:
              PAYMENT_STATUS_TONES[lowerPaymentStatus] ||
              PAYMENT_STATUS_TONES.pending,
            orderStatusTone:
              STATUS_TONES[lowerOrderStatus] || STATUS_TONES.processing,
            addressLabel,
            orderedOn: formatDateLabel(order?.createdAt),
            deliveryEta: formatDateLabel(order?.estimatedDelivery),
            totalLabel: formatCurrency(order?.totalAmount),
            items: Array.isArray(order?.items) ? order.items : [],
            itemCount: getOrderItemCount(order),
            trackingPath: buildTrackingPath({
              ...order,
              paymentChipLabel: paymentLabel,
            }),
          };
        })
        .sort(
          (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0),
        ),
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
      tone: "bg-slate-950 text-white",
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

  const timelineSteps = useMemo(
    () => (trackingOrder ? getTimelineSteps(trackingOrder?.orderStatus) : []),
    [trackingOrder],
  );

  return (
    <AquaUserDashbordLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-white via-emerald-50/80 to-white p-5 shadow-sm sm:p-6">
          <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                <PackageCheck className="h-3.5 w-3.5" />
                Order centre
              </span>
              <h1 className="mt-4 text-2xl font-bold text-slate-950 sm:text-3xl">
                Your orders, invoices & tracking
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Share tracking links, download clean GST invoices, and view
                every order with less clutter.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
              {paymentSummaryCards.map(({ label, value, icon: Icon, tone }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-xs font-medium text-slate-500">
                    {label}
                  </p>
                  <p className="text-xl font-bold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {serviceReminders.length > 0 && (
          <section className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/60 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <CalendarClock className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Product care reminders
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Regeneration and yearly service dates are calculated from your
                  invoice purchase date.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {serviceReminders.flatMap((entry) =>
                entry.reminders.map((reminder) => (
                  <div
                    key={`${entry.invoiceId}-${entry.productName}-${reminder.type}`}
                    className="rounded-2xl border border-emerald-100 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {entry.productName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Invoice #{entry.invoiceNo || "—"}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {reminder.type === "regeneration"
                          ? "Regeneration"
                          : reminder.type === "warranty-expiry"
                            ? "Warranty"
                            : "Annual service"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {reminder.type === "warranty-expiry"
                        ? "Warranty expires"
                        : "Next due"}
                      :{" "}
                      <strong className="text-slate-950">
                        {formatDateLabel(reminder.nextDueDate)}
                      </strong>
                    </p>
                    {reminder.type === "warranty-expiry" &&
                      reminder.reminderDate && (
                        <p className="mt-1 text-xs text-slate-500">
                          WhatsApp notice:{" "}
                          {formatDateLabel(reminder.reminderDate)}
                        </p>
                      )}
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-500">
                        Purchased {formatDateLabel(entry.purchaseDate)}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/invoice/${entry.invoiceId}`)
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        View invoice
                        <ExternalLink
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                )),
              )}
            </div>
          </section>
        )}

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-[1.75rem] border border-slate-100 bg-white/60"
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
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="px-2">
                <p className="text-sm font-semibold text-slate-900">
                  Filter orders
                </p>
                <p className="text-xs text-slate-500">
                  Separate COD and prepaid orders for quick scanning.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("cod")}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "cod"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Banknote className="h-4 w-4" />
                  COD ({resolvedCodOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("online")}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "online"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Wallet className="h-4 w-4" />
                  Prepaid ({resolvedOnlineOrders.length})
                </button>
              </div>
            </div>

            {activeOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                No orders found under this category yet.
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {activeOrders.map((order) => {
                  const orderKey = getOrderKey(order);
                  const isGenerating = generatingFor === orderKey;
                  const isSharing = sharingFor === orderKey;
                  const isCopied = copiedTrackingFor === orderKey;
                  const cardTimeline = getTimelineSteps(order?.orderStatus);

                  return (
                    <article
                      key={orderKey}
                      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-sm ring-1 ring-white/80 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                    >
                      <header className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                              Order ID
                            </p>
                            <h2 className="mt-1 truncate text-xl font-bold">
                              #{order?.orderId || "—"}
                            </h2>
                            <p className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                              <CalendarClock className="h-3.5 w-3.5" />
                              {order.orderedOn}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white/10 px-4 py-3 text-right backdrop-blur">
                            <p className="text-xs text-emerald-100">
                              Paid / Payable
                            </p>
                            <p className="text-lg font-bold">
                              {order.totalLabel}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-5 gap-2">
                          {cardTimeline.map((step) => (
                            <div
                              key={step.key}
                              className={`h-1.5 rounded-full ${
                                step.completed
                                  ? "bg-emerald-300"
                                  : "bg-white/20"
                              }`}
                              title={step.label}
                            />
                          ))}
                        </div>
                      </header>

                      <div className="flex flex-1 flex-col gap-4 p-5">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${order.paymentChipTone}`}
                          >
                            {order.paymentChipLabel}
                          </span>
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${order.paymentStatusTone}`}
                          >
                            {order?.paymentStatus || "Pending"}
                          </span>
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${order.orderStatusTone}`}
                          >
                            {order?.orderStatus || "Processing"}
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Items
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                              {order.itemCount || order.items.length} item(s)
                            </p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              ETA
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                              {order.deliveryEta}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Link
                            </p>
                            <button
                              type="button"
                              onClick={() => handleShareTracking(order)}
                              className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-800"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                              {isCopied ? "Copied" : "Share"}
                            </button>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                              <ShoppingBag className="h-4 w-4" />
                              Items ordered
                            </p>
                            {order.items.length > 2 ? (
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                                +{order.items.length - 2} more
                              </span>
                            ) : null}
                          </div>
                          <ul className="space-y-2">
                            {order.items.slice(0, 2).map((item) => (
                              <li
                                key={item?._id || item?.productId || item?.name}
                                className="flex items-center justify-between gap-3 text-sm"
                              >
                                <span className="line-clamp-1 font-semibold text-slate-800">
                                  {item?.name || "Product"}
                                </span>
                                <span className="whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                                  ×{item?.quantity || 1}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                              Deliver to
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                              {order.addressLabel || "Address not available"}
                            </p>
                          </div>
                        </div>

                        <footer className="mt-auto grid gap-2 sm:grid-cols-3">
                          <button
                            type="button"
                            onClick={() => setTrackingOrder(order)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <Truck className="h-4 w-4" />
                            Track
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push(order.trackingPath)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(order)}
                            disabled={isGenerating}
                            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                              isGenerating
                                ? "cursor-wait bg-slate-100 text-slate-400"
                                : "bg-slate-950 text-white hover:bg-slate-800"
                            }`}
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                PDF
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                                Invoice
                              </>
                            )}
                          </button>
                        </footer>

                        {isSharing ? (
                          <p className="text-center text-xs font-medium text-slate-400">
                            Preparing share link...
                          </p>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {trackingOrder ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 px-4 pb-6 pt-10 backdrop-blur-sm sm:items-center">
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setTrackingOrder(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-700"
              aria-label="Close tracking dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                Tracking order
              </p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    #{trackingOrder?.orderId || "—"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {trackingOrder?.itemCount ||
                      trackingOrder?.items?.length ||
                      0}{" "}
                    item(s) • {trackingOrder?.totalLabel}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/15">
                    Payment: {trackingOrder?.paymentStatus || "Pending"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/15">
                    Method:{" "}
                    {trackingOrder?.orderType ||
                      trackingOrder?.paymentMethod ||
                      trackingOrder?.paymentChipLabel ||
                      "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 p-6 md:p-8">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                      Shareable tracking link
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {buildTrackingLink(trackingOrder)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleShareTracking(trackingOrder)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
                    >
                      <Share2 className="h-4 w-4" />
                      {copiedTrackingFor === getOrderKey(trackingOrder)
                        ? "Copied"
                        : "Share"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(buildTrackingPath(trackingOrder))
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Delivery timeline
                </p>
                <ol className="mt-4 space-y-4">
                  {timelineSteps.map((step) => (
                    <li key={step.key} className="flex items-start gap-4">
                      <span
                        className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full ${
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
                        <p className="text-sm font-bold text-slate-900">
                          {step.label}
                        </p>
                        <p className="text-xs leading-5 text-slate-500">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <CalendarClock className="h-4 w-4" />
                    Estimated delivery
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-800">
                    {formatDateLabel(trackingOrder?.estimatedDelivery)}
                  </p>
                  <p className="text-xs text-slate-500">
                    We will keep you posted if there are any changes.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <MapPin className="h-4 w-4" />
                    Delivering to
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {composeAddress(trackingOrder?.shippingAddress) ||
                      composeAddress(trackingOrder?.billingAddress) ||
                      "Address not available"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator?.clipboard?.writeText?.(
                      buildTrackingLink(trackingOrder),
                    );
                    setCopiedTrackingFor(getOrderKey(trackingOrder));
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <Copy className="h-4 w-4" />
                  Copy link
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(trackingOrder)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <ReceiptText className="h-4 w-4" />
                  Invoice PDF
                </button>
                <button
                  type="button"
                  onClick={() => setTrackingOrder(null)}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
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
