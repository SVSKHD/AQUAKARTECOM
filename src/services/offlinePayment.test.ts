import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();
vi.mock("axios", () => ({ default: { get, post } }));

const firebase = {
  authStateReady: vi.fn(async () => {}),
  currentUser: null as null | { getIdToken: () => Promise<string> },
};
vi.mock("@/lib/firebase/client", () => ({ getFirebaseAuth: () => firebase }));

const {
  getOfflineSummary,
  getOfflineStatus,
  initiateOfflinePayment,
  saveOfflineCustomer,
  toOfflineState,
} = await import("./offlinePayment");

const httpError = (status: number, data: Record<string, unknown> = {}) =>
  Object.assign(new Error(`HTTP ${status}`), { response: { status, data } });

const customer = {
  address: { street: "Flat 4", city: "b", state: "c", postalCode: "500001" },
  alternatePhone: "9876543210",
};

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  firebase.currentUser = { getIdToken: async () => "fb-id" };
});

describe("offline payment service", () => {
  it("reads the public summary as the backend sends it, with no auth", async () => {
    get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          documentType: "pre_invoice",
          documentNumber: "AQPI|20261118|0001",
          products: [
            { name: "Kent Automatic 8L", description: "", quantity: 1 },
          ],
          subTotal: 31500,
          discount: 0,
          tax: 0,
          amount: 31500,
          currency: "INR",
          expiresAt: "2026-11-21T04:57:53.158Z",
          payable: true,
          state: "payable",
          requiresSignIn: true,
        },
      },
    });
    const s = await getOfflineSummary("tok/1");
    expect(get.mock.calls[0][0]).toMatch(/\/payments\/offline\/tok%2F1$/);
    expect(get.mock.calls[0][1].headers).toBeUndefined();
    expect(s).toMatchObject({
      reference: "AQPI|20261118|0001",
      total: 31500,
      subtotal: 31500,
      paid: false,
      phoneMasked: "",
      lines: [
        {
          name: "Kent Automatic 8L",
          description: "",
          quantity: 1,
          imageUrl: null,
        },
      ],
    });
    // The kind is never exposed to the page.
    expect(s).not.toHaveProperty("documentType");
  });

  it("marks a paid link as paid", async () => {
    get.mockResolvedValueOnce({ data: { data: { state: "paid", amount: 1 } } });
    await expect(getOfflineSummary("t")).resolves.toMatchObject({
      paid: true,
    });
  });

  it("sends the Firebase ID token and the backend session on signed-in calls", async () => {
    get.mockResolvedValueOnce({ data: { data: { status: "pending" } } });
    await getOfflineStatus("t", "jwt");
    expect(get.mock.calls[0][0]).toMatch(/\/payments\/offline\/t\/status$/);
    expect(get.mock.calls[0][1].headers).toEqual({
      Authorization: "Bearer fb-id",
      "X-Aquakart-Session": "jwt",
    });
  });

  it("asks for sign-in again when Firebase has no user", async () => {
    firebase.currentUser = null;
    await expect(getOfflineStatus("t", "jwt")).rejects.toMatchObject({
      kind: "auth",
    });
    expect(get).not.toHaveBeenCalled();
  });

  it("treats LINK_UNAVAILABLE (unknown, revoked, expired, changed) as one invalid link", async () => {
    get.mockRejectedValueOnce(
      httpError(404, { code: "LINK_UNAVAILABLE", message: "x" }),
    );
    await expect(getOfflineSummary("t")).rejects.toMatchObject({
      kind: "invalid",
      message: "This link is no longer valid.",
    });
  });

  it("tells a bound link and an unbound link apart", async () => {
    get.mockRejectedValueOnce(
      httpError(403, { code: "LINK_BOUND_TO_ANOTHER_USER" }),
    );
    await expect(getOfflineStatus("t", "jwt")).rejects.toMatchObject({
      kind: "bound",
    });
    get.mockRejectedValueOnce(
      httpError(409, { code: "CUSTOMER_DETAILS_REQUIRED" }),
    );
    await expect(getOfflineStatus("t", "jwt")).rejects.toMatchObject({
      kind: "details",
    });
  });

  it("shows the first field message of a validation failure", async () => {
    post.mockRejectedValueOnce(
      httpError(400, {
        code: "VALIDATION_FAILED",
        message: "Please check the highlighted details",
        details: { "address.postalCode": "Enter a valid 6-digit pincode" },
      }),
    );
    await expect(
      saveOfflineCustomer("t", customer, "jwt"),
    ).rejects.toMatchObject({
      kind: "other",
      message: "Enter a valid 6-digit pincode",
    });
    expect(post.mock.calls[0][1]).toEqual(customer);
  });

  it("starts PhonePe and needs a redirect URL", async () => {
    post.mockResolvedValueOnce({
      data: { data: { redirectUrl: "https://pp/x", status: "pending" } },
    });
    await expect(initiateOfflinePayment("t", "jwt")).resolves.toEqual({
      redirectUrl: "https://pp/x",
    });
    expect(post.mock.calls[0][0]).toMatch(/\/payments\/offline\/t\/initiate$/);
    post.mockResolvedValueOnce({ data: { data: {} } });
    await expect(initiateOfflinePayment("t", "jwt")).rejects.toThrow(
      /did not return a payment page/,
    );
    post.mockRejectedValueOnce(
      httpError(409, { code: "OUT_OF_STOCK", message: "Not in stock" }),
    );
    await expect(initiateOfflinePayment("t", "jwt")).rejects.toMatchObject({
      kind: "other",
      message: "Not in stock",
    });
    post.mockRejectedValueOnce(httpError(409, { code: "ALREADY_PAID" }));
    await expect(initiateOfflinePayment("t", "jwt")).rejects.toMatchObject({
      kind: "paid",
    });
  });

  it("counts only an explicit paid as paid", async () => {
    expect(toOfflineState("paid")).toBe("paid");
    expect(toOfflineState("success")).toBe("unpaid");
    expect(toOfflineState("not_started")).toBe("unpaid");
    expect(toOfflineState("pending")).toBe("pending");
    expect(toOfflineState("failed")).toBe("failed");
    expect(toOfflineState("expired")).toBe("failed");
    get.mockResolvedValueOnce({
      data: {
        data: {
          status: "paid",
          documentNumber: "AQPI|1",
          invoiceNo: "AQ/26/0042",
          invoiceReady: true,
          amount: 24990,
          amountPaid: 24990,
          gatewayTransactionId: "PP1",
          paidAt: "2026-11-18T12:10:00.000Z",
        },
      },
    });
    await expect(getOfflineStatus("t", "jwt")).resolves.toEqual({
      status: "paid",
      reference: "AQPI|1",
      invoiceNumber: "AQ/26/0042",
      invoiceId: null,
      invoiceReady: true,
      amount: 24990,
      amountPaid: 24990,
      transactionId: "PP1",
      paidAt: "2026-11-18T12:10:00.000Z",
    });
  });
});
