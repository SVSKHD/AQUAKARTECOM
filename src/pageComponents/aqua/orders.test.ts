import { describe, expect, it } from "vitest";
import { normalizeOrders, orderTitle, paymentView } from "./orders";

const raw = [
  {
    _id: "o1",
    orderId: "AQOD-1",
    createdAt: "2026-10-01T10:00:00.000Z",
    items: [
      {
        productId: "p1",
        name: "Kent Automatic 8L | Aquakart",
        quantity: 1,
        price: 31500,
      },
    ],
    totalAmount: 31500,
    paymentMethod: "Gateway",
    paymentStatus: "Failed",
    orderStatus: "Processing",
    shippingAddress: { street: "Plot 12", city: "Hyderabad" },
  },
  {
    _id: "o2",
    orderId: "AQOD-2",
    createdAt: "2026-10-20T10:00:00.000Z",
    items: [
      {
        productId: "p2",
        name: "Kent Bathroom Softener",
        quantity: 2,
        price: 14500,
      },
      { name: "Installation", quantity: 1 },
    ],
    totalAmount: 29000,
    paymentMethod: "Cash On Delivery",
    paymentStatus: "Pending",
    orderStatus: "Processing",
  },
];

describe("orders", () => {
  it("normalizes the API list, newest first, without the site suffix", () => {
    const rows = normalizeOrders({ success: true, data: raw });
    expect(rows.map((r) => r.number)).toEqual(["AQOD-2", "AQOD-1"]);
    expect(rows[1].lines[0]).toEqual({
      productId: "p1",
      name: "Kent Automatic 8L",
      qty: 1,
      price: 31500,
    });
    expect(rows[0].cod).toBe(true);
    expect(rows[1].cod).toBe(false);
    expect(rows[0].lines[1]).toMatchObject({ productId: null, price: null });
  });

  it("copes with odd shapes", () => {
    expect(normalizeOrders(null)).toEqual([]);
    expect(normalizeOrders({ data: { orders: raw } })).toHaveLength(2);
    expect(normalizeOrders(raw)).toHaveLength(2);
    expect(normalizeOrders({ data: [null, "x", {}] })).toEqual([]);
  });

  it("labels the payment for each case", () => {
    expect(paymentView({ cod: false, paymentStatus: "Paid" })).toEqual({
      label: "Paid",
      tone: "ok",
    });
    expect(paymentView({ cod: false, paymentStatus: "Failed" }).label).toBe(
      "Payment failed",
    );
    expect(paymentView({ cod: true, paymentStatus: "Pending" }).label).toBe(
      "Pay on delivery",
    );
    expect(paymentView({ cod: false, paymentStatus: "Processing" }).label).toBe(
      "Payment pending",
    );
  });

  it("titles an order by its first item", () => {
    const [cod, online] = normalizeOrders(raw);
    expect(orderTitle(cod)).toBe("Kent Bathroom Softener + 1 more");
    expect(orderTitle(online)).toBe("Kent Automatic 8L");
  });
});
