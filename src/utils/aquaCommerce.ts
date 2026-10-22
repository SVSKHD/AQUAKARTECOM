// Inline-checkout adapter for the Aqua SPA. Reuses src/services/order.js as-is.
// Never navigates the main window: PhonePe opens in a popup and the order is
// confirmed ONLY when the server reports the payment as paid.
import orderService from "@/services/order";

type OrderService = {
  createCheckoutQuote: (data: unknown, token?: string | null) => Promise<any>;
  createPhonePePayOrder: (data: unknown, token?: string | null) => Promise<any>;
  getOrdersByTransactionId: (
    id: string,
    token?: string | null,
    config?: { signal?: AbortSignal },
  ) => Promise<any>;
};
const orders = orderService as unknown as OrderService;

export type QuoteItem = { id: string; qty: number };

export type Quote = {
  id?: string;
  _id?: string;
  subtotal?: number;
  discount?: number;
  deliveryCharge?: number;
  tax?: number;
  payableAmount?: number;
  couponCode?: string;
  [key: string]: unknown;
};

export type ServerOrder = Record<string, any>;
export type PaymentResult = {
  status: "paid" | "failed" | "timeout";
  order: ServerOrder | null;
};

export const quote = (
  items: QuoteItem[],
  couponCode: string,
  token?: string | null,
): Promise<Quote> =>
  orders
    .createCheckoutQuote(
      {
        cart: items.map((i) => ({ productId: i.id, quantity: i.qty })),
        ...(couponCode ? { couponCode } : {}),
      },
      token,
    )
    .then((r) => r?.data || r);

// Call this synchronously from the click handler, before any other await:
// window.open runs before the first await inside, so popup blockers allow it.
export async function startPhonePe(
  order: Record<string, unknown>,
  token?: string | null,
) {
  const popup = window.open("", "aquakart-phonepe", "width=480,height=760");
  try {
    const res = await orders.createPhonePePayOrder(order, token);
    const url: string | undefined =
      res?.url || res?.data?.url || res?.redirectUrl || res?.data?.redirectUrl;
    if (!url) throw new Error("PhonePe did not return a payment page");
    if (popup && !popup.closed) popup.location.href = url;
    return { url, popup };
  } catch (e) {
    popup?.close();
    throw e;
  }
}

const pickOrder = (res: any): ServerOrder | null =>
  (Array.isArray(res?.data)
    ? res.data[0]
    : res?.data?.order || res?.data || res) ?? null;

export async function paymentStatus(
  transactionId: string,
  token?: string | null,
  signal?: AbortSignal,
) {
  const res = await orders.getOrdersByTransactionId(transactionId, token, {
    signal,
  });
  const order = pickOrder(res);
  const s = String(order?.paymentStatus || "").toLowerCase();
  const status = /paid|success|complete|captured/.test(s)
    ? "paid"
    : /fail|declin|cancel/.test(s)
      ? "failed"
      : "pending";
  return { status, order } as {
    status: "paid" | "failed" | "pending";
    order: ServerOrder | null;
  };
}

// Polls until paid/failed or timeout. `checkNow()` polls immediately (used when the
// /payment-return popup reports back). The server stays the source of truth.
export function waitForPayment(
  transactionId: string,
  token?: string | null,
  { intervalMs = 3000, timeoutMs = 15 * 60000 } = {},
) {
  const ctl = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let settle: (r: PaymentResult) => void = () => {};
  let inFlight = false;
  const t0 = Date.now();

  const tick = async () => {
    if (ctl.signal.aborted || inFlight) return;
    clearTimeout(timer);
    if (Date.now() - t0 > timeoutMs)
      return settle({ status: "timeout", order: null });
    inFlight = true;
    try {
      const r = await paymentStatus(transactionId, token, ctl.signal);
      if (r.status !== "pending")
        return settle({ status: r.status, order: r.order });
    } catch {
      // network blip or abort: keep polling until timeout
    } finally {
      inFlight = false;
    }
    if (!ctl.signal.aborted) timer = setTimeout(tick, intervalMs);
  };

  const done = new Promise<PaymentResult>((resolve) => {
    settle = (r) => {
      clearTimeout(timer);
      ctl.abort();
      resolve(r);
    };
    tick();
  });

  return {
    done,
    checkNow: () => void tick(),
    cancel: () => {
      clearTimeout(timer);
      ctl.abort();
    },
  };
}
