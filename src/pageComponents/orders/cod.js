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

      // ── Helpers ──────────────────────────────────────────
      const fmt = (v) => {
        const n = roundToTwo(toNumber(v, 0));
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2,
        }).format(n);
      };

      const doc = new jsPDFConstructor({ unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth(); // 595
      const H = doc.internal.pageSize.getHeight(); // 842
      const M = 44; // margin
      const TW = W - M * 2; // table width
      const F = "helvetica";

      // ── Colours ──────────────────────────────────────────
      const BRAND = [16, 185, 129]; // emerald-500
      const BRAND_DARK = [6, 95, 70]; // emerald-900
      const SLATE_900 = [15, 23, 42];
      const SLATE_600 = [71, 85, 105];
      const SLATE_400 = [148, 163, 184];
      const STRIPE_BG = [248, 250, 252];
      const WHITE = [255, 255, 255];

      // ── Watermark ────────────────────────────────────────
      const watermark = await loadImageAsDataURL(INVOICE_WATERMARK_URL);
      if (watermark) {
        try {
          if (doc.GState) {
            doc.setGState(new doc.GState({ opacity: 0.04 }));
            doc.addImage(watermark, "PNG", W / 2 - 150, H / 2 - 150, 300, 300);
            doc.setGState(new doc.GState({ opacity: 1 }));
          }
        } catch (_) {}
      }

      // ── Header band ──────────────────────────────────────
      doc.setFillColor(...BRAND);
      doc.rect(0, 0, W, 88, "F");

      // Accent stripe
      doc.setFillColor(...BRAND_DARK);
      doc.rect(0, 88, W, 4, "F");

      // Brand text
      doc.setTextColor(...WHITE);
      doc.setFont(F, "bold");
      doc.setFontSize(28);
      doc.text("Aquakart", M, 42);
      doc.setFont(F, "normal");
      doc.setFontSize(10);
      doc.text("Premium Water Solutions", M, 58);
      doc.setFontSize(9);
      doc.text("GSTIN: 36AJOPH6387A1Z2  |  aquakart.co.in", M, 74);

      // INVOICE badge
      doc.setFont(F, "bold");
      doc.setFontSize(11);
      doc.setFillColor(...WHITE);
      const badgeW = 80;
      const badgeH = 28;
      doc.roundedRect(W - M - badgeW, 30, badgeW, badgeH, 14, 14, "F");
      doc.setTextColor(...BRAND_DARK);
      doc.text("INVOICE", W - M - badgeW / 2, 49, { align: "center" });

      // ── Invoice meta grid ────────────────────────────────
      let Y = 112;
      doc.setTextColor(...SLATE_900);
      doc.setFont(F, "bold");
      doc.setFontSize(11);

      const metaLeft = [
        ["Invoice #", order?.orderId || "-"],
        ["Date", dayjs(order?.createdAt).format("DD MMM YYYY")],
        ["Transaction", order?.transactionId || "-"],
      ];
      const metaRight = [
        ["Payment", "Cash on Delivery"],
        ["Status", order?.orderStatus || "Processing"],
        ["Currency", "INR (₹)"],
      ];

      const drawMeta = (items, startX, startY) => {
        let y = startY;
        items.forEach(([label, value]) => {
          doc.setFont(F, "normal");
          doc.setFontSize(8);
          doc.setTextColor(...SLATE_400);
          doc.text(label.toUpperCase(), startX, y);
          doc.setFont(F, "bold");
          doc.setFontSize(10);
          doc.setTextColor(...SLATE_900);
          doc.text(value, startX, y + 13);
          y += 30;
        });
        return y;
      };

      drawMeta(metaLeft, M, Y);
      drawMeta(metaRight, W / 2 + 20, Y);
      Y += 30 * metaLeft.length + 8;

      // ── Divider ──────────────────────────────────────────
      doc.setDrawColor(...SLATE_400);
      doc.setLineWidth(0.5);
      doc.line(M, Y, W - M, Y);
      Y += 16;

      // ── Billing / Shipping ───────────────────────────────
      const drawAddressBlock = (title, lines, x, y) => {
        doc.setFont(F, "bold");
        doc.setFontSize(9);
        doc.setTextColor(...BRAND);
        doc.text(title.toUpperCase(), x, y);
        doc.setFont(F, "normal");
        doc.setFontSize(10);
        doc.setTextColor(...SLATE_900);
        let offsetY = y + 16;
        lines.forEach((line) => {
          doc.text(String(line), x, offsetY);
          offsetY += 14;
        });
        return offsetY;
      };

      const billingLines = [
        order?.customerName || order?.user?.name || "Customer",
        order?.email,
        order?.phone,
      ].filter(Boolean);
      const shippingLines = composeAddressLines(order?.shippingAddress);
      if (order?.phone) shippingLines.push(`Ph: ${order.phone}`);

      const bY = drawAddressBlock("Bill To", billingLines, M, Y);
      const sY = drawAddressBlock("Ship To", shippingLines, W / 2 + 20, Y);
      Y = Math.max(bY, sY) + 16;

      // ── Table Header ─────────────────────────────────────
      const colX = {
        idx: M + 12,
        item: M + 40,
        qty: M + TW - 180,
        rate: M + TW - 120,
        gst: M + TW - 60,
        total: M + TW - 4,
      };
      const itemDescW = colX.qty - colX.item - 16;

      const drawTableHead = (y) => {
        doc.setFillColor(...BRAND);
        doc.roundedRect(M, y, TW, 28, 6, 6, "F");
        doc.setTextColor(...WHITE);
        doc.setFont(F, "bold");
        doc.setFontSize(9);
        doc.text("#", colX.idx, y + 18);
        doc.text("ITEM", colX.item, y + 18);
        doc.text("QTY", colX.qty, y + 18, { align: "right" });
        doc.text("RATE", colX.rate, y + 18, { align: "right" });
        doc.text("GST", colX.gst, y + 18, { align: "right" });
        doc.text("AMOUNT", colX.total, y + 18, { align: "right" });
        doc.setTextColor(...SLATE_900);
        return y + 34;
      };

      Y = drawTableHead(Y);

      // ── Table Rows ───────────────────────────────────────
      const ensurePage = (need) => {
        if (Y + need > H - 100) {
          doc.addPage();
          // Mini header
          doc.setFillColor(...BRAND);
          doc.rect(0, 0, W, 36, "F");
          doc.setTextColor(...WHITE);
          doc.setFont(F, "bold");
          doc.setFontSize(10);
          doc.text("Aquakart Invoice (continued)", M, 24);
          doc.setTextColor(...SLATE_900);
          Y = 56;
          Y = drawTableHead(Y);
        }
      };

      order?.items?.forEach((product, i) => {
        const name = product?.name || product?.productName || `Item ${i + 1}`;
        const qty = toNumber(product?.quantity, 1);
        const unitPrice = toNumber(product?.price, 0);
        const lineTotal = roundToTwo(qty * unitPrice);
        const baseAmt = roundToTwo(lineTotal / (1 + GST_RATE));
        const gstAmt = roundToTwo(lineTotal - baseAmt);
        const nameLines = doc.splitTextToSize(name, Math.max(itemDescW, 100));
        const rowH = Math.max(nameLines.length * 14 + 18, 40);

        ensurePage(rowH + 6);

        // Alternate row striping
        if (i % 2 === 1) {
          doc.setFillColor(...STRIPE_BG);
          doc.roundedRect(M, Y, TW, rowH, 4, 4, "F");
        }

        const textY = Y + 18;
        doc.setFont(F, "normal");
        doc.setFontSize(10);
        doc.setTextColor(...SLATE_600);
        doc.text(String(i + 1).padStart(2, "0"), colX.idx, textY);
        doc.setTextColor(...SLATE_900);
        doc.text(nameLines, colX.item, textY, { lineHeightFactor: 1.3 });
        doc.text(String(qty), colX.qty, textY, { align: "right" });
        doc.setTextColor(...SLATE_600);
        doc.text(fmt(unitPrice), colX.rate, textY, { align: "right" });
        doc.setFontSize(9);
        doc.text(fmt(gstAmt), colX.gst, textY, { align: "right" });
        doc.setFontSize(10);
        doc.setFont(F, "bold");
        doc.setTextColor(...SLATE_900);
        doc.text(fmt(lineTotal), colX.total, textY, { align: "right" });

        Y += rowH + 2;
      });

      // ── Summary Section ──────────────────────────────────
      ensurePage(200);
      Y += 12;

      // Left box: Delivery details
      const boxW = TW / 2 - 10;
      const boxH = 140;
      doc.setFillColor(240, 253, 244); // emerald-50
      doc.roundedRect(M, Y, boxW, boxH, 10, 10, "F");
      doc.setDrawColor(167, 243, 208); // emerald-300
      doc.setLineWidth(0.8);
      doc.roundedRect(M, Y, boxW, boxH, 10, 10, "S");

      doc.setFont(F, "bold");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND_DARK);
      doc.text("DELIVERY DETAILS", M + 16, Y + 22);
      doc.setFont(F, "normal");
      doc.setFontSize(9);
      doc.setTextColor(...SLATE_600);
      const deliveryLines = [
        ...(shippingLines.length ? shippingLines : ["N/A"]),
        order?.email ? `Email: ${order.email}` : null,
      ].filter(Boolean);
      let dY = Y + 40;
      deliveryLines.forEach((line) => {
        doc.text(String(line), M + 16, dY);
        dY += 14;
      });

      // Right box: Invoice summary
      const rBoxX = M + boxW + 20;
      doc.setFillColor(...STRIPE_BG);
      doc.roundedRect(rBoxX, Y, boxW, boxH, 10, 10, "F");
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.8);
      doc.roundedRect(rBoxX, Y, boxW, boxH, 10, 10, "S");

      doc.setFont(F, "bold");
      doc.setFontSize(10);
      doc.setTextColor(...SLATE_900);
      doc.text("INVOICE SUMMARY", rBoxX + 16, Y + 22);

      const summaryData = [
        { label: "Product price", value: fmt(orderSubtotal) },
        {
          label: `Incl. GST (${Math.round(GST_RATE * 100)}%)`,
          value: fmt(itemsGstTotal),
          muted: true,
        },
        {
          label: "Shipping",
          value: shippingCharge > 0 ? fmt(shippingCharge) : "FREE",
        },
      ];

      let sLineY = Y + 42;
      summaryData.forEach((row) => {
        doc.setFont(F, "normal");
        doc.setFontSize(row.muted ? 8 : 9);
        const tc = row.muted ? SLATE_400 : SLATE_600;
        doc.setTextColor(tc[0], tc[1], tc[2]);
        doc.text(
          row.muted ? `    ${row.label}` : row.label,
          rBoxX + 16,
          sLineY,
        );
        doc.text(row.value, rBoxX + boxW - 16, sLineY, { align: "right" });
        sLineY += row.muted ? 14 : 16;
      });

      // Divider line inside summary box
      doc.setDrawColor(...BRAND);
      doc.setLineWidth(1);
      doc.line(rBoxX + 16, sLineY + 2, rBoxX + boxW - 16, sLineY + 2);
      sLineY += 16;

      // Total
      doc.setFont(F, "bold");
      doc.setFontSize(12);
      doc.setTextColor(...BRAND_DARK);
      doc.text("TOTAL TO PAY", rBoxX + 16, sLineY);
      doc.text(fmt(payableTotal), rBoxX + boxW - 16, sLineY, {
        align: "right",
      });

      // ── Footer ───────────────────────────────────────────
      // Footer divider
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(M, H - 68, W - M, H - 68);

      doc.setFont(F, "normal");
      doc.setFontSize(8);
      doc.setTextColor(...SLATE_400);
      doc.text(
        "This is a computer-generated invoice and does not require a signature.",
        M,
        H - 50,
      );
      doc.text(
        "Aquakart  |  support@aquakart.co.in  |  +91 9014774667  |  aquakart.co.in",
        M,
        H - 36,
      );

      // "Thank you" on right
      doc.setFont(F, "bold");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND);
      doc.text("Thank you for your order!", W - M, H - 42, { align: "right" });

      // ── Save ─────────────────────────────────────────────
      doc.save(
        `Aquakart-Invoice-${order?.orderId || order?.transactionId || "COD"}.pdf`,
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
