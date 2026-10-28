// Orders tab helpers: GET /orders/user/:id → rows the profile dialog can show.
// Orders are what checkout created (PhonePe or cash on delivery), with their
// payment status; invoices (the Purchases tab) come from the CRM separately.

export type OrderLine = {
  productId: string | null;
  name: string;
  qty: number;
  price: number | null;
};

export type OrderRowData = {
  id: string;
  number: string;
  date: string | null;
  lines: OrderLine[];
  total: number | null;
  cod: boolean;
  paymentStatus: string;
  orderStatus: string;
  address: Record<string, unknown> | null;
};

export type PayTone = "ok" | "wait" | "warn" | "bad";

const str = (v: unknown) => (v == null ? "" : String(v).trim());
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// Accepts { data: [...] }, [...] or { data: { orders: [...] } }; newest first.
export function normalizeOrders(res: unknown): OrderRowData[] {
  const r = res as { data?: unknown } | unknown[] | null;
  const list = Array.isArray(r)
    ? r
    : Array.isArray((r as { data?: unknown })?.data)
      ? ((r as { data: unknown[] }).data as unknown[])
      : Array.isArray(
            ((r as { data?: { orders?: unknown } })?.data || {}).orders,
          )
        ? ((r as { data: { orders: unknown[] } }).data.orders as unknown[])
        : [];
  return list
    .filter((o): o is Record<string, unknown> => !!o && typeof o === "object")
    .map((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      return {
        id: str(o._id) || str(o.orderId) || str(o.transactionId),
        number: str(o.orderId) || str(o.transactionId) || "Order",
        date: str(o.createdAt) || str(o.orderDate) || null,
        lines: items
          .filter(
            (i): i is Record<string, unknown> => !!i && typeof i === "object",
          )
          .map((i) => ({
            productId: str(i.productId) || null,
            name:
              str(i.name || i.title).replace(/\s*\|\s*aquakart\s*$/i, "") ||
              "Item",
            qty: Math.max(1, num(i.quantity) || 1),
            price: num(i.price),
          })),
        total: num(o.totalAmount),
        cod: /cash\s*on\s*delivery|^cod$/i.test(
          `${str(o.paymentMethod)} ${str(o.orderType)}`.trim(),
        ),
        paymentStatus: str(o.paymentStatus),
        orderStatus: str(o.orderStatus),
        address:
          o.shippingAddress && typeof o.shippingAddress === "object"
            ? (o.shippingAddress as Record<string, unknown>)
            : null,
      };
    })
    .filter((o) => o.id)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

// The payment chip: paid, due on delivery, still being confirmed, or failed.
export function paymentView(o: Pick<OrderRowData, "cod" | "paymentStatus">): {
  label: string;
  tone: PayTone;
} {
  const s = o.paymentStatus.toLowerCase();
  if (/paid|success|complete|captured/.test(s))
    return { label: "Paid", tone: "ok" };
  if (/fail|declin|cancel|expire|error/.test(s))
    return { label: "Payment failed", tone: "bad" };
  if (o.cod) return { label: "Pay on delivery", tone: "wait" };
  return { label: "Payment pending", tone: "warn" };
}

export const orderTitle = (o: OrderRowData) => {
  const first = o.lines[0]?.name;
  if (!first) return `Order ${o.number}`;
  return o.lines.length > 1 ? `${first} + ${o.lines.length - 1} more` : first;
};
