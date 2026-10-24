import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getOrdersByTransactionId = vi.fn();
vi.mock("@/services/order", () => ({
  default: {
    getOrdersByTransactionId,
    createCheckoutQuote: vi.fn(),
    createPhonePePayOrder: vi.fn(),
  },
}));

const { paymentStatus, waitForPayment } = await import("./aquaCommerce");

describe("aquaCommerce payment status", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getOrdersByTransactionId.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("maps server statuses", async () => {
    getOrdersByTransactionId.mockResolvedValueOnce({
      data: [{ paymentStatus: "Paid" }],
    });
    expect((await paymentStatus("t1")).status).toBe("paid");
    getOrdersByTransactionId.mockResolvedValueOnce({
      data: { order: { paymentStatus: "PAYMENT_DECLINED" } },
    });
    expect((await paymentStatus("t1")).status).toBe("failed");
    getOrdersByTransactionId.mockResolvedValueOnce({
      data: { paymentStatus: "Pending" },
    });
    expect((await paymentStatus("t1")).status).toBe("pending");
  });

  it("only resolves paid when the server says paid, and returns the server order", async () => {
    getOrdersByTransactionId
      .mockResolvedValueOnce({ data: [{ paymentStatus: "Pending" }] })
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        data: [{ paymentStatus: "Success", orderId: "AQOD1" }],
      });
    const w = waitForPayment("t1", "tok", { intervalMs: 1000 });
    await vi.advanceTimersByTimeAsync(2500);
    await expect(w.done).resolves.toEqual({
      status: "paid",
      order: { paymentStatus: "Success", orderId: "AQOD1" },
    });
    expect(getOrdersByTransactionId).toHaveBeenCalledTimes(3);
  });

  it("times out instead of guessing", async () => {
    getOrdersByTransactionId.mockResolvedValue({
      data: [{ paymentStatus: "Pending" }],
    });
    const w = waitForPayment("t1", "tok", {
      intervalMs: 1000,
      timeoutMs: 3000,
    });
    await vi.advanceTimersByTimeAsync(5000);
    await expect(w.done).resolves.toEqual({ status: "timeout", order: null });
  });

  it("stops polling after cancel", async () => {
    getOrdersByTransactionId.mockResolvedValue({
      data: [{ paymentStatus: "Pending" }],
    });
    const w = waitForPayment("t1", "tok", { intervalMs: 1000 });
    await vi.advanceTimersByTimeAsync(10);
    w.cancel();
    const calls = getOrdersByTransactionId.mock.calls.length;
    await vi.advanceTimersByTimeAsync(5000);
    expect(getOrdersByTransactionId.mock.calls.length).toBe(calls);
  });
});
