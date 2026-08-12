import { afterEach, describe, expect, it } from "vitest";

import { invoiceAccessCookie, isInvoiceBackendTimeout } from "./invoiceAccess";

const originalEnvironment = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalEnvironment;
});

describe("invoiceAccessCookie", () => {
  it("creates an HttpOnly, same-site session cookie", () => {
    const cookie = invoiceAccessCookie("secret token", 900);
    expect(cookie).toContain("aquakart_invoice_access=secret%20token");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Max-Age=900");
  });

  it("adds Secure in production", () => {
    process.env.NODE_ENV = "production";
    expect(invoiceAccessCookie("token")).toContain("Secure");
  });
});

describe("invoice backend timeout detection", () => {
  it("recognizes aborted and platform timeout requests", () => {
    expect(isInvoiceBackendTimeout({ name: "AbortError" })).toBe(true);
    expect(isInvoiceBackendTimeout({ name: "TimeoutError" })).toBe(true);
    expect(isInvoiceBackendTimeout(new Error("network error"))).toBe(false);
  });
});
