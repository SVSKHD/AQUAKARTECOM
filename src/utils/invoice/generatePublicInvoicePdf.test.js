import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";

import {
  createPublicInvoicePdfDocument,
  getPublicInvoiceReference,
  getPublicProductClassification,
  isInternalInvoiceIdentifier,
} from "./generatePublicInvoicePdf";
import { mapInvoiceFromApi } from "./normalizeInvoice";

describe("public invoice PDF privacy", () => {
  it("recognizes internal Mongo and UUID identifiers", () => {
    expect(isInternalInvoiceIdentifier("66b388e5aaee5040f671f5fe")).toBe(true);
    expect(
      isInternalInvoiceIdentifier("550e8400-e29b-41d4-a716-446655440000"),
    ).toBe(true);
    expect(isInternalInvoiceIdentifier("AQ-2026-101")).toBe(false);
  });

  it("never falls back to the database ID as the public invoice reference", () => {
    expect(
      getPublicInvoiceReference({
        id: "66b388e5aaee5040f671f5fe",
        invoice_no: "",
      }),
    ).toBe("Invoice");
    expect(getPublicInvoiceReference({ invoice_no: "AQ-2026-101" })).toBe(
      "AQ-2026-101",
    );
  });

  it("removes internal identifiers from product classifications", () => {
    expect(
      getPublicProductClassification({
        productCategory: "66b388e5aaee5040f671f5fe",
        productSubcategory: "Water softeners",
      }),
    ).toBe("Water softeners");
    expect(
      getPublicProductClassification({
        productCategory: "66b388e5aaee5040f671f5fe",
        productSubcategory: "6533f07c7986c193b3c620d2",
      }),
    ).toBe("");
  });
});

// Uncompressed so the text operators can be read back.
class PlainPdf extends jsPDF {
  constructor(options) {
    super({ ...options, compress: false });
  }
}

const pdfText = (invoice) =>
  createPublicInvoicePdfDocument(PlainPdf, invoice)
    .output()
    .split("\n")
    .filter((line) => line.endsWith("Tj"))
    .join("\n");

const poPayload = {
  _id: "66b388e5aaee5040f671f5fe",
  invoiceNo: "AQBKSJwVvUCSp|14112026",
  date: "2026-11-14",
  po: true,
  gst: true,
  paidStatus: "unpaid",
  customerDetails: {
    name: "Interia Infrastructure Private Limited",
    phone: "8179267923",
    address: "M/S Visco information technology services pvt ltd, madhapur",
  },
  gstDetails: {
    gstName: "INTERIA INFRASTRUCTURE PRIVATE LIMITED",
    gstNo: "36AADCI2521A1ZA",
    gstAddress: "SS Enclave, Gachibowli, Telangana - 500032",
  },
  products: [
    {
      productName: "Kent Automatic 8L | Aquakart",
      productQuantity: 3,
      productPrice: 94_500,
    },
  ],
};

describe("public invoice PDF (same design as the CRM PDF)", () => {
  it("shows a PO line total as stored, with the derived unit price", () => {
    const text = pdfText(mapInvoiceFromApi(poPayload));
    expect(text).toContain("PURCHASE ORDER");
    expect(text).toContain("UNIT PRICE");
    expect(text).toContain("(31,500.00)");
    expect(text).toContain("(80,084.75)");
    expect(text).toContain("(14,415.25)");
    expect(text).toContain("INR 94,500.00");
    expect(text).not.toContain("2,83,500");
    // jsPDF escapes parentheses inside text operators.
    expect(text).toContain("Place of supply: Telangana \\(36\\)");
    expect(text).toContain("ORIGINAL FOR RECIPIENT");
    expect(text).toContain("AMOUNT DUE");
    expect(text).toContain("(PO)");
    expect(text).toContain("Authorised Signatory");
  });

  it("titles a paid sale as a receipt and stamps it PAID", () => {
    const text = pdfText(
      mapInvoiceFromApi({ ...poPayload, po: false, paidStatus: "paid" }),
    );
    expect(text).toContain("GST TAX RECEIPT");
    expect(text).toContain("AMOUNT PAID");
    expect(text).toContain("(PAID)");
  });

  it("keeps quotation discounts and stamps the quotation", () => {
    const quotation = mapInvoiceFromApi(
      {
        quotationNo: "AQQ-1",
        quotation: true,
        products: [
          {
            productName: "Softener",
            productQuantity: 2,
            productPrice: 15_000,
            productDiscount: 1_000,
          },
        ],
      },
      { unitPrices: true },
    );
    const text = pdfText(quotation);
    expect(text).toContain("SALES QUOTATION");
    expect(text).not.toContain("ORIGINAL FOR RECIPIENT");
    expect(text).toContain("(- 1,000.00 off)");
    expect(text).toContain("(29,000.00)");
    expect(text).toContain("Original price");
    expect(text).toContain("QUOTATION TOTAL");
    expect(text).toContain("(QUOTATION)");
  });

  it("stamps a cancelled bill", () => {
    const text = pdfText(
      mapInvoiceFromApi({ ...poPayload, paidStatus: "cancelled" }),
    );
    expect(text).toContain("(CANCELLED)");
    expect(text).toContain("TOTAL \\(CANCELLED\\)");
  });

  it("continues a long item list onto another page", () => {
    const products = Array.from({ length: 25 }, (_, index) => ({
      productName: `Softener model ${index + 1} with a fairly long name`,
      productQuantity: 1,
      productPrice: 1_000 + index,
    }));
    const doc = createPublicInvoicePdfDocument(
      PlainPdf,
      mapInvoiceFromApi({ ...poPayload, products }),
    );
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(3);
  });
});
