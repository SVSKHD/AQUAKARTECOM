const AQUAKART_LOGO_URL =
  "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png";
const GST_RATE = 0.18;

const roundToTwo = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const firstFiniteNumber = (values) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
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

const fmt = (value) => {
  const amount = roundToTwo(toNumber(value, 0)).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `INR ${amount}`;
};

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
  ]
    .map((line) => (line ? `${line}`.trim() : ""))
    .filter(Boolean);
};

const writeWrappedLines = (doc, lines, x, y, width, lineGap = 12) => {
  let cursorY = y;
  lines.forEach((line) => {
    const wrapped = doc.splitTextToSize(String(line), width);
    doc.text(wrapped, x, cursorY, { lineHeightFactor: 1.25 });
    cursorY += wrapped.length * lineGap;
  });
  return cursorY;
};

const drawRoundedCard = (doc, x, y, w, h, fill, stroke) => {
  doc.setFillColor(...fill);
  doc.roundedRect(x, y, w, h, 10, 10, "F");
  if (stroke) {
    doc.setDrawColor(...stroke);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, y, w, h, 10, 10, "S");
  }
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
  const M = 42;
  const TW = W - M * 2;
  const F = "helvetica";

  const BRAND = [16, 185, 129];
  const BRAND_DARK = [6, 95, 70];
  const BRAND_DEEP = [4, 120, 87];
  const SLATE_950 = [2, 6, 23];
  const SLATE_900 = [15, 23, 42];
  const SLATE_700 = [51, 65, 85];
  const SLATE_600 = [71, 85, 105];
  const SLATE_500 = [100, 116, 139];
  const SLATE_400 = [148, 163, 184];
  const SLATE_200 = [226, 232, 240];
  const STRIPE_BG = [248, 250, 252];
  const WHITE = [255, 255, 255];

  const items = Array.isArray(order?.items) ? order.items : [];

  const orderSubtotal = roundToTwo(
    items.reduce((sum, item) => {
      return sum + toNumber(item?.price) * toNumber(item?.quantity, 1);
    }, 0),
  );

  const itemsGstTotal = roundToTwo(
    items.reduce((sum, item) => {
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
  const orderTotal = toNumber(order?.totalAmount, amountPaid);
  const explicitDiscount = firstFiniteNumber([
    order?.discountAmount,
    order?.discount,
    order?.couponDiscount,
    order?.offerDiscount,
  ]);
  const discountAmount =
    explicitDiscount !== null && explicitDiscount >= 0
      ? roundToTwo(explicitDiscount)
      : Math.max(roundToTwo(orderSubtotal - orderTotal), 0);

  const isCOD = `${order.orderType || order.paymentMethod || ""}`
    .toLowerCase()
    .includes("cash");

  const logo = await loadImageAsDataURL(AQUAKART_LOGO_URL);

  if (logo) {
    try {
      if (doc.GState) {
        doc.setGState(new doc.GState({ opacity: 0.035 }));
        doc.addImage(logo, "PNG", W / 2 - 145, H / 2 - 145, 290, 290);
        doc.setGState(new doc.GState({ opacity: 1 }));
      }
    } catch (_) {}
  }

  doc.setFillColor(...BRAND);
  doc.rect(0, 0, W, 96, "F");
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 96, W, 5, "F");

  let brandTextX = M;
  if (logo) {
    try {
      doc.setFillColor(...WHITE);
      doc.roundedRect(M, 22, 50, 50, 14, 14, "F");
      doc.addImage(logo, "PNG", M + 8, 30, 34, 34);
      brandTextX = M + 64;
    } catch (_) {
      brandTextX = M;
    }
  }

  doc.setTextColor(...WHITE);
  doc.setFont(F, "bold");
  doc.setFontSize(27);
  doc.text("Aquakart", brandTextX, 43);
  doc.setFont(F, "normal");
  doc.setFontSize(10);
  doc.text("Premium Water Solutions", brandTextX, 60);
  doc.setFontSize(9);
  doc.text("GSTIN: 36AJOPH6387A1Z2  |  aquakart.co.in", brandTextX, 76);

  doc.setFont(F, "bold");
  doc.setFontSize(11);
  doc.setFillColor(...WHITE);
  const badgeW = 86;
  doc.roundedRect(W - M - badgeW, 32, badgeW, 30, 15, 15, "F");
  doc.setTextColor(...BRAND_DARK);
  doc.text("INVOICE", W - M - badgeW / 2, 51, { align: "center" });

  let Y = 122;
  const invoiceNumber = order?.invoiceId || order?.orderId || "-";
  const createdDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

  const metaData = [
    ["Invoice #", invoiceNumber],
    ["Date", createdDate],
    ["Transaction", order?.transactionId || "-"],
    ["Payment", isCOD ? "Cash on Delivery" : "Online / Gateway"],
    ["Status", order?.orderStatus || "Processing"],
    ["Currency", "INR"],
  ];

  const metaCardW = (TW - 14) / 2;
  const metaCardH = 36;
  metaData.forEach(([label, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = M + col * (metaCardW + 14);
    const y = Y + row * (metaCardH + 10);

    drawRoundedCard(doc, x, y, metaCardW, metaCardH, STRIPE_BG, SLATE_200);
    doc.setFont(F, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE_400);
    doc.text(label.toUpperCase(), x + 12, y + 13);
    doc.setFont(F, "bold");
    doc.setFontSize(9);
    doc.setTextColor(...SLATE_900);
    const valueLines = doc.splitTextToSize(String(value), metaCardW - 24);
    doc.text(valueLines.slice(0, 1), x + 12, y + 27);
  });

  Y += 3 * (metaCardH + 10) + 12;

  const billingLines = [
    order?.customerName || order?.user?.name || "Customer",
    order?.email,
    order?.phone,
  ].filter(Boolean);

  const shippingLines = composeAddressLines(order?.shippingAddress);
  if (order?.phone) shippingLines.push(`Phone: ${order.phone}`);

  const addressBoxW = (TW - 16) / 2;
  const addressBoxH = 94;

  const drawAddressBlock = (title, lines, x, y) => {
    drawRoundedCard(doc, x, y, addressBoxW, addressBoxH, WHITE, SLATE_200);
    doc.setFont(F, "bold");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_DEEP);
    doc.text(title.toUpperCase(), x + 14, y + 20);
    doc.setFont(F, "normal");
    doc.setFontSize(9);
    doc.setTextColor(...SLATE_700);
    writeWrappedLines(
      doc,
      lines.length ? lines : ["N/A"],
      x + 14,
      y + 38,
      addressBoxW - 28,
      12,
    );
  };

  drawAddressBlock("Bill To", billingLines, M, Y);
  drawAddressBlock("Ship To", shippingLines, M + addressBoxW + 16, Y);
  Y += addressBoxH + 22;

  const colX = {
    idx: M + 14,
    item: M + 42,
    qty: M + TW - 206,
    rate: M + TW - 128,
    total: M + TW - 14,
  };
  const itemDescW = colX.qty - colX.item - 18;

  const drawTableHead = (y) => {
    doc.setFillColor(...BRAND);
    doc.roundedRect(M, y, TW, 30, 8, 8, "F");
    doc.setTextColor(...WHITE);
    doc.setFont(F, "bold");
    doc.setFontSize(8.5);
    doc.text("#", colX.idx, y + 19);
    doc.text("ITEM", colX.item, y + 19);
    doc.text("QTY", colX.qty, y + 19, { align: "right" });
    doc.text("RATE", colX.rate, y + 19, { align: "right" });
    doc.text("AMOUNT", colX.total, y + 19, { align: "right" });
    doc.setTextColor(...SLATE_900);
    return y + 38;
  };

  Y = drawTableHead(Y);

  const ensurePage = (need) => {
    if (Y + need > H - 100) {
      doc.addPage();
      doc.setFillColor(...BRAND);
      doc.rect(0, 0, W, 38, "F");
      doc.setTextColor(...WHITE);
      doc.setFont(F, "bold");
      doc.setFontSize(10);
      doc.text("Aquakart Invoice - continued", M, 24);
      doc.setTextColor(...SLATE_900);
      Y = 58;
      Y = drawTableHead(Y);
    }
  };

  items.forEach((product, i) => {
    const name = product?.name || product?.productName || `Item ${i + 1}`;
    const qty = toNumber(product?.quantity, 1);
    const unitPrice = toNumber(product?.price, 0);
    const lineTotal = roundToTwo(qty * unitPrice);
    const nameLines = doc.splitTextToSize(name, Math.max(itemDescW, 110));
    const rowH = Math.max(nameLines.length * 13 + 18, 42);

    ensurePage(rowH + 8);

    if (i % 2 === 1) {
      doc.setFillColor(...STRIPE_BG);
      doc.roundedRect(M, Y, TW, rowH, 6, 6, "F");
    }

    const textY = Y + 18;
    doc.setFont(F, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...SLATE_500);
    doc.text(String(i + 1).padStart(2, "0"), colX.idx, textY);
    doc.setTextColor(...SLATE_900);
    doc.text(nameLines, colX.item, textY, { lineHeightFactor: 1.25 });
    doc.setFont(F, "bold");
    doc.text(String(qty), colX.qty, textY, { align: "right" });
    doc.setFont(F, "normal");
    doc.setTextColor(...SLATE_600);
    doc.text(fmt(unitPrice), colX.rate, textY, { align: "right" });
    doc.setFont(F, "bold");
    doc.setTextColor(...SLATE_950);
    doc.text(fmt(lineTotal), colX.total, textY, { align: "right" });

    Y += rowH + 4;
  });

  if (!items.length) {
    ensurePage(48);
    doc.setFont(F, "normal");
    doc.setFontSize(10);
    doc.setTextColor(...SLATE_500);
    doc.text("No line items available for this invoice.", M + 14, Y + 20);
    Y += 48;
  }

  ensurePage(210);
  Y += 14;

  const boxW = TW / 2 - 10;
  const boxH = 154;

  drawRoundedCard(doc, M, Y, boxW, boxH, [240, 253, 244], [167, 243, 208]);
  doc.setFont(F, "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_DARK);
  doc.text("DELIVERY DETAILS", M + 16, Y + 23);
  doc.setFont(F, "normal");
  doc.setFontSize(8.6);
  doc.setTextColor(...SLATE_600);
  writeWrappedLines(
    doc,
    [
      ...(shippingLines.length ? shippingLines : ["N/A"]),
      order?.email ? `Email: ${order.email}` : null,
    ].filter(Boolean),
    M + 16,
    Y + 42,
    boxW - 32,
    12,
  );

  const rBoxX = M + boxW + 20;
  drawRoundedCard(doc, rBoxX, Y, boxW, boxH, STRIPE_BG, SLATE_200);

  doc.setFont(F, "bold");
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_900);
  doc.text("INVOICE SUMMARY", rBoxX + 16, Y + 23);

  const summaryData = [
    {
      label: "Items subtotal",
      value: fmt(orderSubtotal),
    },
  ];

  if (discountAmount > 0) {
    summaryData.push({
      label: "Discount applied",
      value: `- ${fmt(discountAmount)}`,
    });
  }

  summaryData.push(
    {
      label: `GST included (${Math.round(GST_RATE * 100)}%)`,
      value: fmt(itemsGstTotal),
      muted: true,
    },
    {
      label: "Shipping",
      value: shippingCharge > 0 ? fmt(shippingCharge) : "FREE",
    },
  );

  let sLineY = Y + 44;
  summaryData.forEach((row) => {
    doc.setFont(F, "normal");
    doc.setFontSize(row.muted ? 8 : 8.8);
    const textColor = row.muted ? SLATE_400 : SLATE_600;
    doc.setTextColor(...textColor);
    doc.text(row.label, rBoxX + 16, sLineY);
    doc.text(row.value, rBoxX + boxW - 16, sLineY, { align: "right" });
    sLineY += row.muted ? 13 : 16;
  });

  doc.setDrawColor(...BRAND);
  doc.setLineWidth(1);
  doc.line(rBoxX + 16, sLineY + 2, rBoxX + boxW - 16, sLineY + 2);
  sLineY += 18;

  doc.setFont(F, "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(...BRAND_DARK);
  doc.text("AMOUNT PAID", rBoxX + 16, sLineY);
  doc.text(fmt(amountPaid), rBoxX + boxW - 16, sLineY, { align: "right" });

  doc.setDrawColor(...SLATE_200);
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
