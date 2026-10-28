import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ActiveCoupon } from "./coupons";
import type { CheckoutDraft, QuoteState } from "./types";

vi.mock("@/utils/aquaCommerce", () => ({
  quote: vi.fn(async () => ({
    id: "cs1",
    subtotal: 30000,
    payableAmount: 27000,
  })),
}));

const { default: InlineCheckout } = await import("./InlineCheckout");
const { quote } = (await import("@/utils/aquaCommerce")) as unknown as {
  quote: ReturnType<typeof vi.fn>;
};

const coupon = (over: Partial<ActiveCoupon>): ActiveCoupon => ({
  code: "C",
  description: "",
  discountType: "percentage",
  discountValue: 10,
  maxDiscount: null,
  minimumOrder: 0,
  endsAt: "2099-01-31",
  firstOrderOnly: false,
  productIds: [],
  categoryIds: [],
  ...over,
});

const baseDraft: CheckoutDraft = {
  source: "buy",
  items: [
    { id: "p1", qty: 1, variant: 0, title: "Kent Automatic 8L", price: 30000 },
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

function Harness({
  commerceLive = false,
  signedIn = true,
  onPay = vi.fn(),
  onSignIn = vi.fn(),
}: {
  commerceLive?: boolean;
  signedIn?: boolean;
  onPay?: () => void;
  onSignIn?: () => void;
}) {
  const [draft, setDraft] = useState<CheckoutDraft | null>(baseDraft);
  const [quoteState, setQuoteState] = useState<QuoteState>({ status: "idle" });
  if (!draft) return null;
  return (
    <>
      <InlineCheckout
        draft={draft}
        setDraft={setDraft}
        savedAddresses={[]}
        coupons={[
          coupon({ code: "WATER10", maxDiscount: 2000 }),
          coupon({ code: "BIGBUY", minimumOrder: 50000 }),
        ]}
        categoryOf={() => "cat1"}
        quoteState={quoteState}
        setQuoteState={setQuoteState}
        commerceLive={commerceLive}
        catalogueLive
        signedIn={signedIn}
        token={null}
        onPay={onPay}
        onSignIn={onSignIn}
      />
      <output data-testid="draft">{`${draft.coupon}|${draft.payMethod}`}</output>
    </>
  );
}

describe("InlineCheckout offers and payment", () => {
  it("applies a coupon from its card and explains the ones that don't apply", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getByText("1 available")).toBeInTheDocument();
    expect(screen.getByText("Add ₹20,000 more")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /apply water10, save ₹2,000/i }),
    );
    expect(screen.getByTestId("draft")).toHaveTextContent("WATER10|online");
    expect(screen.getByLabelText("Coupon code")).toHaveValue("WATER10");
    expect(screen.getByText("Applied")).toBeInTheDocument();
  });

  it("switches between paying online and cash on delivery", async () => {
    const user = userEvent.setup();
    render(<Harness commerceLive />);
    const online = screen.getByRole("radio", { name: /pay online/i });
    const cod = screen.getByRole("radio", { name: /cash on delivery/i });
    expect(online).toHaveAttribute("aria-checked", "true");
    expect(
      await screen.findByRole("button", {
        name: "Pay ₹27,000 securely with PhonePe",
      }),
    ).toBeInTheDocument();
    await user.click(cod);
    expect(cod).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("draft")).toHaveTextContent("|cod");
    expect(
      screen.getByRole("button", {
        name: "Place order · pay ₹27,000 on delivery",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/nothing is charged now/i)).toBeInTheDocument();
  });

  it("asks a guest to sign in instead of running a demo payment", async () => {
    const user = userEvent.setup();
    const onPay = vi.fn();
    const onSignIn = vi.fn();
    render(<Harness signedIn={false} onPay={onPay} onSignIn={onSignIn} />);
    await user.click(
      await screen.findByRole("button", { name: "Sign in to pay" }),
    );
    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(onPay).not.toHaveBeenCalled();
    await user.click(screen.getByRole("radio", { name: /cash on delivery/i }));
    expect(
      screen.getByRole("button", { name: "Sign in to place order" }),
    ).toBeEnabled();
  });

  it("keeps the old total on screen while a new quantity is priced, then counts to the new one", async () => {
    const user = userEvent.setup();
    render(<Harness commerceLive />);
    await screen.findByRole("button", {
      name: "Pay ₹27,000 securely with PhonePe",
    });
    let resolve: (v: unknown) => void = () => {};
    // The mock counts calls across tests: wait for this test's re-quote.
    const before = quote.mock.calls.length;
    quote.mockImplementationOnce(() => new Promise((r) => (resolve = r)));
    await user.click(
      screen.getByRole("button", { name: /increase quantity/i }),
    );
    // Updating: nothing disappears, the button keeps its amount and waits.
    expect(await screen.findByText("Updating…")).toBeInTheDocument();
    const pay = screen.getByRole("button", {
      name: "Pay ₹27,000 securely with PhonePe",
    });
    expect(pay).toBeDisabled();
    expect(pay).toHaveAttribute("aria-busy", "true");
    expect(screen.getAllByText("₹27,000").length).toBeGreaterThan(0);
    await waitFor(() => expect(quote.mock.calls.length).toBe(before + 1), {
      timeout: 6000,
    });
    resolve({ id: "cs2", subtotal: 60000, payableAmount: 54000 });
    expect(
      await screen.findByRole(
        "button",
        { name: "Pay ₹54,000 securely with PhonePe" },
        { timeout: 6000 },
      ),
    ).toBeEnabled();
    expect(screen.queryByText("Updating…")).not.toBeInTheDocument();
  }, 20000);
});
