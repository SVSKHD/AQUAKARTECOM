import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createCheckoutPayment = vi.fn();
const getCheckoutPayment = vi.fn();
const getOrdersByUserId = vi.fn();
vi.mock("@/services/order", () => ({
  default: {
    createCheckoutPayment,
    getCheckoutPayment,
    getOrdersByUserId,
    createCheckoutQuote: vi.fn(),
    getOrdersByTransactionId: vi.fn(),
  },
}));

const {
  startCheckoutPayment,
  checkoutPaymentStatus,
  waitForCheckoutPayment,
  findOrder,
  quoteSessionId,
} = await import("./aquaCommerce");

const fakePopup = () => ({
  closed: false,
  close: vi.fn(),
  location: { href: "" },
});

describe("POST /payments flow", () => {
  let popup: ReturnType<typeof fakePopup>;
  beforeEach(() => {
    popup = fakePopup();
    vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
    createCheckoutPayment.mockReset();
    getCheckoutPayment.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it("opens the popup before any await, pays the session and sends PhonePe's page to it", async () => {
    createCheckoutPayment.mockResolvedValueOnce({
      success: true,
      data: {
        id: "att1",
        orderId: "ord1",
        status: "pending",
        redirectUrl: "https://pay.phonepe.com/x",
        amount: 24990,
      },
    });
    const address = {
      street: "12 Lake Rd",
      city: "Hyderabad",
      state: "Telangana",
      postalCode: "500081",
    };
    const p = startCheckoutPayment(
      () => ({ checkoutSessionId: "sess1", shippingAddress: address }),
      "tok",
      "key-1",
    );
    expect(window.open).toHaveBeenCalledWith(
      "",
      "aquakart-phonepe",
      expect.any(String),
    ); // synchronous
    await expect(p).resolves.toMatchObject({
      attemptId: "att1",
      orderId: "ord1",
      url: "https://pay.phonepe.com/x",
    });
    expect(createCheckoutPayment).toHaveBeenCalledWith(
      {
        gateway: "phonepe",
        checkoutSessionId: "sess1",
        shippingAddress: address,
      },
      "tok",
      "key-1",
    );
    expect(popup.location.href).toBe("https://pay.phonepe.com/x");
  });

  it("flags an expired session (409) and closes the popup", async () => {
    createCheckoutPayment.mockRejectedValueOnce(
      Object.assign(new Error("Checkout session is invalid or expired"), {
        status: 409,
      }),
    );
    const p = startCheckoutPayment(
      () => ({ checkoutSessionId: "old", shippingAddress: {} }),
      "tok",
      "k",
    );
    await expect(p).rejects.toMatchObject({
      sessionExpired: true,
      message: "Checkout session is invalid or expired",
    });
    expect(popup.close).toHaveBeenCalled();
  });

  it("runs `prepare` after the popup opens (e.g. a fresh quote for a retry)", async () => {
    const order: string[] = [];
    (window.open as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => {
        order.push("open");
        return popup;
      },
    );
    createCheckoutPayment.mockResolvedValueOnce({
      data: { id: "a", redirectUrl: "u" },
    });
    await startCheckoutPayment(
      async () => {
        order.push("prepare");
        return { checkoutSessionId: "fresh", shippingAddress: {} };
      },
      "tok",
      "k",
    );
    expect(order).toEqual(["open", "prepare"]);
  });

  it("maps attempt statuses", async () => {
    getCheckoutPayment.mockResolvedValueOnce({
      data: { status: "paid", amount: 10 },
    });
    expect((await checkoutPaymentStatus("a")).status).toBe("paid");
    getCheckoutPayment.mockResolvedValueOnce({ data: { status: "failed" } });
    expect((await checkoutPaymentStatus("a")).status).toBe("failed");
    getCheckoutPayment.mockResolvedValueOnce({ data: { status: "pending" } });
    expect((await checkoutPaymentStatus("a")).status).toBe("pending");
    getCheckoutPayment.mockResolvedValueOnce({ data: { status: "created" } });
    expect((await checkoutPaymentStatus("a")).status).toBe("pending");
  });

  it("polls GET /payments/:id until the server says paid", async () => {
    vi.useFakeTimers();
    getCheckoutPayment
      .mockResolvedValueOnce({ data: { status: "pending" } })
      .mockResolvedValueOnce({ data: { status: "paid", amount: 24990 } });
    const onCheck = vi.fn();
    const w = waitForCheckoutPayment("att1", "tok", {
      intervalMs: 1000,
      onCheck,
    });
    await vi.advanceTimersByTimeAsync(1500);
    // Every answer reaches the status card, the pending one too.
    expect(onCheck.mock.calls.map(([r]) => r.status)).toEqual([
      "pending",
      "paid",
    ]);
    await expect(w.done).resolves.toMatchObject({
      status: "paid",
      order: { amount: 24990 },
    });
    expect(getCheckoutPayment).toHaveBeenCalledWith(
      "att1",
      "tok",
      expect.anything(),
    );
    vi.useRealTimers();
  });

  it("finds the created order, and reads the quote's session id", async () => {
    getOrdersByUserId.mockResolvedValueOnce({
      data: [{ _id: "x" }, { _id: "ord1", orderId: "AQOD-1" }],
    });
    await expect(findOrder("ord1", "u1", "tok")).resolves.toEqual({
      _id: "ord1",
      orderId: "AQOD-1",
    });
    await expect(findOrder(null, "u1")).resolves.toBeNull();
    expect(quoteSessionId({ id: "s1" })).toBe("s1");
    expect(quoteSessionId({ _id: "s2" })).toBe("s2");
    expect(quoteSessionId(null)).toBeNull();
  });
});
