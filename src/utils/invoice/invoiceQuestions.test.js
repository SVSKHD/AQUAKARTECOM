import { describe, expect, it } from "vitest";
import { invoiceFreeQuestion, invoiceQuestions } from "./invoiceQuestions";

const invoice = {
  invoice_no: "AQ-101",
  gst: true,
  gst_no: "36ABCDE1234F1Z5",
  products: [{ productName: "Kent Grand Plus RO Water Purifier" }],
};
const amounts = { grandTotal: 11800, basePrice: 10000, gstValue: 1800 };

describe("invoiceQuestions", () => {
  it("asks about payment on an unpaid invoice and carries its facts", () => {
    const questions = invoiceQuestions(invoice, { key: "unpaid" }, amounts);
    expect(questions[0].label).toBe("How do I pay?");
    expect(questions[0].question).toContain("AQ-101");
    expect(questions.some((q) => q.label === "Claim GST input")).toBe(true);
    expect(questions.every((q) => q.tone === "unpaid")).toBe(true);
  });

  it("switches to warranty for a paid receipt and acceptance for a quote", () => {
    expect(invoiceQuestions(invoice, { key: "paid" }, amounts)[0].label).toBe(
      "Claim warranty",
    );
    expect(
      invoiceQuestions(invoice, { key: "quotation" }, amounts)[0].label,
    ).toBe("Confirm this quote");
  });

  it("never returns more than five questions and survives an empty bill", () => {
    expect(invoiceQuestions(invoice, { key: "po" }, amounts).length).toBe(5);
    expect(invoiceQuestions().length).toBeGreaterThan(0);
  });
});

describe("invoiceFreeQuestion", () => {
  it("prefixes the bill reference and ignores blank input", () => {
    expect(invoiceFreeQuestion(invoice, " Is installation free? ")).toBe(
      "About bill AQ-101: Is installation free?",
    );
    expect(invoiceFreeQuestion(invoice, "   ")).toBe("");
  });
});
