import { describe, expect, it, vi } from "vitest";

import { openDirectInvoiceAccess } from "./directInvoice";

describe("direct invoice access", () => {
  it("exchanges only the invoice ID and Firebase token", async () => {
    const loginDirectInvoiceAccess = vi.fn().mockResolvedValue({
      success: true,
    });

    await expect(
      openDirectInvoiceAccess({
        invoiceId: "invoice-123",
        firebaseIdToken: "firebase-token",
        loginDirectInvoiceAccess,
      }),
    ).resolves.toBe(true);

    expect(loginDirectInvoiceAccess).toHaveBeenCalledWith(
      "invoice-123",
      "firebase-token",
    );
  });

  it("does not attempt access without Google verification", async () => {
    const loginDirectInvoiceAccess = vi.fn();

    await expect(
      openDirectInvoiceAccess({
        invoiceId: "invoice-123",
        firebaseIdToken: "",
        loginDirectInvoiceAccess,
      }),
    ).rejects.toThrow("Google verification is required");
    expect(loginDirectInvoiceAccess).not.toHaveBeenCalled();
  });
});
