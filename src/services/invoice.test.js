import { describe, expect, it } from "vitest";

import {
  directInvoiceLoginPath,
  invoiceByIdPath,
  isValidInvoiceEmail,
  normalizeInvoiceEmail,
  normalizeInvoicePhone,
} from "./invoice";

describe("normalizeInvoicePhone", () => {
  it("normalizes Indian country codes and formatting", () => {
    expect(normalizeInvoicePhone("+91 98765 43210")).toBe("9876543210");
  });

  it("limits input to ten digits", () => {
    expect(normalizeInvoicePhone("987654321099")).toBe("9876543210");
  });
});

describe("invoice delivery email", () => {
  it("normalizes a one-time delivery recipient", () => {
    expect(normalizeInvoiceEmail(" Customer@Example.COM ")).toBe(
      "customer@example.com",
    );
  });

  it("rejects malformed email and header injection", () => {
    expect(isValidInvoiceEmail("customer@example.com")).toBe(true);
    expect(isValidInvoiceEmail("invalid-email")).toBe(false);
    expect(
      isValidInvoiceEmail("customer@example.com\r\nBcc:x@example.com"),
    ).toBe(false);
  });
});

describe("direct invoice Google login", () => {
  it("builds an invoice-scoped BFF path safely", () => {
    expect(directInvoiceLoginPath("invoice/with spaces")).toBe(
      "/invoice-gateway/invoice%2Fwith%20spaces/login",
    );
  });
});

describe("fresh invoice loading", () => {
  it("builds an invoice-scoped client fetch path safely", () => {
    expect(invoiceByIdPath("invoice/with spaces")).toBe(
      "/invoice-gateway/invoice%2Fwith%20spaces",
    );
  });
});
