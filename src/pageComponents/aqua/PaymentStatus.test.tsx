import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Flow } from "@/utils/aquaFlow";
import { emptyPayment, type CheckoutDraft, type PaymentInfo } from "./types";

vi.mock("./AquaDroplet", () => ({ default: () => null }));

const { default: PaymentStatus } = await import("./PaymentStatus");

const live = (over: Partial<PaymentInfo>): PaymentInfo => ({
  ...emptyPayment,
  live: true,
  key: "k1",
  attemptId: "att1",
  orderId: "o1",
  orderNumber: "AQOD-1730000000000",
  url: "https://phonepe.example/pay",
  ...over,
});

const draft: CheckoutDraft = {
  source: "buy",
  items: [
    { id: "p1", qty: 1, variant: 0, title: "Kent Automatic 8L", price: 27000 },
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
  payMethod: "online",
};

const stepStates = () =>
  Object.fromEntries(
    within(screen.getByRole("list", { name: "Payment progress" }))
      .getAllByRole("listitem")
      .map((li) => [
        li.querySelector(".aq-paytl-label")?.textContent?.split(":")[0],
        li.dataset.state,
      ]),
  );

function setup(
  state: Flow["state"],
  payment: PaymentInfo,
  withDraft: CheckoutDraft | null = null,
) {
  const props = {
    onRetry: vi.fn(),
    onRetryWith: vi.fn(),
    onRecheck: vi.fn(),
    onPaymentCheck: vi.fn(),
    onVerified: vi.fn(),
    onFailed: vi.fn(),
    dispatch: vi.fn(),
  };
  render(
    <PaymentStatus
      flow={{ state, parked: null, productId: "p1" }}
      draft={withDraft}
      quoteState={{
        status: "ready",
        demo: false,
        data: { payableAmount: 27000 },
      }}
      payment={payment}
      token="tok"
      rechecking={false}
      onDemoPreview={vi.fn()}
      onNewChat={vi.fn()}
      mood="idle"
      dark={false}
      {...props}
    />,
  );
  return props;
}

describe("PaymentStatus", () => {
  it("shows the created order and its payment status while waiting", () => {
    setup(
      "payment_pending",
      live({ serverStatus: "pending", popup: { closed: false } as Window }),
    );
    expect(screen.getByText("Waiting for your payment…")).toBeInTheDocument();
    expect(screen.getByText("AQOD-1730000000000")).toBeInTheDocument();
    expect(screen.getByText("₹27,000")).toBeInTheDocument();
    expect(screen.getByText("Awaiting payment")).toBeInTheDocument();
    expect(stepStates()).toEqual({
      "Order created": "done",
      "PhonePe opened": "done",
      Payment: "active",
      Confirmed: "todo",
    });
  });

  it("shows what's being paid for: items, delivery address and slot", () => {
    setup("payment_pending", live({ serverStatus: "pending" }), draft);
    const items = screen.getByRole("list", { name: "Items" });
    expect(items).toHaveTextContent("Kent Automatic 8L");
    expect(items).toHaveTextContent("× 1");
    expect(
      screen.getByText(/Plot 12, Narsingi, Hyderabad, Telangana, 500075/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Fri 2 Jan · 9 am – 12 pm/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy order number" }),
    ).toBeInTheDocument();
  });

  it("offers retry, cash on delivery and a status re-check when payment failed", async () => {
    const user = userEvent.setup();
    const p = setup(
      "payment_failed",
      live({ serverStatus: "failed", reason: "Declined by bank" }),
    );
    expect(screen.getByText("Payment not completed")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(stepStates().Payment).toBe("failed");
    await user.click(
      screen.getByRole("button", { name: /^Pay ₹27,000 on delivery instead/ }),
    );
    expect(p.onRetryWith).toHaveBeenCalledWith("cod");
    // Help names the order so support can find it.
    expect(
      screen.getByRole("link", { name: /get help on whatsapp/i }),
    ).toHaveAttribute("href", expect.stringContaining("AQOD-1730000000000"));
  });

  it("re-checks the status from the failed screen", async () => {
    const user = userEvent.setup();
    const p = setup("payment_failed", live({ serverStatus: "failed" }));
    await user.click(
      screen.getByRole("button", { name: /^Check status again/ }),
    );
    expect(p.onRecheck).toHaveBeenCalled();
  });

  it("keeps the failed screen in place with a loader in the pressed button", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const p = setup(
      "payment_failed",
      live({ serverStatus: "failed", reason: "Declined by bank" }),
    );
    const retry = screen.getByRole("button", {
      name: /^Retry ₹27,000 with PhonePe/,
    });
    await user.click(retry);
    expect(p.onRetry).toHaveBeenCalledTimes(1);
    // Same screen: title, reason and order stay; only the button changes.
    expect(screen.getByText("Payment not completed")).toBeInTheDocument();
    expect(screen.getByText("Declined by bank")).toBeInTheDocument();
    expect(screen.getByText("AQOD-1730000000000")).toBeInTheDocument();
    expect(retry).toHaveAttribute("aria-busy", "true");
    expect(retry).toHaveTextContent("Opening PhonePe…");
    expect(screen.getByText("Starting a new payment")).toBeInTheDocument();
    // One action at a time: the rest wait.
    const cod = screen.getByRole("button", {
      name: /on delivery instead|Placing your order/,
    });
    expect(cod).toBeDisabled();
    expect(screen.getByRole("button", { name: "Edit details" })).toBeDisabled();
    await user.click(cod);
    expect(p.onRetryWith).not.toHaveBeenCalled();
    // Nothing started (the mock never moves on): the loader clears itself.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    expect(retry).toHaveAttribute("aria-busy", "false");
    expect(cod).toBeEnabled();
    vi.useRealTimers();
  });

  it("asks to check before paying again when the payment isn't confirmed", () => {
    setup("payment_failed", live({ unconfirmed: true }));
    expect(screen.getByText("Payment not confirmed yet")).toBeInTheDocument();
    expect(screen.getByText("Pending confirmation")).toBeInTheDocument();
    expect(stepStates().Payment).toBe("warn");
    expect(screen.getByText(/don't pay again/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Check status again/ }),
    ).toBeEnabled();
  });

  it("lets a failed cash-on-delivery order switch to paying online", async () => {
    const user = userEvent.setup();
    const p = setup(
      "payment_failed",
      live({ method: "cod", attemptId: null, orderNumber: null }),
    );
    expect(
      screen.getByText("Order not placed", { selector: "h2" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /^Pay ₹27,000 online instead/ }),
    );
    expect(p.onRetryWith).toHaveBeenCalledWith("online");
    expect(
      screen.queryByRole("button", { name: /^Check status again/ }),
    ).not.toBeInTheDocument();
  });

  describe("never jams while paying", () => {
    it("shows the order opening with a loader and a way to cancel", async () => {
      const user = userEvent.setup();
      const p = setup(
        "payment_pending",
        live({
          url: null,
          attemptId: null,
          orderId: null,
          orderNumber: null,
          popup: { closed: false, close: vi.fn() } as unknown as Window,
        }),
      );
      expect(
        screen.getByText("Opening PhonePe…", { selector: "h2" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/nothing is charged until you approve/i),
      ).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Cancel payment" }));
      expect(p.onFailed).toHaveBeenCalledWith(
        "You cancelled before PhonePe opened. Nothing was charged.",
      );
    });

    it("notices the PhonePe window closed before it opened", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const popup = { closed: true, close: vi.fn() } as unknown as Window;
      const p = setup(
        "payment_pending",
        live({ url: null, attemptId: null, orderId: null, popup }),
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(700);
      });
      expect(
        screen.getByText("You closed the PhonePe window"),
      ).toBeInTheDocument();
      expect(screen.getByText("Window closed")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /^Cancel payment/ }));
      expect(popup.close).toHaveBeenCalled();
      expect(p.onFailed).toHaveBeenCalledWith(
        expect.stringMatching(/nothing was charged/i),
      );
      vi.useRealTimers();
    });

    it("offers to open PhonePe when the browser blocked the window", () => {
      setup("payment_pending", live({ popup: null }));
      expect(screen.getByText("Open PhonePe to pay")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Open PhonePe/ }),
      ).toBeEnabled();
    });

    it("asks whether you paid once you're back from PhonePe, and lets you say you cancelled", async () => {
      const user = userEvent.setup();
      const p = setup(
        "payment_pending",
        live({
          serverStatus: "pending",
          popup: { closed: true, close: vi.fn() } as unknown as Window,
        }),
      );
      expect(screen.getByText("Did you finish paying?")).toBeInTheDocument();
      expect(screen.getByText("Pending confirmation")).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: /I cancelled \/ didn't pay/ }),
      );
      expect(p.onFailed).toHaveBeenCalledWith(
        expect.stringMatching(/cancelled or didn't finish paying/i),
      );
    });
  });
});
