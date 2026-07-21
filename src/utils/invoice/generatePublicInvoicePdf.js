import { loadJsPDF } from "@/utils/invoice";
import priceUtils from "@/utils/priceUtils";

const BRAND = [4, 120, 87];
const BRAND_BRIGHT = [16, 185, 129];
const INK = [15, 23, 42];
const MUTED = [100, 116, 139];
const LINE = [226, 232, 240];
const SOFT = [248, 250, 252];
const WHITE = [255, 255, 255];

const safeFilePart = (value) =>
  String(value || "invoice")
    .trim()
    .replace(/[^a-z0-9_-]/gi, "-")
    .replace(/-+/g, "-");

const formatPdfAmount = (value) => {
  const amount = Number(value) || 0;
  return `INR ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const titleCase = (value) =>
  String(value || "Not available")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const drawPageHeader = (doc, invoice, continued = false) => {
  const width = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, width, 92, "F");
  doc.setFillColor(...BRAND_BRIGHT);
  doc.rect(0, 88, width, 4, "F");

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("AQUAKART", 42, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Premium water solutions", 42, 59);
  doc.text("GSTIN 36AJOPH6387A1Z2  |  aquakart.co.in", 42, 74);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(
    continued ? "TAX INVOICE / CONTINUED" : "TAX INVOICE",
    width - 42,
    42,
    {
      align: "right",
    },
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(invoice.invoice_no || invoice.id || "Invoice", width - 42, 60, {
    align: "right",
  });
};

const drawFooter = (doc) => {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...LINE);
  doc.line(42, height - 54, width - 42, height - 54);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(
    "Computer-generated invoice. No physical signature is required.",
    42,
    height - 38,
  );
  doc.text(
    "Aquakart  |  support@aquakart.co.in  |  +91 90147 74667",
    width - 42,
    height - 38,
    { align: "right" },
  );
};

const drawInfoCard = (doc, { x, y, width, title, lines }) => {
  const wrappedLines = lines.flatMap((line) =>
    doc.splitTextToSize(String(line || "Not available"), width - 28),
  );
  const height = Math.max(92, 45 + wrappedLines.length * 12);

  doc.setFillColor(...SOFT);
  doc.setDrawColor(...LINE);
  doc.roundedRect(x, y, width, height, 9, 9, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND);
  doc.text(title.toUpperCase(), x + 14, y + 19);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  doc.text(wrappedLines, x + 14, y + 38, { lineHeightFactor: 1.35 });

  return height;
};

const drawProductHeader = (doc, y) => {
  const width = doc.internal.pageSize.getWidth();
  doc.setFillColor(...INK);
  doc.roundedRect(42, y, width - 84, 28, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.text("PRODUCT", 56, y + 18);
  doc.text("QTY", width - 220, y + 18, { align: "right" });
  doc.text("UNIT PRICE", width - 125, y + 18, { align: "right" });
  doc.text("LINE TOTAL", width - 56, y + 18, { align: "right" });
  return y + 34;
};

/** Download the server-normalized public invoice as a searchable A4 PDF. */
export const downloadPublicInvoicePdf = async (invoice) => {
  const loaded = await loadJsPDF();
  const JsPdf = window.jspdf?.jsPDF;
  if (!loaded || !JsPdf) {
    throw new Error("The PDF service could not be loaded.");
  }

  const doc = new JsPdf({ unit: "pt", format: "a4", compress: true });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 42;
  const contentWidth = width - margin * 2;
  const amounts = priceUtils.getInvoiceAmounts(invoice);

  drawPageHeader(doc, invoice);
  let y = 116;

  const metadata = [
    ["Invoice number", invoice.invoice_no || invoice.id || "Not available"],
    ["Invoice date", formatDate(invoice.date)],
    ["Payment", titleCase(invoice.payment_type)],
    ["Status", titleCase(invoice.paid_status)],
  ];
  const metaWidth = contentWidth / 4 - 7;

  metadata.forEach(([label, value], index) => {
    const x = margin + index * (metaWidth + 9.3);
    doc.setFillColor(...SOFT);
    doc.setDrawColor(...LINE);
    doc.roundedRect(x, y, metaWidth, 50, 8, 8, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), x + 10, y + 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    const valueLines = doc.splitTextToSize(String(value), metaWidth - 20);
    doc.text(valueLines.slice(0, 2), x + 10, y + 33);
  });

  y += 66;
  const greetingLines = doc
    .splitTextToSize(
      `Thank you, ${invoice.customer_name || invoice.gst_name || "valued customer"}.`,
      contentWidth - 28,
    )
    .slice(0, 2);
  const greetingHeight = greetingLines.length > 1 ? 60 : 48;
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin, y, contentWidth, greetingHeight, 8, 8, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND);
  doc.text(greetingLines, margin + 14, y + 18, { lineHeightFactor: 1.25 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(
    "Keep this verified invoice for warranty and Aquakart service support.",
    margin + 14,
    y + 20 + greetingLines.length * 11,
  );

  y += greetingHeight + 14;
  const gap = 14;
  const cardWidth = (contentWidth - gap) / 2;
  const customerLines = [
    invoice.customer_name || "Customer name not available",
    invoice.customer_phone,
    invoice.customer_email,
    invoice.customer_address,
  ].filter(Boolean);
  const gstLines = invoice.gst
    ? [
        invoice.gst_name || invoice.customer_name,
        invoice.gst_no ? `GSTIN: ${invoice.gst_no}` : "GSTIN not available",
        invoice.gst_phone,
        invoice.gst_email,
        invoice.gst_address,
      ].filter(Boolean)
    : ["This invoice does not include a GST registration profile."];
  const customerHeight = drawInfoCard(doc, {
    x: margin,
    y,
    width: cardWidth,
    title: "Bill to",
    lines: customerLines,
  });
  const gstHeight = drawInfoCard(doc, {
    x: margin + cardWidth + gap,
    y,
    width: cardWidth,
    title: invoice.gst ? "GST details" : "Tax profile",
    lines: gstLines,
  });

  y += Math.max(customerHeight, gstHeight) + 20;
  y = drawProductHeader(doc, y);

  const addContinuationPage = () => {
    drawFooter(doc);
    doc.addPage();
    drawPageHeader(doc, invoice, true);
    y = drawProductHeader(doc, 112);
  };

  invoice.products.forEach((product, index) => {
    const nameLines = doc.splitTextToSize(product.productName, 220);
    const categoryText = [product.productCategory, product.productSubcategory]
      .filter(Boolean)
      .join(" / ");
    const categoryLines = categoryText
      ? doc.splitTextToSize(categoryText, 220)
      : [];
    const serialLines = product.productSerialNo
      ? doc.splitTextToSize(`Serial: ${product.productSerialNo}`, 220)
      : [];
    const rowHeight = Math.max(
      45,
      22 +
        nameLines.length * 11 +
        categoryLines.length * 9 +
        serialLines.length * 10,
    );
    if (y + rowHeight > height - 170) addContinuationPage();

    if (index % 2 === 1) {
      doc.setFillColor(...SOFT);
      doc.roundedRect(margin, y, contentWidth, rowHeight, 5, 5, "F");
    }

    const lineTotal = product.productPrice * product.productQuantity;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(nameLines, margin + 14, y + 17);
    let detailY = y + 17 + nameLines.length * 11;
    if (categoryLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(...BRAND);
      doc.text(categoryLines, margin + 14, detailY);
      detailY += categoryLines.length * 9;
    }
    if (serialLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(serialLines, margin + 14, detailY);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    doc.text(String(product.productQuantity), width - 220, y + 19, {
      align: "right",
    });
    doc.text(formatPdfAmount(product.productPrice), width - 125, y + 19, {
      align: "right",
    });
    doc.setFont("helvetica", "bold");
    doc.text(formatPdfAmount(lineTotal), width - 56, y + 19, {
      align: "right",
    });
    y += rowHeight + 3;
  });

  if (!invoice.products.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("No products were attached to this invoice.", margin + 14, y + 22);
    y += 46;
  }

  if (y + 190 > height - 65) addContinuationPage();
  y += 18;

  const wordsWidth = contentWidth * 0.54;
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin, y, wordsWidth, 130, 10, 10, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND);
  doc.text("AMOUNT IN WORDS", margin + 15, y + 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  const words = doc.splitTextToSize(
    priceUtils.numberToWords(amounts.grandTotal),
    wordsWidth - 30,
  );
  doc.text(words, margin + 15, y + 43, { lineHeightFactor: 1.4 });
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(
    "GST is included in the invoice total where applicable.",
    margin + 15,
    y + 109,
  );

  const summaryX = margin + wordsWidth + gap;
  const summaryWidth = contentWidth - wordsWidth - gap;
  doc.setFillColor(...INK);
  doc.roundedRect(summaryX, y, summaryWidth, 130, 10, 10, "F");
  const summaryRows = invoice.gst
    ? [
        ["Taxable value", amounts.basePrice],
        ["CGST (9%)", amounts.cgstValue],
        ["SGST (9%)", amounts.sgstValue],
      ]
    : [["Subtotal", amounts.grandTotal]];
  let rowY = y + 25;
  summaryRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(label, summaryX + 14, rowY);
    doc.setTextColor(...WHITE);
    doc.text(formatPdfAmount(value), summaryX + summaryWidth - 14, rowY, {
      align: "right",
    });
    rowY += 20;
  });
  doc.setDrawColor(71, 85, 105);
  doc.line(summaryX + 14, rowY - 7, summaryX + summaryWidth - 14, rowY - 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...WHITE);
  doc.text("INVOICE TOTAL", summaryX + 14, rowY + 9);
  doc.text(
    formatPdfAmount(amounts.grandTotal),
    summaryX + summaryWidth - 14,
    rowY + 9,
    { align: "right" },
  );

  drawFooter(doc);
  doc.save(
    `Aquakart-Invoice-${safeFilePart(invoice.invoice_no || invoice.id)}.pdf`,
  );
};
