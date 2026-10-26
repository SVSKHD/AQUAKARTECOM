// Inline-checkout adapter for the Aqua SPA. Reuses src/services/order.js.
// Never navigates the main window: PhonePe opens in a popup and the order is
// confirmed ONLY when the server reports the payment as paid.
//
// Flow (server-authoritative, what production serves):
//   POST /checkout/quote  → checkout session (id, payableAmount, …)
//   POST /payments        → { id, orderId, redirectUrl }   charges session.payableAmount
//   GET  /payments/:id    → { status }                     set by the PhonePe webhook
//   POST /checkout/orders/cod → order                      cash on delivery, no gateway
// The legacy POST /order/pay path (startPhonePe / waitForPayment) is kept for reference.
import orderService from "@/services/order";

type OrderService = {
  createCheckoutQuote: (data: unknown, token?: string | null) => Promise<any>;
  createCheckoutPayment: (
    data: unknown,
    token: string | null | undefined,
    idempotencyKey: string,
  ) => Promise<any>;
  createCheckoutCodOrder: (
    data: unknown,
    token?: string | null,
  ) => Promise<any>;
  getCheckoutPayment: (
    id: string,
    token?: string | null,
    config?: { signal?: AbortSignal },
  ) => Promise<any>;
  getOrdersByUserId: (id: string, token?: string | null) => Promise<any>;
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
  rewardCredit?: number;
  deliveryCharge?: number;
  tax?: number;
  payableAmount?: number;
  coupon?: { code: string; status: string } | null;
  couponCode?: string;
  expiresAt?: string;
  [key: string]: unknown;
};

export type ServerOrder = Record<string, any>;
export type PaymentResult = {
  status: "paid" | "failed" | "timeout";
  order: ServerOrder | null;
};
type Check = {
  status: "paid" | "failed" | "pending";
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

export const quoteSessionId = (q?: Quote | null) =>
  q && (q.id || q._id) ? String(q.id || q._id) : null;

const toStatus = (value: unknown): Check["status"] => {
  const s = String(value || "").toLowerCase();
  return /paid|success|complete|captured/.test(s)
    ? "paid"
    : /fail|declin|cancel|expire|error/.test(s)
      ? "failed"
      : "pending";
};

// ---------- POST /payments ----------

export type CheckoutPaymentBody = {
  checkoutSessionId: string;
  shippingAddress: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
  gateway?: string;
};

export class CheckoutPaymentError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "CheckoutPaymentError";
    this.status = status;
  }
  // The quote's checkout session is no longer usable: quote again before paying.
  get sessionExpired() {
    return this.status === 409;
  }
}

// Call synchronously from the click handler: the popup opens before any await,
// so popup blockers allow it. `prepare` runs after that (e.g. a fresh quote for a
// retry, since a session is consumed once a payment is created).
export function startCheckoutPayment(
  prepare: () => Promise<CheckoutPaymentBody> | CheckoutPaymentBody,
  token: string | null | undefined,
  idempotencyKey: string,
) {
  const popup = window.open("", "aquakart-phonepe", "width=480,height=760");
  return (async () => {
    try {
      const body = await prepare();
      const res = await orders.createCheckoutPayment(
        { gateway: "phonepe", ...body },
        token,
        idempotencyKey,
      );
      const data = res?.data || res;
      const url: string | undefined = data?.redirectUrl || data?.url;
      const attemptId = data?.id || data?._id;
      if (!url || !attemptId)
        throw new CheckoutPaymentError("PhonePe did not return a payment page");
      if (popup && !popup.closed) popup.location.href = url;
      return {
        attemptId: String(attemptId),
        orderId: data?.orderId ? String(data.orderId) : null,
        url,
        popup,
        amount: data?.amount,
      };
    } catch (e) {
      popup?.close();
      if (e instanceof CheckoutPaymentError) throw e;
      const err = e as { message?: string; status?: number };
      throw new CheckoutPaymentError(
        err?.message || "Couldn't start the payment.",
        err?.status,
      );
    }
  })();
}

// Cash on delivery: the server turns the quoted checkout session into an order
// (payment "Pending" until it's collected). A session that timed out is quoted
// again once, so a slow customer doesn't have to start over.
export async function placeCodOrder(
  body: CheckoutPaymentBody,
  token: string | null | undefined,
  requote: () => Promise<string | null>,
): Promise<ServerOrder> {
  const send = (checkoutSessionId: string) =>
    orders
      .createCheckoutCodOrder({ ...body, checkoutSessionId }, token)
      .then((r) => (r?.data || r) as ServerOrder);
  try {
    return await send(body.checkoutSessionId);
  } catch (e) {
    const message = (e as Error)?.message || "";
    if (!/expired|invalid/i.test(message)) throw e;
    const fresh = await requote();
    if (!fresh) throw e;
    return send(fresh);
  }
}

export async function checkoutPaymentStatus(
  attemptId: string,
  token?: string | null,
  signal?: AbortSignal,
): Promise<Check> {
  const res = await orders.getCheckoutPayment(attemptId, token, { signal });
  const attempt = res?.data || res;
  return { status: toStatus(attempt?.status), order: attempt || null };
}

// Best effort: the order created for a paid attempt (for the confirmation screen).
export async function findOrder(
  orderId: string | null,
  userId: string | null | undefined,
  token?: string | null,
) {
  if (!orderId || !userId) return null;
  try {
    const res = await orders.getOrdersByUserId(userId, token);
    const list = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
        ? res
        : res?.data?.orders || [];
    return (
      (list as ServerOrder[]).find((o) => String(o?._id) === orderId) || null
    );
  } catch {
    return null;
  }
}

// ---------- polling ----------

// Polls `check` until paid/failed or timeout. `checkNow()` polls at once (used
// when the PhonePe window reports back). The server stays the source of truth.
function pollUntilSettled(
  check: (signal: AbortSignal) => Promise<Check>,
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
      const r = await check(ctl.signal);
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

export const waitForCheckoutPayment = (
  attemptId: string,
  token?: string | null,
  opts?: { intervalMs?: number; timeoutMs?: number },
) =>
  pollUntilSettled(
    (signal) => checkoutPaymentStatus(attemptId, token, signal),
    opts,
  );

// ---------- legacy POST /order/pay ----------

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
): Promise<Check> {
  const res = await orders.getOrdersByTransactionId(transactionId, token, {
    signal,
  });
  const order = pickOrder(res);
  return { status: toStatus(order?.paymentStatus), order };
}

export const waitForPayment = (
  transactionId: string,
  token?: string | null,
  opts?: { intervalMs?: number; timeoutMs?: number },
) =>
  pollUntilSettled(
    (signal) => paymentStatus(transactionId, token, signal),
    opts,
  );

// Message the PhonePe window sends back to the Aqua tab (see pages/order/[id].js).
export const PAYMENT_RETURN_MESSAGE = "aqua-payment-return";
export const PAYMENT_WINDOW_NAME = "aquakart-phonepe";
