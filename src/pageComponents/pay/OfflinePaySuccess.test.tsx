import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
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

const invoiceApi = {
  getInvoiceById: vi.fn(),
  loginDirectInvoiceAccess: vi.fn(),
};
const myInvoices = vi.fn();
vi.mock("@/services/invoice", () => ({
  default: invoiceApi,
  getMyInvoices: (...a: unknown[]) => myInvoices(...a),
}));

const aiChats = vi.fn();
const aiChat = vi.fn();
vi.mock("@/services/ai", () => ({
  listAiChats: (...a: unknown[]) => aiChats(...a),
  getAiChat: (...a: unknown[]) => aiChat(...a),
}));

const firebase = {
  authStateReady: vi.fn(async () => {}),
  currentUser: { getIdToken: async () => "fb-id" },
};
vi.mock("@/lib/firebase/client", () => ({ getFirebaseAuth: () => firebase }));

const downloadPdf = vi.fn(async (..._args: unknown[]) => ({
  mode: "download",
}));
vi.mock("@/utils/invoice/generatePublicInvoicePdf", () => ({
  downloadPublicInvoicePdf: downloadPdf,
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

const invoiceData = {
  _id: "inv1",
  invoice_no: "AQ/26/0042",
  date: "2026-11-18",
  customerDetails: { name: "Ravi Kumar", phone: "9876543210", address: "Hyd" },
  products: [
    {
      productName: "Kent Automatic 8L",
      productQuantity: 1,
      productPrice: 24990,
    },
  ],
  paid_status: "paid",
  gst: true,
};

const readyStatus = () =>
  status("paid", {
    invoiceNumber: "AQ/26/0042",
    invoiceId: "inv1",
    invoiceReady: true,
  });

const purchase = (over: Record<string, unknown> = {}) => ({
  id: "inv1",
  invoiceNo: "AQ/26/0042",
  date: "2026-11-18",
  paidStatus: "paid",
  itemCount: 1,
  total_price: 24990,
  items: ["Kent Automatic 8L"],
  ...over,
});

const httpError = (code: number) =>
  Object.assign(new Error(String(code)), { response: { status: code } });

afterEach(() => {
  vi.useRealTimers();
  window.sessionStorage.clear();
});

beforeEach(() => {
  router.replace.mockClear();
  api.getOfflineStatus.mockReset();
  api.getOfflineSummary.mockReset().mockRejectedValue(new Error("offline"));
  api.getProductCatalogue.mockReset().mockResolvedValue(null);
  invoiceApi.getInvoiceById.mockReset();
  invoiceApi.loginDirectInvoiceAccess.mockReset().mockResolvedValue({});
  downloadPdf.mockClear();
  myInvoices.mockReset().mockResolvedValue([]);
  aiChats.mockReset().mockResolvedValue([]);
  aiChat.mockReset().mockResolvedValue(null);
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

  it("always offers both View invoice and View purchases", async () => {
    api.getOfflineStatus.mockResolvedValueOnce(status("paid"));
    render(<OfflinePaySuccess />);
    expect(await screen.findByText(/payment received/i)).toBeInTheDocument();
    expect(screen.getAllByText(/₹24,990/).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /view invoice/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /view purchases/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/preparing your invoice/i)).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("shows the payment receipt until the invoice exists, then the invoice", async () => {
    vi.useFakeTimers();
    window.sessionStorage.setItem("aq-pay-invoice-shown:inv1", "1");
    invoiceApi.getInvoiceById.mockResolvedValue({ data: invoiceData });
    api.getOfflineStatus
      .mockResolvedValueOnce(status("paid"))
      .mockResolvedValueOnce(readyStatus());
    render(<OfflinePaySuccess />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    fireEvent.click(screen.getByRole("button", { name: /view invoice/i }));
    const drawer = screen.getByRole("dialog", { name: /your invoice/i });
    expect(
      within(drawer).getByRole("article", { name: /payment receipt/i }),
    ).toHaveTextContent("₹24,990");
    expect(
      within(drawer).getByRole("button", {
        name: /pdf ready with the invoice/i,
      }),
    ).toBeDisabled();
    // The next status check (5s) brings the invoice; the drawer swaps it in.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5100);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(within(drawer).getByText("Kent Automatic 8L")).toBeVisible();
    expect(
      within(drawer).getByRole("button", { name: /download pdf/i }),
    ).toBeEnabled();
  });

  it("opens the invoice in the drawer with Download PDF", async () => {
    window.sessionStorage.setItem("aq-pay-invoice-shown:inv1", "1");
    invoiceApi.getInvoiceById.mockResolvedValueOnce({ data: invoiceData });
    api.getOfflineStatus.mockResolvedValueOnce(readyStatus());
    render(<OfflinePaySuccess />);
    fireEvent.click(
      await screen.findByRole("button", { name: /view invoice/i }),
    );
    const drawer = await screen.findByRole("dialog", { name: /your invoice/i });
    expect(await within(drawer).findByText("Kent Automatic 8L")).toBeVisible();
    expect(invoiceApi.getInvoiceById).toHaveBeenCalledTimes(1);
    await act(async () => {
      fireEvent.click(
        within(drawer).getByRole("button", { name: /download pdf/i }),
      );
    });
    expect(downloadPdf).toHaveBeenCalledWith(
      expect.objectContaining({ invoice_no: "AQ/26/0042" }),
      expect.anything(),
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("downloads the invoice straight from the page, without opening it", async () => {
    window.sessionStorage.setItem("aq-pay-invoice-shown:inv1", "1");
    invoiceApi.getInvoiceById.mockResolvedValueOnce({ data: invoiceData });
    api.getOfflineStatus.mockResolvedValueOnce(readyStatus());
    render(<OfflinePaySuccess />);
    const download = await screen.findByRole("button", {
      name: /download pdf/i,
    });
    // Loaded in the background as soon as the invoice exists.
    await waitFor(() => expect(download).toBeEnabled());
    await act(async () => {
      fireEvent.click(download);
    });
    expect(downloadPdf).toHaveBeenCalledWith(
      expect.objectContaining({ invoice_no: "AQ/26/0042" }),
      expect.anything(),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the drawer by itself once the invoice is ready", async () => {
    vi.useFakeTimers();
    invoiceApi.getInvoiceById.mockResolvedValueOnce({ data: invoiceData });
    api.getOfflineStatus.mockResolvedValueOnce(readyStatus());
    render(<OfflinePaySuccess />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1700);
    });
    expect(screen.getByRole("dialog", { name: /your invoice/i })).toBeTruthy();
    expect(window.sessionStorage.getItem("aq-pay-invoice-shown:inv1")).toBe(
      "1",
    );
  });

  it("finds the invoice in the purchases when the status has no id", async () => {
    window.sessionStorage.setItem("aq-pay-invoice-shown:inv1", "1");
    myInvoices.mockResolvedValue([purchase()]);
    invoiceApi.getInvoiceById.mockResolvedValueOnce({ data: invoiceData });
    api.getOfflineStatus.mockResolvedValueOnce(
      status("paid", { invoiceNumber: "AQ/26/0042", invoiceReady: true }),
    );
    render(<OfflinePaySuccess />);
    fireEvent.click(
      await screen.findByRole("button", { name: /view invoice/i }),
    );
    const drawer = screen.getByRole("dialog", { name: /your invoice/i });
    expect(await within(drawer).findByText("Kent Automatic 8L")).toBeVisible();
    expect(myInvoices).toHaveBeenCalledWith("jwt");
    expect(invoiceApi.getInvoiceById.mock.calls[0][0]).toBe("inv1");
  });

  it("lists purchases in the drawer and opens any of them there", async () => {
    window.sessionStorage.setItem("aq-pay-invoice-shown:inv1", "1");
    myInvoices.mockResolvedValue([
      purchase(),
      purchase({
        id: "inv0",
        invoiceNo: "AQ/26/0007",
        items: ["Sediment filter"],
        total_price: 499,
      }),
    ]);
    invoiceApi.getInvoiceById.mockImplementation(async (id: string) => ({
      data:
        id === "inv0"
          ? {
              ...invoiceData,
              _id: "inv0",
              invoice_no: "AQ/26/0007",
              products: [
                {
                  productName: "Sediment filter",
                  productQuantity: 1,
                  productPrice: 499,
                },
              ],
            }
          : invoiceData,
    }));
    api.getOfflineStatus.mockResolvedValueOnce(readyStatus());
    render(<OfflinePaySuccess />);
    fireEvent.click(
      await screen.findByRole("button", { name: /view purchases/i }),
    );
    const drawer = screen.getByRole("dialog", { name: /your invoice/i });
    const list = await within(drawer).findByRole("list", {
      name: /your purchases/i,
    });
    expect(within(list).getByText("This order")).toBeInTheDocument();
    fireEvent.click(within(list).getByRole("button", { name: /sediment/i }));
    expect(await within(drawer).findByText("Sediment filter")).toBeVisible();
    expect(
      within(drawer).getByRole("tab", { name: /invoice/i }),
    ).toHaveAttribute("aria-selected", "true");
    fireEvent.click(
      within(drawer).getByRole("button", { name: /back to this order/i }),
    );
    expect(await within(drawer).findByText("Kent Automatic 8L")).toBeVisible();
  });

  it("gets invoice access with the Google sign-in when the gateway refuses", async () => {
    window.sessionStorage.setItem("aq-pay-invoice-shown:inv1", "1");
    invoiceApi.getInvoiceById
      .mockRejectedValueOnce(httpError(401))
      .mockResolvedValueOnce({ data: invoiceData });
    api.getOfflineStatus.mockResolvedValueOnce(readyStatus());
    render(<OfflinePaySuccess />);
    fireEvent.click(
      await screen.findByRole("button", { name: /view invoice/i }),
    );
    const drawer = await screen.findByRole("dialog");
    expect(await within(drawer).findByText("Kent Automatic 8L")).toBeVisible();
    expect(invoiceApi.loginDirectInvoiceAccess).toHaveBeenCalledWith(
      "inv1",
      "fb-id",
    );
  });

  it("offers Try again when the invoice can't be loaded", async () => {
    window.sessionStorage.setItem("aq-pay-invoice-shown:inv1", "1");
    invoiceApi.getInvoiceById
      .mockRejectedValueOnce(httpError(500))
      .mockResolvedValueOnce({ data: invoiceData });
    api.getOfflineStatus.mockResolvedValueOnce(readyStatus());
    render(<OfflinePaySuccess />);
    fireEvent.click(
      await screen.findByRole("button", { name: /view invoice/i }),
    );
    const drawer = await screen.findByRole("dialog");
    fireEvent.click(
      await within(drawer).findByRole("button", { name: /try again/i }),
    );
    expect(await within(drawer).findByText("Kent Automatic 8L")).toBeVisible();
    expect(invoiceApi.loginDirectInvoiceAccess).not.toHaveBeenCalled();
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
    expect(screen.getAllByText("AQ/26/0050").length).toBeGreaterThan(0);
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

  it("shows the order's items with their catalogue photo", async () => {
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
    expect(await screen.findByText("1 item")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        container.querySelector('img[src="https://img.example/kent.jpg"]'),
      ).not.toBeNull(),
    );
    expect(screen.getByText("× 2")).toBeInTheDocument();
    expect(screen.getByText("Kent Automatic 8L")).toBeInTheDocument();
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

  it("shows the logo inside the PAID stamp", async () => {
    api.getOfflineStatus.mockResolvedValueOnce(status("paid"));
    render(<OfflinePaySuccess />);
    const seal = await screen.findByRole("button", {
      name: /celebrate again/i,
    });
    expect(seal.querySelector("img")).not.toBeNull();
    expect(seal.textContent).toContain("PAID");
  });

  it("lists recent chats beside the receipt and opens one in the drawer", async () => {
    aiChats.mockResolvedValue([
      {
        id: "c1",
        title: "Softener for 3BHK",
        messageCount: 4,
        lastMessageAt: new Date().toISOString(),
        pinned: false,
      },
    ]);
    aiChat.mockResolvedValue({
      id: "c1",
      title: "Softener for 3BHK",
      messages: [
        { role: "user", text: "Which softener suits a 3BHK?" },
        { role: "assistant", text: "**Kent 8L** works well." },
      ],
    });
    api.getOfflineStatus.mockResolvedValueOnce(status("paid"));
    render(<OfflinePaySuccess />);
    const recent = await screen.findByRole("list", { name: /recent chats/i });
    expect(aiChats).toHaveBeenCalledWith("jwt", { limit: 12 });
    fireEvent.click(
      within(recent).getByRole("button", { name: /softener for 3bhk/i }),
    );
    const drawer = screen.getByRole("dialog", { name: /your chats/i });
    expect(
      await within(drawer).findByText("Kent 8L works well."),
    ).toBeVisible();
    expect(aiChat).toHaveBeenCalledWith("c1", "jwt");
    expect(within(drawer).getByRole("tab", { name: /chats/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      within(drawer).getByRole("link", { name: /continue in aqua/i }),
    ).toHaveAttribute("href", "/");
    fireEvent.click(within(drawer).getByRole("button", { name: /all chats/i }));
    expect(
      within(drawer).getByRole("list", { name: /your chats/i }),
    ).toBeInTheDocument();
  });

  it("offers Ask Aqua when there are no saved chats", async () => {
    api.getOfflineStatus.mockResolvedValueOnce(status("paid"));
    render(<OfflinePaySuccess />);
    expect(
      await screen.findByText(/your chats are saved here/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ask aqua about this order/i }),
    ).toHaveAttribute("href", "/");
  });

  it("opens a recent order's invoice from the side column", async () => {
    window.sessionStorage.setItem("aq-pay-invoice-shown:inv1", "1");
    myInvoices.mockResolvedValue([
      purchase(),
      purchase({
        id: "inv0",
        invoiceNo: "AQ/26/0007",
        items: ["Sediment filter"],
        total_price: 499,
      }),
    ]);
    invoiceApi.getInvoiceById.mockImplementation(async (id: string) => ({
      data:
        id === "inv0"
          ? {
              ...invoiceData,
              _id: "inv0",
              invoice_no: "AQ/26/0007",
              products: [
                {
                  productName: "Sediment filter",
                  productQuantity: 1,
                  productPrice: 499,
                },
              ],
            }
          : invoiceData,
    }));
    api.getOfflineStatus.mockResolvedValueOnce(readyStatus());
    render(<OfflinePaySuccess />);
    const orders = await screen.findByRole("list", { name: /recent orders/i });
    expect(within(orders).getByText("This order")).toBeInTheDocument();
    fireEvent.click(within(orders).getByRole("button", { name: /sediment/i }));
    const drawer = screen.getByRole("dialog", { name: /your invoice/i });
    expect(await within(drawer).findByText("Sediment filter")).toBeVisible();
    expect(
      within(drawer).getByRole("button", { name: /back to this order/i }),
    ).toBeInTheDocument();
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
