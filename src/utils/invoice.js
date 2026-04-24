const INVOICE_WATERMARK_URL =
  "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png";
const GST_RATE = 0.18;

const roundToTwo = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const resolveAmountPaid = (order, fallbackAmount) => {
  const directCandidates = [
    order?.amountPaid,
    order?.paidAmount,
    order?.totalPaid,
    order?.finalAmount,
    order?.totalAmount,
  ];

  for (const candidate of directCandidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return roundToTwo(parsed);
    }
  }

  return roundToTwo(toNumber(fallbackAmount, 0));
};

const fmt = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(roundToTwo(toNumber(v, 0)));

const loadImageAsDataURL = (url) =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (_) {
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

/**
 * Generate and download an Aquakart invoice PDF for a given order.
 * Requires jsPDF to be loaded on window (window.jspdf.jsPDF).
 * @param {object} order - The order object with items, addresses, totals, etc.
 * @returns {Promise<void>}
 */
export const generateInvoicePDF = async (order) => {
  if (!order) throw new Error("No order data provided");
  if (typeof window === "undefined") throw new Error("Not in browser");

  const jsPDFConstructor = window.jspdf?.jsPDF;
  if (!jsPDFConstructor) throw new Error("Invoice generator not loaded yet");

  const doc = new jsPDFConstructor({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 44;
  const TW = W - M * 2;
  const F = "helvetica";

  // Colours
  const BRAND = [16, 185, 129];
  const BRAND_DARK = [6, 95, 70];
  const SLATE_900 = [15, 23, 42];
  const SLATE_600 = [71, 85, 105];
  const SLATE_400 = [148, 163, 184];
  const STRIPE_BG = [248, 250, 252];
  const WHITE = [255, 255, 255];

  // Compute totals
  const orderSubtotal = roundToTwo(
    (order.items || []).reduce((sum, item) => {
      return sum + toNumber(item?.price) * toNumber(item?.quantity, 1);
    }, 0),
  );

  const itemsGstTotal = roundToTwo(
    (order.items || []).reduce((sum, item) => {
      const gross = roundToTwo(
        toNumber(item?.price) * toNumber(item?.quantity, 1),
      );
      return sum + roundToTwo(gross - roundToTwo(gross / (1 + GST_RATE)));
    }, 0),
  );

  const shippingCharge = roundToTwo(
    toNumber(
      order.shippingCost ??
        order.shippingCharge ??
        order.deliveryCharge ??
        order.shipping,
      0,
    ),
  );

  const amountPaid = resolveAmountPaid(order, orderSubtotal + shippingCharge);
  const payableTotal = amountPaid;
  const isCOD = `${order.orderType || order.paymentMethod || ""}`
    .toLowerCase()
    .includes("cash");

  // Watermark
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

  // Header band
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, W, 88, "F");
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 88, W, 4, "F");

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
  doc.roundedRect(W - M - badgeW, 30, badgeW, 28, 14, 14, "F");
  doc.setTextColor(...BRAND_DARK);
  doc.text("INVOICE", W - M - badgeW / 2, 49, { align: "center" });

  // Invoice meta grid
  let Y = 112;
  const metaLeft = [
    ["Invoice #", order?.orderId || "-"],
    [
      "Date",
      order?.createdAt
        ? new Date(order.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "-",
    ],
    ["Transaction", order?.transactionId || "-"],
  ];
  const metaRight = [
    ["Payment", isCOD ? "Cash on Delivery" : "Online / Gateway"],
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
      doc.text(String(value), startX, y + 13);
      y += 30;
    });
    return y;
  };

  drawMeta(metaLeft, M, Y);
  drawMeta(metaRight, W / 2 + 20, Y);
  Y += 30 * metaLeft.length + 8;

  // Divider
  doc.setDrawColor(...SLATE_400);
  doc.setLineWidth(0.5);
  doc.line(M, Y, W - M, Y);
  Y += 16;

  // Billing / Shipping
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

  // Table
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

  const ensurePage = (need) => {
    if (Y + need > H - 100) {
      doc.addPage();
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

  (order?.items || []).forEach((product, i) => {
    const name = product?.name || product?.productName || `Item ${i + 1}`;
    const qty = toNumber(product?.quantity, 1);
    const unitPrice = toNumber(product?.price, 0);
    const lineTotal = roundToTwo(qty * unitPrice);
    const gstAmt = roundToTwo(
      lineTotal - roundToTwo(lineTotal / (1 + GST_RATE)),
    );
    const nameLines = doc.splitTextToSize(name, Math.max(itemDescW, 100));
    const rowH = Math.max(nameLines.length * 14 + 18, 40);

    ensurePage(rowH + 6);

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

  // Summary section
  ensurePage(200);
  Y += 12;

  const boxW = TW / 2 - 10;
  const boxH = 140;

  // Delivery details box
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(M, Y, boxW, boxH, 10, 10, "F");
  doc.setDrawColor(167, 243, 208);
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

  // Invoice summary box
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

  const payableBeforeShipping = Math.max(
    roundToTwo(toNumber(order?.totalAmount, orderSubtotal)),
    0,
  );
  const discountAmount = Math.max(
    roundToTwo(orderSubtotal - payableBeforeShipping),
    0,
  );

  const summaryData = [
    {
      label: "Product price",
      value: fmt(payableBeforeShipping || orderSubtotal),
    },
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

  if (discountAmount > 0) {
    summaryData.splice(1, 0, {
      label: "Discount applied",
      value: `- ${fmt(discountAmount)}`,
    });
  }

  let sLineY = Y + 42;
  summaryData.forEach((row) => {
    doc.setFont(F, "normal");
    doc.setFontSize(row.muted ? 8 : 9);
    const tc = row.muted ? SLATE_400 : SLATE_600;
    doc.setTextColor(tc[0], tc[1], tc[2]);
    doc.text(row.muted ? `    ${row.label}` : row.label, rBoxX + 16, sLineY);
    doc.text(row.value, rBoxX + boxW - 16, sLineY, { align: "right" });
    sLineY += row.muted ? 14 : 16;
  });

  // Divider + total
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(1);
  doc.line(rBoxX + 16, sLineY + 2, rBoxX + boxW - 16, sLineY + 2);
  sLineY += 16;

  doc.setFont(F, "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BRAND_DARK);
  doc.text("AMOUNT PAID", rBoxX + 16, sLineY);
  doc.text(fmt(payableTotal), rBoxX + boxW - 16, sLineY, { align: "right" });

  // Footer
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

  doc.setFont(F, "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND);
  doc.text("Thank you for your order!", W - M, H - 42, { align: "right" });

  // Save
  doc.save(
    `Aquakart-Invoice-${order?.orderId || order?.transactionId || "order"}.pdf`,
  );
};

/**
 * Load jsPDF from CDN if not already loaded.
 * @returns {Promise<boolean>} true when ready
 */
export const loadJsPDF = () =>
  new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.jspdf?.jsPDF) return resolve(true);

    const scriptId = "jspdf-cdn";
    const existing = document.getElementById(scriptId);
    if (existing) {
      if (existing.getAttribute("data-loaded") === "true") return resolve(true);
      existing.addEventListener("load", () => resolve(true), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.async = true;
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      resolve(true);
    };
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
