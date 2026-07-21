import { describe, expect, it } from "vitest";
import { mapInvoiceFromApi } from "@/utils/invoice/normalizeInvoice";

describe("mapInvoiceFromApi", () => {
  it("normalizes the invoice contract and multiplies unit prices by quantity", () => {
    const invoice = mapInvoiceFromApi({
      data: {
        _id: "invoice-id",
        invoiceNo: "AQ-2026-101",
        date: "2026-07-20T00:00:00.000Z",
        customerDetails: {
          name: "Aqua Customer",
          phone: 9000000000,
          address: "Hyderabad",
        },
        gst: "true",
        gstDetails: { gstNo: "36AAAAA0000A1Z5" },
        products: [
          {
            productName: "Water Softener",
            quantity: 2,
            unit_price: 15_000,
            category: { title: "Softeners" },
            subCategory: "Automatic",
          },
        ],
      },
    });

    expect(invoice.id).toBe("invoice-id");
    expect(invoice.invoice_no).toBe("AQ-2026-101");
    expect(invoice.gst).toBe(true);
    expect(invoice.customer_phone).toBe("9000000000");
    expect(invoice.products[0]).toMatchObject({
      productName: "Water Softener",
      productQuantity: 2,
      productPrice: 15_000,
      productCategory: "Softeners",
      productSubcategory: "Automatic",
    });
    expect(invoice.total_amount).toBe(30_000);
  });

  it("does not treat the string false as a true boolean", () => {
    const invoice = mapInvoiceFromApi({ gst: "false", products: [] });
    expect(invoice.gst).toBe(false);
  });

  it("does not invent a missing legal invoice date", () => {
    const invoice = mapInvoiceFromApi({ products: [] });
    expect(invoice.date).toBe("");
    expect(invoice.created_at).toBe("");
  });
});
