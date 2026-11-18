import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const router = {
  isReady: true,
  query: { token: "tok" } as Record<string, string>,
  asPath: "/pay/tok/success",
  replace: vi.fn(async () => true),
};
vi.mock("next/router", () => ({ useRouter: () => router }));

let auth: Record<string, unknown>;
vi.mock("@/context/AuthContext", () => ({ useAuth: () => auth }));

const api = {
  getOfflineStatus: vi.fn(),
  getOfflineSummary: vi.fn(),
  getProductCatalogue: vi.fn(),
};
vi.mock("@/services/offlinePayment", async (orig) => ({
  ...(await orig<typeof import("@/services/offlinePayment")>()),
  ...api,
}));

const { default: OfflinePaySuccess } = await import("./OfflinePaySuccess");
const { OfflinePaymentError } = await import("@/services/offlinePayment");

const status = (s: string, over: Record<string, unknown> = {}) => ({
  status: s,
  reference: "AQPI|20261118|0001",
  invoiceNumber: null,
  invoiceId: null,
  invoiceReady: false,
  amount: 24990,
  amountPaid: 24990,
  transactionId: "TX1",
  ...over,
});

afterEach(() => {
  vi.useRealTimers();
  window.sessionStorage.clear();
});

beforeEach(() => {
  router.replace.mockClear();
  api.getOfflineStatus.mockReset();
  api.getOfflineSummary.mockReset().mockRejectedValue(new Error("offline"));
  api.getProductCatalogue.mockReset().mockResolvedValue(null);
  auth = {
    authenticated: true,
    authReady: true,
    loading: false,
    session: { token: "jwt", user: { _id: "u1" } },
  };
});

describe("/pay/[token]/success", () => {
  it("sends a signed-out visitor back to the payment page", async () => {
    auth = { ...auth, authenticated: false, session: null };
    render(<OfflinePaySuccess />);
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/pay/tok"),
    );
    expect(api.getOfflineStatus).not.toHaveBeenCalled();
  });

  it("sends another account back (the status endpoint refuses it)", async () => {
    api.getOfflineStatus.mockRejectedValueOnce(
      new OfflinePaymentError("Linked elsewhere", "bound", 403),
    );
    render(<OfflinePaySuccess />);
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/pay/tok"),
    );
    expect(screen.queryByText(/payment received/i)).toBeNull();
  });

  it("sends the bound user back while the payment isn't paid yet", async () => {
    api.getOfflineStatus.mockResolvedValueOnce(status("pending"));
    render(<OfflinePaySuccess />);
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/pay/tok"),
    );
  });

  it("hides Download invoice until the invoice is ready", async () => {
    api.getOfflineStatus.mockResolvedValueOnce(status("paid"));
    render(<OfflinePaySuccess />);
    expect(await screen.findByText(/payment received/i)).toBeInTheDocument();
    expect(screen.getAllByText(/₹24,990/).length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("link", { name: /download invoice/i }),
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: /view my purchases/i }),
    ).toHaveAttribute("href", "/invoices");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("links Download invoice to the invoice page once it exists", async () => {
    api.getOfflineStatus.mockResolvedValueOnce(
      status("paid", {
        invoiceNumber: "AQ/26/0042",
        invoiceId: "inv1",
        invoiceReady: true,
      }),
    );
    render(<OfflinePaySuccess />);
    expect(
      await screen.findByRole("link", { name: /download invoice/i }),
    ).toHaveAttribute("href", "/invoice/inv1");
    expect(screen.getByText("AQ/26/0042")).toBeInTheDocument();
  });

  it("shows the invoice number but no download link while the API sends no invoice id", async () => {
    api.getOfflineStatus.mockResolvedValueOnce(
      status("paid", { invoiceNumber: "AQ/26/0042", invoiceReady: true }),
    );
    render(<OfflinePaySuccess />);
    expect(await screen.findByText("AQ/26/0042")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /download invoice/i }),
    ).toBeNull();
  });

  it("doesn't wait for the Google restore when a session is saved", async () => {
    auth = { ...auth, authReady: false };
    api.getOfflineStatus.mockResolvedValueOnce(status("paid"));
    render(<OfflinePaySuccess />);
    expect(await screen.findByText(/payment received/i)).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("shows the receipt /pay just confirmed straight away", async () => {
    window.sessionStorage.setItem(
      "aq-pay-paid:tok",
      JSON.stringify(status("paid", { reference: "Q-77" })),
    );
    api.getOfflineStatus.mockReturnValue(new Promise(() => {}));
    render(<OfflinePaySuccess />);
    expect(await screen.findByText(/payment received/i)).toBeInTheDocument();
    expect(screen.getByText("Q-77")).toBeInTheDocument();
  });

  it("retries a failed check instead of bouncing back to /pay", async () => {
    vi.useFakeTimers();
    api.getOfflineStatus
      .mockRejectedValueOnce(new OfflinePaymentError("timeout", "other"))
      .mockResolvedValueOnce(status("paid"));
    render(<OfflinePaySuccess />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    expect(screen.getByText(/payment received/i)).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("offers Try again after repeated failures, and stays put", async () => {
    vi.useFakeTimers();
    api.getOfflineStatus.mockRejectedValue(
      new OfflinePaymentError("Too many requests", "other", 429),
    );
    render(<OfflinePaySuccess />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });
    expect(screen.getByText(/couldn't load your receipt/i)).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
    api.getOfflineStatus.mockResolvedValueOnce(status("paid"));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    });
    expect(screen.getByText(/payment received/i)).toBeInTheDocument();
  });

  it("keeps the receipt when a later invoice check fails", async () => {
    vi.useFakeTimers();
    api.getOfflineStatus
      .mockResolvedValueOnce(status("paid"))
      .mockRejectedValueOnce(new OfflinePaymentError("timeout", "other"))
      .mockResolvedValueOnce(
        status("paid", { invoiceNumber: "AQ/26/0050", invoiceReady: true }),
      );
    render(<OfflinePaySuccess />);
    // One act per step: React renders (and schedules the next check) between.
    for (let i = 0; i < 3; i++)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5050);
      });
    expect(screen.getByText("AQ/26/0050")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("shows the order amount when the API reports 0 paid", async () => {
    api.getOfflineStatus.mockResolvedValueOnce(
      status("paid", { amountPaid: 0 }),
    );
    render(<OfflinePaySuccess />);
    expect((await screen.findAllByText(/₹24,990/)).length).toBeGreaterThan(0);
  });
});

describe("/pay/[token]/success receipt", () => {
  it("thanks the customer by first name and shows what happens next", async () => {
    auth = {
      ...auth,
      session: { token: "jwt", user: { _id: "u1", name: "Ravi Kumar" } },
    };
    api.getOfflineStatus.mockResolvedValueOnce(status("paid"));
    render(<OfflinePaySuccess />);
    expect(
      await screen.findByRole("heading", { name: "Thank you, Ravi!" }),
    ).toBeInTheDocument();
    const steps = screen.getByRole("list", { name: /what happens next/i });
    expect(steps).toHaveTextContent(/payment confirmed/i);
    expect(steps).toHaveTextContent(/being prepared/i);
    expect(steps).toHaveTextContent(/delivery & installation/i);
  });

  it("lists the order's items with their catalogue photo, and folds away", async () => {
    api.getOfflineStatus.mockResolvedValueOnce(status("paid"));
    api.getOfflineSummary.mockResolvedValueOnce({
      reference: "AQPI|20261118|0001",
      lines: [
        {
          name: "Kent Automatic 8L",
          description: "",
          quantity: 2,
          imageUrl: null,
        },
      ],
      subtotal: null,
      discount: null,
      tax: null,
      total: 24990,
      currency: "INR",
      expiresAt: null,
      paid: true,
      phoneMasked: "",
    });
    api.getProductCatalogue.mockResolvedValueOnce([
      {
        _id: "p1",
        title: "Kent Automatic 8L",
        slug: "kent-automatic-8l",
        brand: "Kent",
        photos: [{ delivery_url: "https://img.example/kent.jpg" }],
      },
    ]);
    const { container } = render(<OfflinePaySuccess />);
    const toggle = await screen.findByRole("button", {
      name: /your order · 1 item/i,
    });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await waitFor(() =>
      expect(
        container.querySelector('img[src="https://img.example/kent.jpg"]'),
      ).not.toBeNull(),
    );
    expect(screen.getByText("× 2")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /kent automatic 8l/i }),
    ).toHaveAttribute("href", "/product/kent-automatic-8l");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("copies the payment ID", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    api.getOfflineStatus.mockResolvedValueOnce(status("paid"));
    render(<OfflinePaySuccess />);
    const copy = await screen.findByRole("button", { name: "Copy Payment ID" });
    await act(async () => {
      fireEvent.click(copy);
    });
    expect(writeText).toHaveBeenCalledWith("TX1");
    expect(
      screen.getByRole("button", { name: "Payment ID copied" }),
    ).toBeInTheDocument();
  });

  it("opens WhatsApp with the reference and payment ID filled in", async () => {
    api.getOfflineStatus.mockResolvedValueOnce(status("paid"));
    render(<OfflinePaySuccess />);
    const wa = await screen.findByRole("link", { name: /whatsapp us/i });
    const text = new URL(wa.getAttribute("href") || "").searchParams.get(
      "text",
    );
    expect(text).toContain("AQPI|20261118|0001");
    expect(text).toContain("TX1");
  });

  it("prints the receipt", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    api.getOfflineStatus.mockResolvedValueOnce(status("paid"));
    render(<OfflinePaySuccess />);
    fireEvent.click(
      await screen.findByRole("button", { name: /print receipt/i }),
    );
    expect(print).toHaveBeenCalled();
    print.mockRestore();
  });
});
