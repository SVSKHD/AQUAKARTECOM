import { useMemo, useState, useEffect } from "react";
import AquaLayout from "@/components/Layout/Layout";
import orderServiceOperations from "@/services/order";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
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
import priceUtils from "@/utils/price";

const INVOICE_WATERMARK_URL =
  "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png";
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
      console.log("Fetching order with ID:", id);
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
    if (typeof window === "undefined") return;
    if (window.jspdf?.jsPDF) {
      setIsPdfReady(true);
      return;
    }

    const scriptId = "jspdf-cdn";
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      if (existingScript.getAttribute("data-loaded") === "true") {
        setIsPdfReady(true);
      } else {
        existingScript.addEventListener("load", () => setIsPdfReady(true), {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.async = true;
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      setIsPdfReady(true);
    };
    script.onerror = () => {
      AquaToast({
        message:
          "Invoice generator failed to load. Please refresh and try again.",
        type: "error",
      });
    };
    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
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
    () => roundToTwo(orderSubtotal + shippingCharge),
    [orderSubtotal, shippingCharge],
  );

  const loadImageAsDataURL = async (url) =>
    new Promise((resolve) => {
      if (!url) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const context = canvas.getContext("2d");
          context.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (error) {
          console.error("Failed to convert image to data URL", error);
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });

  const composeAddressLines = (address) => {
    if (!address) return [];
    const { fullName, street, landmark, city, state, postalCode, country } =
      address;
    return [
      fullName,
      street,
      landmark,
      [city, state].filter(Boolean).join(", "),
      postalCode,
      country,
    ].filter(Boolean);
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    if (typeof window === "undefined") return;
    const jsPDFConstructor = window.jspdf?.jsPDF;

    if (!jsPDFConstructor) {
      AquaToast({
        message: "Invoice generator is still preparing. Please try again.",
        type: "warning",
      });
      return;
    }

    try {
      setIsGeneratingInvoice(true);
      const formatAmount = (value) =>
        formatCurrencyINR(roundToTwo(toNumber(value, 0)));
      const doc = new jsPDFConstructor({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 48;
      const baseFont = "helvetica";

      const watermark = await loadImageAsDataURL(INVOICE_WATERMARK_URL);
      if (watermark) {
        try {
          if (doc.GState) {
            const faded = new doc.GState({ opacity: 0.06 });
            doc.setGState(faded);
            doc.addImage(
              watermark,
              "PNG",
              pageWidth / 2 - 180,
              pageHeight / 2 - 180,
              360,
              360,
            );
            doc.setGState(new doc.GState({ opacity: 1 }));
          } else {
            doc.addImage(
              watermark,
              "PNG",
              pageWidth / 2 - 180,
              pageHeight / 2 - 180,
              360,
              360,
            );
          }
        } catch (error) {
          console.error("Failed to add watermark", error);
        }
      }

      doc.setFillColor(43, 108, 176);
      doc.rect(0, 0, pageWidth, 96, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont(baseFont, "bold");
      doc.setFontSize(26);
      doc.text("Aquakart", marginX, 54);
      doc.setFont(baseFont, "normal");
      doc.setFontSize(12);
      doc.text("GST: 36AJOPH6387A1Z2", marginX, 72);
      doc.text("https://aquakart.co.in", marginX, 88);
      doc.setFont(baseFont, "bold");
      doc.setFontSize(26);
      doc.text("Invoice", pageWidth - marginX, 60, { align: "right" });

      doc.setTextColor(30, 41, 59);
      let cursorY = 124;
      doc.setFontSize(13);
      doc.setFont(baseFont, "bold");
      doc.text("Invoice details", marginX, cursorY);
      cursorY += 20;
      doc.setFont(baseFont, "normal");
      doc.setFontSize(11);

      const invoiceInfo = [
        {
          label: "Invoice #",
          value: order?.orderId || "-",
        },
        {
          label: "Invoice date",
          value: dayjs(order?.createdAt).format("DD MMM YYYY"),
        },
      ];

      if (order?.transactionId) {
        invoiceInfo.push({
          label: "Transaction ID",
          value: order.transactionId,
        });
      }

      invoiceInfo.push({
        label: "Payment method",
        value: "Cash on Delivery",
      });

      invoiceInfo.forEach((line) => {
        doc.text(`${line.label}: ${line.value}`, marginX, cursorY);
        cursorY += 16;
      });
      cursorY += 12;

      doc.setFontSize(13);
      doc.setFont(baseFont, "bold");
      doc.text("Billed to", marginX, cursorY);
      doc.text("Deliver to", marginX + 220, cursorY);
      cursorY += 16;
      doc.setFontSize(11);
      doc.setFont(baseFont, "bold");
      const billingLines = [
        order?.customerName || order?.user?.name,
        order?.email,
        order?.phone,
      ].filter(Boolean);
      const shippingLines = composeAddressLines(order?.shippingAddress);

      const writeLines = (lines, x, y, lineGap = 16) => {
        let offsetY = y;
        lines.forEach((line) => {
          doc.text(line, x, offsetY);
          offsetY += lineGap;
        });
        return offsetY;
      };

      const billingBottom = writeLines(billingLines, marginX, cursorY);
      const shippingBottom = writeLines(shippingLines, marginX + 220, cursorY);
      cursorY = Math.max(billingBottom, shippingBottom) + 24;

      const tableWidth = pageWidth - marginX * 2;
      const headerHeight = 30;
      const rowLineHeight = 16;
      const indexX = marginX + 16;
      const itemX = marginX + 56;
      const qtyX = marginX + tableWidth - 210;
      const unitPriceX = marginX + tableWidth - 170;
      const basePriceX = marginX + tableWidth - 120;
      const gstPriceX = marginX + tableWidth - 70;
      const totalX = marginX + tableWidth - 20;
      const descriptionWidth = qtyX - itemX - 24;

      const drawTableHeader = (y) => {
        doc.setFillColor(79, 70, 229);
        doc.setTextColor(255, 255, 255);
        doc.roundedRect(marginX, y, tableWidth, headerHeight, 8, 8, "F");
        doc.setFontSize(11);
        doc.text("#", indexX, y + 19);
        doc.text("Item description", itemX, y + 19);
        doc.text("Qty", qtyX, y + 19, { align: "right" });

        doc.text("Line total", totalX, y + 19, { align: "right" });
        doc.setTextColor(30, 41, 59);
        return y + headerHeight + 6;
      };

      cursorY = drawTableHeader(cursorY);

      const ensureSpace = (requiredHeight) => {
        if (cursorY + requiredHeight > pageHeight - 120) {
          doc.addPage();
          doc.setFillColor(43, 108, 176);
          doc.rect(0, 0, pageWidth, 40, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(12);
          doc.text("Aquakart Invoice", marginX, 26);
          doc.setTextColor(30, 41, 59);
          cursorY = 80;
          cursorY = drawTableHeader(cursorY);
        }
      };

      order?.items?.forEach((product, index) => {
        const name =
          product?.name || product?.productName || `Item ${index + 1}`;
        const qty = toNumber(product?.quantity, 1);
        const unitPrice = toNumber(product?.price, 0);
        const lineTotal = roundToTwo(qty * unitPrice);
        const baseLine = roundToTwo(lineTotal / (1 + GST_RATE));
        const gstLine = roundToTwo(lineTotal - baseLine);
        const nameLines = doc.splitTextToSize(
          name,
          Math.max(descriptionWidth, 120),
        );
        const rowHeight = Math.max(nameLines.length * rowLineHeight + 16, 54);

        ensureSpace(rowHeight + 4);

        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(marginX, cursorY, tableWidth, rowHeight, 6, 6, "S");
        doc.setFontSize(11);
        doc.setFont(baseFont, "normal");
        const textTop = cursorY + 22;
        doc.text(String(index + 1).padStart(2, "0"), indexX, textTop);
        doc.text(nameLines, itemX, textTop, {
          lineHeightFactor: rowLineHeight / 11,
        });
        doc.text(String(qty), qtyX, textTop, { align: "right" });

        doc.text(`INR ${formatAmount(lineTotal)}`, totalX, textTop, {
          align: "right",
        });

        cursorY += rowHeight + 8;
      });

      ensureSpace(180);

      const summaryBoxY = cursorY + 10;
      const summaryBoxHeight = 150;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(
        marginX,
        summaryBoxY,
        tableWidth / 2 - 12,
        summaryBoxHeight,
        10,
        10,
        "F",
      );
      doc.roundedRect(
        marginX + tableWidth / 2 + 12,
        summaryBoxY,
        tableWidth / 2 - 12,
        summaryBoxHeight,
        10,
        10,
        "F",
      );

      doc.setFontSize(12);
      doc.setFont(baseFont, "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("Delivery details", marginX + 18, summaryBoxY + 20);
      doc.setFontSize(11);
      doc.setFont(baseFont, "normal");
      const shippingLinesForBox = [
        ...(shippingLines.length ? shippingLines : ["N/A"]),
        order?.phone ? `Phone: ${order.phone}` : null,
        order?.email ? `Email: ${order.email}` : null,
      ].filter(Boolean);
      writeLines(shippingLinesForBox, marginX + 18, summaryBoxY + 40);

      doc.setFontSize(12);
      doc.setFont(baseFont, "bold");
      doc.text(
        "Invoice summary",
        marginX + tableWidth / 2 + 30,
        summaryBoxY + 20,
      );
      doc.setFontSize(11);
      doc.setFont(baseFont, "normal");
      const summaryLines = [
        {
          label: "Product price",
          value: formatAmount(orderSubtotal),
        },
        {
          label: `  Incl. GST (${Math.round(GST_RATE * 100)}%)`,
          value: formatAmount(itemsGstTotal),
        },
        {
          label: "Shipping",
          value: formatAmount(shippingCharge),
        },
        {
          label: "Total to pay on delivery",
          value: formatAmount(payableTotal),
          highlight: true,
        },
      ];

      let summaryLineY = summaryBoxY + 40;
      summaryLines.forEach((line) => {
        if (line.highlight) {
          doc.setFontSize(12);
          doc.setFont(baseFont, "bold");
        } else {
          doc.setFontSize(11);
          doc.setFont(baseFont, "normal");
        }
        doc.text(line.label, marginX + tableWidth / 2 + 30, summaryLineY);
        doc.text(line.value, marginX + tableWidth - 30, summaryLineY, {
          align: "right",
        });
        summaryLineY += line.highlight ? 20 : 16;
      });
      doc.setFont(baseFont, "normal");

      doc.setFontSize(10);
      doc.setFont(baseFont, "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(
        "This is a system-generated invoice and does not require a physical signature.",
        marginX,
        pageHeight - 50,
      );
      doc.text(
        "For support, reach us at support@aquakart.co.in or +91 9014774667",
        marginX,
        pageHeight - 35,
      );

      doc.save(
        `Aquakart-invoice-${order?.orderId || order?.transactionId || "cod"}.pdf`,
      );
      AquaToast({
        message: "Invoice downloaded successfully.",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to generate invoice PDF", error);
      AquaToast({
        message: "Unable to generate the invoice right now. Please retry.",
        type: "error",
      });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

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
                        {formatCurrencyINR(product.price * product.quantity)}
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
                      {formatCurrencyINR(orderSubtotal)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <dt className="pl-3">
                      Incl. GST ({Math.round(GST_RATE * 100)}%)
                    </dt>
                    <dd>{formatCurrencyINR(itemsGstTotal)}</dd>
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
