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

describe("createVisitorLimiter", () => {
  it("allows up to the limit per key per window", async () => {
    const { createVisitorLimiter } = await import("./invoiceAccess");
    const allow = createVisitorLimiter({ windowMs: 1000, limit: 2 });
    expect(allow("a", 0)).toBe(true);
    expect(allow("a", 10)).toBe(true);
    expect(allow("a", 20)).toBe(false);
    expect(allow("b", 20)).toBe(true);
    expect(allow("a", 1000)).toBe(true);
  });

  it("keeps memory bounded", async () => {
    const { createVisitorLimiter } = await import("./invoiceAccess");
    const allow = createVisitorLimiter({ windowMs: 1000, limit: 1, maxKeys: 2 });
    allow("a", 0);
    allow("b", 0);
    expect(allow("c", 0)).toBe(true);
  });
});

describe("clientIp", () => {
  it("uses the first forwarded address", async () => {
    const { clientIp } = await import("./invoiceAccess");
    expect(clientIp({ headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } })).toBe("1.2.3.4");
    expect(clientIp({ headers: {}, socket: { remoteAddress: "5.6.7.8" } })).toBe("5.6.7.8");
  });
});
