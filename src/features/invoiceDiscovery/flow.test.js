import { describe, expect, it } from "vitest";
import {
  createInitialInvoiceFlow,
  getInvoiceEmailScenario,
  INVOICE_FLOW_PHASE,
  invoiceFlowReducer,
  validateDeliveryEmail,
} from "./flow";

describe("invoice discovery state model", () => {
  it("starts with Google authentication when signed out", () => {
    expect(createInitialInvoiceFlow().phase).toBe(
      INVOICE_FLOW_PHASE.AUTH_REQUIRED,
    );
  });

  it("preserves lookup input through authentication", () => {
    const state = createInitialInvoiceFlow({ phone: "9876543210" });
    const authenticated = invoiceFlowReducer(state, {
      type: "AUTH_SUCCESS",
      user: { email: "customer@example.com" },
    });
    expect(authenticated.phone).toBe("9876543210");
    expect(authenticated.phase).toBe(INVOICE_FLOW_PHASE.LOOKUP);
  });

  it("represents no-results and invoice-list states explicitly", () => {
    const state = createInitialInvoiceFlow({ authenticated: true });
    expect(invoiceFlowReducer(state, { type: "SEARCH_EMPTY" }).phase).toBe(
      INVOICE_FLOW_PHASE.EMPTY,
    );
    expect(
      invoiceFlowReducer(state, {
        type: "SEARCH_SUCCESS",
        invoices: [{ id: "invoice-1" }],
      }).phase,
    ).toBe(INVOICE_FLOW_PHASE.LIST);
  });

  it("requires confirmation only for unclaimed invoices", () => {
    const state = createInitialInvoiceFlow({ authenticated: true });
    const pending = invoiceFlowReducer(state, {
      type: "SELECT_INVOICE",
      invoice: { id: "pending", claimRequired: true },
    });
    const owned = invoiceFlowReducer(state, {
      type: "SELECT_INVOICE",
      invoice: {
        id: "owned",
        claimRequired: false,
        emailStatus: "matches",
      },
    });
    expect(pending.phase).toBe(INVOICE_FLOW_PHASE.CONFIRMING);
    expect(owned.phase).toBe(INVOICE_FLOW_PHASE.READY);
  });

  it("covers matching, missing and different invoice emails", () => {
    expect(getInvoiceEmailScenario({ emailStatus: "matches" })).toBe("matches");
    expect(getInvoiceEmailScenario({ emailStatus: "missing" })).toBe("missing");
    expect(getInvoiceEmailScenario({ emailStatus: "different" })).toBe(
      "different",
    );
  });

  it("keeps one-time delivery validation separate from permanent updates", () => {
    expect(validateDeliveryEmail("delivery@example.com")).toBe("");
    expect(validateDeliveryEmail("invalid-email")).toMatch(/valid email/i);
    expect(validateDeliveryEmail("a@example.com\r\nBcc:x@example.com")).toMatch(
      /valid email/i,
    );
  });

  it("prevents a second send state while the first request is active", () => {
    const state = invoiceFlowReducer(
      createInitialInvoiceFlow({ authenticated: true }),
      { type: "SEND_START" },
    );
    expect(state.phase).toBe(INVOICE_FLOW_PHASE.SENDING);
  });
});
