import { render, screen } from "@testing-library/react";
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

function Harness({ commerceLive = false }: { commerceLive?: boolean }) {
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
        signedIn
        token={null}
        onPay={vi.fn()}
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
});
