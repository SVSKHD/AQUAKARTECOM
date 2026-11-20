import { describe, expect, it } from "vitest";
import {
  getDocumentKind,
  getDocumentStatus,
  isPaidStatus,
} from "./documentKind";

describe("getDocumentKind", () => {
  it("calls a paid sale a receipt and an unpaid one an invoice", () => {
    expect(getDocumentKind({ paid_status: "paid" })).toEqual({
      type: "receipt",
      name: "Receipt",
      title: "Retail Tax Receipt",
    });
    expect(getDocumentKind({ paid_status: "unpaid", gst: true })).toEqual({
      type: "invoice",
      name: "Invoice",
      title: "GST Tax Invoice",
    });
    expect(getDocumentKind({}).name).toBe("Invoice");
  });

  it("keeps quotation and purchase order names whatever the status", () => {
    expect(getDocumentKind({ quotation: true, paid_status: "paid" }).name).toBe(
      "Quotation",
    );
    expect(getDocumentKind({ po: true, paid_status: "paid" }).name).toBe(
      "Purchase Order",
    );
  });

  it("treats completed and success as paid", () => {
    expect(isPaidStatus("Completed")).toBe(true);
    expect(isPaidStatus("SUCCESS")).toBe(true);
    expect(isPaidStatus("pending")).toBe(false);
    expect(isPaidStatus(undefined)).toBe(false);
  });
});

describe("getDocumentStatus", () => {
  it("stamps each kind of bill", () => {
    const key = (invoice) => getDocumentStatus(invoice).key;
    expect(key({ paid_status: "paid" })).toBe("paid");
    expect(key({ paid_status: "unpaid" })).toBe("unpaid");
    expect(key({})).toBe("unpaid");
    expect(key({ paid_status: "Partially_Paid" })).toBe("partial");
    expect(key({ quotation: true, paid_status: "paid" })).toBe("quotation");
    expect(key({ po: true, paid_status: "unpaid" })).toBe("po");
    expect(key({ po: true, paid_status: "paid" })).toBe("paid");
    expect(key({ paid_status: "cancelled", quotation: true })).toBe(
      "cancelled",
    );
  });
});
