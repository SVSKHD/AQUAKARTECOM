import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OfflineSummary } from "@/services/offlinePayment";

// ---------- mocks: router, auth, API, full-page navigation ----------
const router = {
  isReady: true,
  query: { token: "tok" } as Record<string, string>,
  asPath: "/pay/tok",
  replace: vi.fn(async () => true),
};
vi.mock("next/router", () => ({ useRouter: () => router }));

type AuthMock = {
  authenticated: boolean;
  authReady: boolean;
  loading: boolean;
  session: { token?: string; user?: Record<string, unknown> } | null;
  signInWithGoogle: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
};
let auth: AuthMock;
vi.mock("@/context/AuthContext", () => ({ useAuth: () => auth }));

const api = {
  getOfflineSummary: vi.fn(),
  getOfflineStatus: vi.fn(),
  saveOfflineCustomer: vi.fn(),
  initiateOfflinePayment: vi.fn(),
  getProductCatalogue: vi.fn(),
};
vi.mock("@/services/offlinePayment", async (orig) => ({
  ...(await orig<typeof import("@/services/offlinePayment")>()),
  ...api,
}));

const assignLocation = vi.fn();
vi.mock("@/utils/browserNav", () => ({ assignLocation }));

const { default: OfflinePayPage } = await import("./OfflinePayPage");
const { OfflinePaymentError } = await import("@/services/offlinePayment");

const home = {
  _id: "a1",
  street: "Plot 12, Narsingi",
  city: "Hyderabad",
  state: "Telangana",
  postalCode: "500075",
};

const summary = (over: Partial<OfflineSummary> = {}): OfflineSummary => ({
  reference: "AQPI|20261118|0001",
  lines: [
    {
      name: "Kent Softener 8L",
      description: "",
      quantity: 1,
      imageUrl: null,
    },
  ],
  subtotal: 24990,
  discount: 0,
  tax: 0,
  total: 24990,
  currency: "INR",
  expiresAt: null,
  paid: false,
  phoneMasked: "",
  ...over,
});

const signedIn = (user: Record<string, unknown> = {}): AuthMock => ({
  authenticated: true,
  authReady: true,
  loading: false,
  session: {
    token: "jwt",
    user: {
      _id: "u1",
      addresses: [home],
      selectedAddress: home,
      ...user,
    },
  },
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(async () => {}),
});
const signedOut = (): AuthMock => ({
  ...signedIn(),
  authenticated: false,
  session: null,
});

const fakePopup = () => ({
  closed: false,
  close: vi.fn(),
  focus: vi.fn(),
  location: { href: "" },
});

const status = (s: string, over: Record<string, unknown> = {}) => ({
  status: s,
  reference: "AQPI|20261118|0001",
  invoiceNumber: null,
  invoiceId: null,
  invoiceReady: false,
  amount: 24990,
  amountPaid: 0,
  transactionId: null,
  ...over,
});
const unbound = () =>
  new OfflinePaymentError(
    "Confirm your details before paying.",
    "details",
    409,
    "CUSTOMER_DETAILS_REQUIRED",
  );

let opener: unknown;
beforeEach(() => {
  router.query = { token: "tok" };
  router.replace.mockClear();
  assignLocation.mockReset();
  Object.values(api).forEach((f) => f.mockReset());
  api.getProductCatalogue.mockResolvedValue(null);
  auth = signedIn();
  opener = null;
  Object.defineProperty(window, "opener", {
    configurable: true,
    get: () => opener,
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const payButton = () =>
  screen.findByRole("button", { name: /pay ₹24,990 with phonepe/i });

// Signed in, details not confirmed yet: the payment form.
const toForm = () => {
  api.getOfflineSummary.mockResolvedValueOnce(summary());
  api.getOfflineStatus.mockRejectedValueOnce(unbound());
};

describe("/pay/[token]", () => {
  it("shows one 'no longer valid' screen for unknown, revoked or expired links", async () => {
    api.getOfflineSummary.mockRejectedValueOnce(
      new OfflinePaymentError("This link is no longer valid.", "invalid", 404),
    );
    render(<OfflinePayPage />);
    expect(
      await screen.findByText("This link is no longer valid"),
    ).toBeInTheDocument();
    expect(screen.getByText(/contact Aquakart/i)).toBeInTheDocument();
    expect(screen.queryByText("Your order")).not.toBeInTheDocument();
  });

  it("shows the order at once, without waiting for the sign-in check", async () => {
    auth = { ...signedOut(), authReady: false, loading: true };
    api.getOfflineSummary.mockResolvedValueOnce(summary());
    render(<OfflinePayPage />);
    expect(await screen.findByText("Your order")).toBeInTheDocument();
    expect(screen.getByText("Ref. AQPI|20261118|0001")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /checking sign-in/i }),
    ).toBeDisabled();
    expect(api.getOfflineSummary).toHaveBeenCalledWith(
      "tok",
      expect.anything(),
    );
  });

  it("labels the order neutrally and asks a signed-out visitor to sign in", async () => {
    auth = signedOut();
    api.getOfflineSummary.mockResolvedValueOnce(summary());
    render(<OfflinePayPage />);
    expect(await screen.findByText("Your order")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/pay ₹/i)).not.toBeInTheDocument();
    expect(api.getOfflineStatus).not.toHaveBeenCalled();
  });

  it("offers Open in Chrome/Safari when Google refuses an in-app browser", async () => {
    const user = userEvent.setup();
    auth = signedOut();
    auth.signInWithGoogle.mockRejectedValueOnce(
      Object.assign(new Error("disallowed_useragent"), {
        code: "auth/disallowed-useragent",
      }),
    );
    api.getOfflineSummary.mockResolvedValueOnce(summary());
    render(<OfflinePayPage />);
    await user.click(
      await screen.findByRole("button", { name: /continue with google/i }),
    );
    expect(
      await screen.findByText("Open in Chrome/Safari"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /copy link/i }),
    ).toBeInTheDocument();
  });

  it("stops a second account at a link already bound to someone else", async () => {
    api.getOfflineSummary.mockResolvedValueOnce(summary());
    api.getOfflineStatus.mockRejectedValueOnce(
      new OfflinePaymentError("Linked elsewhere", "bound", 403),
    );
    render(<OfflinePayPage />);
    expect(
      await screen.findByText("This link belongs to another account"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pay ₹/i })).toBeNull();
  });

  it("shows a masked primary mobile read-only when the API sends one, and checks the alternate", async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, "open");
    api.getOfflineSummary.mockResolvedValueOnce(
      summary({ phoneMasked: "98XXXXXX10" }),
    );
    api.getOfflineStatus.mockRejectedValueOnce(unbound());
    render(<OfflinePayPage />);
    const primary = await screen.findByLabelText("Primary mobile");
    expect(primary).toHaveValue("98XXXXXX10");
    expect(primary).toHaveAttribute("readonly");
    await user.type(screen.getByLabelText(/alternate mobile/i), "123");
    await user.click(await payButton());
    expect(screen.getByRole("alert")).toHaveTextContent(/valid 10-digit/);
    expect(open).not.toHaveBeenCalled();
    expect(api.saveOfflineCustomer).not.toHaveBeenCalled();
  });

  it("pays in the PhonePe popup and shows success only once the status endpoint says paid", async () => {
    const user = userEvent.setup();
    const popup = fakePopup();
    const order: string[] = [];
    vi.spyOn(window, "open").mockImplementation(() => {
      order.push("open");
      return popup as unknown as Window;
    });
    toForm();
    api.saveOfflineCustomer.mockImplementation(async () => {
      order.push("customer");
    });
    api.initiateOfflinePayment.mockResolvedValueOnce({
      redirectUrl: "https://phonepe.example/pay",
    });
    api.getOfflineStatus.mockResolvedValue(status("pending"));

    render(<OfflinePayPage />);
    await user.type(
      await screen.findByLabelText(/alternate mobile/i),
      "9123456780",
    );
    await user.click(await payButton());

    // The popup opens in the click, before any request.
    expect(order[0]).toBe("open");
    expect(window.open).toHaveBeenCalledWith(
      "",
      "aquakart-phonepe",
      expect.any(String),
    );
    await waitFor(() =>
      expect(popup.location.href).toBe("https://phonepe.example/pay"),
    );
    // A saved address goes as its fields; the server appends, never edits.
    expect(api.saveOfflineCustomer).toHaveBeenCalledWith(
      "tok",
      {
        address: {
          street: home.street,
          city: home.city,
          state: home.state,
          postalCode: home.postalCode,
        },
        alternatePhone: "9123456780",
      },
      "jwt",
    );
    expect(api.initiateOfflinePayment).toHaveBeenCalledWith("tok", "jwt");
    expect(await screen.findByText("Waiting for PhonePe")).toBeInTheDocument();
    await waitFor(() => expect(api.getOfflineStatus).toHaveBeenCalledTimes(2));
    expect(router.replace).not.toHaveBeenCalledWith("/pay/tok/success");

    // The PhonePe window, back on /pay/tok?return=1, reports back.
    api.getOfflineStatus.mockResolvedValue(status("paid"));
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: window.location.origin,
          data: { type: "aqua-payment-return" },
        }),
      );
    });
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/pay/tok/success"),
    );
  });

  it("sends no alternate mobile when none is given", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "open").mockReturnValue(fakePopup() as unknown as Window);
    toForm();
    api.initiateOfflinePayment.mockResolvedValueOnce({
      redirectUrl: "https://phonepe.example/pay",
    });
    api.getOfflineStatus.mockResolvedValue(status("pending"));
    render(<OfflinePayPage />);
    await user.click(await payButton());
    await waitFor(() =>
      expect(api.saveOfflineCustomer).toHaveBeenCalledWith(
        "tok",
        { address: expect.any(Object) },
        "jwt",
      ),
    );
  });

  it("ignores return messages from other origins", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "open").mockReturnValue(fakePopup() as unknown as Window);
    toForm();
    api.initiateOfflinePayment.mockResolvedValueOnce({
      redirectUrl: "https://phonepe.example/pay",
    });
    api.getOfflineStatus.mockResolvedValue(status("pending"));
    render(<OfflinePayPage />);
    await user.click(await payButton());
    await waitFor(() => expect(api.getOfflineStatus).toHaveBeenCalledTimes(2));
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: "https://evil.example",
          data: { type: "aqua-payment-return" },
        }),
      );
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(api.getOfflineStatus).toHaveBeenCalledTimes(2);
  });

  it("goes to PhonePe in this tab when the popup is blocked", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "open").mockReturnValue(null);
    toForm();
    api.initiateOfflinePayment.mockResolvedValueOnce({
      redirectUrl: "https://phonepe.example/pay2",
    });
    render(<OfflinePayPage />);
    await user.click(await payButton());
    await waitFor(() =>
      expect(assignLocation).toHaveBeenCalledWith(
        "https://phonepe.example/pay2",
      ),
    );
  });

  it("in the PhonePe popup, hands back to the Aqua tab and closes", async () => {
    router.query = { token: "tok", return: "1" };
    const postMessage = vi.fn();
    opener = { closed: false, postMessage, location: window.location };
    const close = vi.spyOn(window, "close").mockImplementation(() => {});
    api.getOfflineSummary.mockResolvedValue(summary());
    render(<OfflinePayPage />);
    expect(screen.getByText("Returning to Aquakart…")).toBeInTheDocument();
    expect(postMessage).toHaveBeenCalledWith(
      { type: "aqua-payment-return" },
      window.location.origin,
    );
    expect(close).toHaveBeenCalled();
  });

  it("same-tab return with no opener: carries on in this tab", async () => {
    router.query = { token: "tok", return: "1" };
    const close = vi.spyOn(window, "close").mockImplementation(() => {});
    api.getOfflineSummary.mockResolvedValue(summary());
    render(<OfflinePayPage />);
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/pay/tok", undefined, {
        shallow: true,
      }),
    );
    expect(close).not.toHaveBeenCalled();
    // Back on /pay/tok, the refresh/resume path below polls the status.
    expect(api.getOfflineStatus).not.toHaveBeenCalled();
  });

  it("resumes polling after a refresh (or a same-tab return) during a pending payment", async () => {
    api.getOfflineSummary.mockResolvedValueOnce(summary());
    api.getOfflineStatus
      .mockResolvedValueOnce(status("pending"))
      .mockResolvedValueOnce(status("pending"))
      .mockResolvedValue(status("paid"));
    render(<OfflinePayPage />);
    expect(await screen.findByText("Waiting for PhonePe")).toBeInTheDocument();
    // No PhonePe window to wait on: the customer can check or pay again.
    expect(
      screen.getByRole("button", { name: /pay again/i }),
    ).toBeInTheDocument();
    await waitFor(() => expect(api.getOfflineStatus).toHaveBeenCalledTimes(2));
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /check again/i }));
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/pay/tok/success"),
    );
  });

  it("goes to the success screen when this account has already paid", async () => {
    api.getOfflineSummary.mockResolvedValueOnce(summary({ paid: true }));
    api.getOfflineStatus.mockResolvedValueOnce(status("paid"));
    render(<OfflinePayPage />);
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/pay/tok/success"),
    );
  });

  it("offers another try after a failed attempt", async () => {
    api.getOfflineSummary.mockResolvedValueOnce(summary());
    api.getOfflineStatus.mockResolvedValueOnce(status("failed"));
    render(<OfflinePayPage />);
    expect(
      await screen.findByText(/last payment attempt didn't go through/),
    ).toBeInTheDocument();
    expect(await payButton()).toBeEnabled();
    expect(router.replace).not.toHaveBeenCalledWith("/pay/tok/success");
  });

  it("appends a new address instead of editing a saved one", async () => {
    const user = userEvent.setup();
    auth = signedIn({ addresses: [], selectedAddress: null });
    vi.spyOn(window, "open").mockReturnValue(fakePopup() as unknown as Window);
    toForm();
    api.initiateOfflinePayment.mockResolvedValueOnce({
      redirectUrl: "https://phonepe.example/pay",
    });
    api.getOfflineStatus.mockResolvedValue(status("pending"));
    render(<OfflinePayPage />);
    await user.type(
      await screen.findByLabelText("House, street, area"),
      "Flat 4, Kondapur, near the park",
    );
    await user.type(screen.getByLabelText("City"), "Hyderabad");
    await user.type(screen.getByLabelText("State"), "Telangana");
    await user.type(screen.getByLabelText("PIN code"), "500084");
    await user.click(screen.getByRole("button", { name: /use this address/i }));
    await user.click(await payButton());
    await waitFor(() =>
      expect(api.saveOfflineCustomer).toHaveBeenCalledWith(
        "tok",
        {
          address: {
            street: "Flat 4, Kondapur, near the park",
            city: "Hyderabad",
            state: "Telangana",
            postalCode: "500084",
          },
        },
        "jwt",
      ),
    );
  });

  it("shows the server's validation message and keeps the form", async () => {
    const user = userEvent.setup();
    const popup = fakePopup();
    vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
    toForm();
    api.saveOfflineCustomer.mockRejectedValueOnce(
      new OfflinePaymentError("Enter a valid 6-digit pincode", "other", 400),
    );
    render(<OfflinePayPage />);
    await user.click(await payButton());
    expect(
      await screen.findByText("Enter a valid 6-digit pincode"),
    ).toBeInTheDocument();
    expect(popup.close).toHaveBeenCalled();
    expect(await payButton()).toBeEnabled();
  });

  it("shows the invalid screen if the link dies while paying, and closes the popup", async () => {
    const user = userEvent.setup();
    const popup = fakePopup();
    vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
    toForm();
    api.saveOfflineCustomer.mockRejectedValueOnce(
      new OfflinePaymentError("This link is no longer valid.", "invalid", 404),
    );
    render(<OfflinePayPage />);
    await user.click(await payButton());
    expect(
      await screen.findByText("This link is no longer valid"),
    ).toBeInTheDocument();
    expect(popup.close).toHaveBeenCalled();
    expect(api.initiateOfflinePayment).not.toHaveBeenCalled();
  });

  it("opens a product's photos and details beside the order when it is chosen", async () => {
    const user = userEvent.setup();
    auth = signedOut();
    api.getOfflineSummary.mockResolvedValueOnce(
      summary({
        lines: [
          {
            name: "Kent Automatic 8L | Aquakart",
            description: "",
            quantity: 2,
            imageUrl: null,
          },
        ],
      }),
    );
    api.getProductCatalogue.mockResolvedValue([
      {
        _id: "p1",
        title: "Kent Automatic 8L | Aquakart",
        slug: "kent-auto-8l",
        brand: "Kent",
        price: 99999,
        photos: [{ delivery_url: "https://img.example/kent.jpg" }],
        description: "<ul><li><h4>Resin Volume</h4><p>8 L</p></li></ul>",
      },
    ]);
    render(<OfflinePayPage />);
    const item = await screen.findByRole("button", {
      name: /kent automatic 8l/i,
    });
    await waitFor(() =>
      expect(item.querySelector("img")).toHaveAttribute(
        "src",
        "https://img.example/kent.jpg",
      ),
    );
    await user.click(item);
    const panel = screen.getByRole("dialog", { name: "Kent Automatic 8L" });
    expect(panel).toHaveTextContent("Qty 2");
    expect(panel).toHaveTextContent("Resin Volume");
    expect(panel).toHaveTextContent("8 L");
    // The order's price only: never the catalogue's.
    expect(panel).not.toHaveTextContent("99,999");
    expect(
      screen.getByRole("link", { name: /view full product page/i }),
    ).toHaveAttribute("href", "/product/kent-auto-8l");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
