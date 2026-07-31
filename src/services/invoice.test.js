import { describe, expect, it } from "vitest";

import { normalizeInvoicePhone } from "./invoice";

describe("normalizeInvoicePhone", () => {
  it("normalizes Indian country codes and formatting", () => {
    expect(normalizeInvoicePhone("+91 98765 43210")).toBe("9876543210");
  });

  it("limits input to ten digits", () => {
    expect(normalizeInvoicePhone("987654321099")).toBe("9876543210");
  });
});
