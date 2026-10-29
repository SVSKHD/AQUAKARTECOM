import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getCheckoutPayment = vi.fn();
vi.mock("@/services/order", () => ({
  default: { getCheckoutPayment, createCheckoutQuote: vi.fn() },
}));

const { waitForCheckoutPayment } = await import("./aquaCommerce");

describe("aquaCommerce payment polling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getCheckoutPayment.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("times out instead of guessing", async () => {
    getCheckoutPayment.mockResolvedValue({ data: { status: "pending" } });
    const w = waitForCheckoutPayment("att1", "tok", {
      intervalMs: 1000,
      timeoutMs: 3000,
    });
    await vi.advanceTimersByTimeAsync(5000);
    await expect(w.done).resolves.toEqual({ status: "timeout", order: null });
  });

  it("stops polling after cancel", async () => {
    getCheckoutPayment.mockResolvedValue({ data: { status: "pending" } });
    const w = waitForCheckoutPayment("att1", "tok", { intervalMs: 1000 });
    await vi.advanceTimersByTimeAsync(10);
    w.cancel();
    const calls = getCheckoutPayment.mock.calls.length;
    await vi.advanceTimersByTimeAsync(5000);
    expect(getCheckoutPayment.mock.calls.length).toBe(calls);
  });
});
