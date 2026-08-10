import { describe, expect, it, vi } from "vitest";

import { openDirectInvoiceAccess } from "./directInvoice";

describe("direct invoice access", () => {
  it("opens the invoice, refreshes the enriched user, and adopts the storefront session", async () => {
    const loginDirectInvoiceAccess = vi.fn().mockResolvedValue({
      success: true,
    });
    const storefrontSession = {
      token: "aquakart-token",
      user: { phone: "9876543210", addresses: [{ street: "Hyderabad" }] },
    };
    const exchangeFirebaseIdToken = vi
      .fn()
      .mockResolvedValue(storefrontSession);
    const onStorefrontSession = vi.fn();

    await expect(
      openDirectInvoiceAccess({
        invoiceId: "invoice-123",
        firebaseIdToken: "firebase-token",
        loginDirectInvoiceAccess,
        exchangeFirebaseIdToken,
        onStorefrontSession,
      }),
    ).resolves.toEqual(storefrontSession);

    expect(loginDirectInvoiceAccess).toHaveBeenCalledWith(
      "invoice-123",
      "firebase-token",
    );
    expect(exchangeFirebaseIdToken).toHaveBeenCalledWith("firebase-token");
    expect(onStorefrontSession).toHaveBeenCalledWith(storefrontSession);
    expect(loginDirectInvoiceAccess.mock.invocationCallOrder[0]).toBeLessThan(
      exchangeFirebaseIdToken.mock.invocationCallOrder[0],
    );
  });

  it("does not attempt access without Google verification", async () => {
    const loginDirectInvoiceAccess = vi.fn();

    await expect(
      openDirectInvoiceAccess({
        invoiceId: "invoice-123",
        firebaseIdToken: "",
        loginDirectInvoiceAccess,
        exchangeFirebaseIdToken: vi.fn(),
      }),
    ).rejects.toThrow("Google verification is required");
    expect(loginDirectInvoiceAccess).not.toHaveBeenCalled();
  });
});
