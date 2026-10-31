import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CheckoutDraft } from "./types";

vi.mock("./AquaDroplet", () => ({ default: () => null }));

const { default: CodConfirmation, codSummary } =
  await import("./CodConfirmation");

const draft: CheckoutDraft = {
  source: "buy",
  items: [
    {
      id: "p1",
      qty: 2,
      variant: 0,
      variantLabel: "8 L",
      title: "Kent Automatic",
      price: 13500,
      photo: "https://img.example/kent.png",
    },
  ],
  name: "Asha",
  phone: "9876543210",
  email: "",
  address: {
    street: "Plot 12, Narsingi",
    city: "Hyderabad",
    state: "Telangana",
    postalCode: "500075",
  },
  savedAddressId: null,
  slotDay: "2099-01-02",
  slotTime: "9 am – 12 pm",
  coupon: "",
  payMethod: "cod",
};

const order = {
  orderId: "AQOD-1730000000000",
  createdAt: "2098-12-28T05:30:00.000Z",
  items: [
    { productId: "p1", name: "Kent Automatic", price: 13500, quantity: 2 },
  ],
  totalAmount: 25500,
  discounts: 1500,
  taxes: 0,
  shippingCost: 0,
  estimatedDelivery: "2099-01-04T00:00:00.000Z",
  installation: { day: "2099-01-02", slot: "9 am – 12 pm" },
  offerAppliedDetails: { code: "aqua10" },
  shippingAddress: draft.address,
};

describe("codSummary", () => {
  it("reads the saved order, with the draft's photos and contact", () => {
    const s = codSummary(order, draft, { subtotal: 27000 });
    expect(s).toMatchObject({
      orderId: "AQOD-1730000000000",
      subtotal: 27000,
      discount: 1500,
      delivery: 0,
      total: 25500,
      coupon: "AQUA10",
      name: "Asha",
      phone: "9876543210",
      address: "Plot 12, Narsingi, Hyderabad, Telangana, 500075",
      installation: { day: "2099-01-02", slot: "9 am – 12 pm" },
    });
    expect(s.lines[0]).toMatchObject({
      variant: "8 L",
      qty: 2,
      photo: "https://img.example/kent.png",
    });
  });

  it("falls back to the server's items and adds up the bill itself", () => {
    const s = codSummary(
      {
        items: [{ name: "Filter", price: 500, quantity: 3 }],
        shippingCost: 99,
      },
      null,
      null,
    );
    expect(s.lines).toEqual([
      expect.objectContaining({ title: "Filter", qty: 3, price: 500 }),
    ]);
    expect(s.subtotal).toBe(1500);
    expect(s.total).toBe(1599);
    expect(s.installation).toBeNull();
  });
});

describe("CodConfirmation", () => {
  const setup = () => {
    const props = {
      onContinue: vi.fn(),
      onViewOrders: vi.fn(),
      onNewChat: vi.fn(),
    };
    render(
      <CodConfirmation
        order={order}
        draft={draft}
        quote={{ subtotal: 27000 }}
        mood="happy"
        dark={false}
        {...props}
      />,
    );
    return props;
  };

  it("shows what to pay at the door, the bill and the next steps", () => {
    setup();
    expect(
      screen.getByRole("heading", { name: "Order placed" }),
    ).toBeInTheDocument();
    const due = screen.getByRole("region", { name: "Pay on delivery" });
    expect(within(due).getByText("₹25,500")).toBeInTheDocument();
    expect(due).toHaveTextContent(/at the door · by Sun 4 Jan/);
    expect(screen.getByText("Discount (AQUA10)")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("8 L · 2 × ₹13,500")).toBeInTheDocument();

    const steps = within(
      screen.getByRole("region", { name: "What happens next" }),
    )
      .getAllByRole("listitem")
      .map((li) => [
        li.querySelector(".aq-cod-step-label")?.textContent,
        li.dataset.state,
      ]);
    expect(steps).toEqual([
      ["Order placed", "done"],
      ["Confirmation call", "active"],
      ["Delivery · pay at the door", "todo"],
      ["Installation", "todo"],
    ]);
    expect(
      screen.getAllByText("Fri 2 Jan · 9 am – 12 pm").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Asha · 9876543210")).toBeInTheDocument();
  });

  it("opens the orders, and links WhatsApp help with the order number", async () => {
    const p = setup();
    await userEvent.click(
      screen.getByRole("button", { name: "View my orders" }),
    );
    expect(p.onViewOrders).toHaveBeenCalled();
    expect(
      screen
        .getByRole("link", { name: /ask us on whatsapp/i })
        .getAttribute("href"),
    ).toContain(encodeURIComponent("AQOD-1730000000000"));
  });
});
