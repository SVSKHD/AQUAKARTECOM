import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { INVOICE_FLOW_PHASE } from "@/features/invoiceDiscovery/flow";
import InvoiceShareDialog from "./InvoiceShareDialog";

const baseProps = {
  open: true,
  phase: INVOICE_FLOW_PHASE.CONFIRMING,
  invoice: {
    id: "invoice-1",
    invoiceNo: "AQ-1001",
    emailStatus: "missing",
    claimRequired: true,
    canView: false,
  },
  googleEmail: "customer@example.com",
  deliveryEmail: "customer@example.com",
  error: "",
  message: "",
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  onSwitchAccount: vi.fn(),
  onDeliveryEmailChange: vi.fn(),
  onSend: vi.fn(),
  onWhatsApp: vi.fn(),
  whatsappSending: false,
};

describe("InvoiceShareDialog", () => {
  it("asks before adding a missing invoice email", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<InvoiceShareDialog {...baseProps} onConfirm={onConfirm} />);

    expect(
      screen.getByRole("heading", { name: /confirm the invoice email/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("customer@example.com")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /use this email/i }));
    expect(onConfirm).toHaveBeenCalledWith("use-google-email");
  });

  it("offers update, keep, switch and cancel for a different email", () => {
    render(
      <InvoiceShareDialog
        {...baseProps}
        invoice={{
          ...baseProps.invoice,
          emailStatus: "different",
          maskedExistingEmail: "ol***@e***.com",
        }}
      />,
    );

    expect(
      screen.getByRole("button", { name: /update to google email/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /keep existing email/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /use another google account/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^cancel$/i }),
    ).toBeInTheDocument();
  });

  it("separates one-time delivery email from permanent invoice data", () => {
    render(
      <InvoiceShareDialog
        {...baseProps}
        phase={INVOICE_FLOW_PHASE.READY}
        invoice={{
          ...baseProps.invoice,
          emailStatus: "matches",
          claimRequired: false,
          canView: true,
        }}
      />,
    );

    expect(screen.getByLabelText(/delivery email/i)).toHaveValue(
      "customer@example.com",
    );
    expect(screen.getByText(/sends one copy only/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /email invoice/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /whatsapp/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send on whatsapp/i }),
    ).toBeEnabled();
  });

  it("disables sharing while an email request is active", () => {
    render(
      <InvoiceShareDialog
        {...baseProps}
        phase={INVOICE_FLOW_PHASE.SENDING}
        invoice={{
          ...baseProps.invoice,
          emailStatus: "matches",
          claimRequired: false,
          canView: true,
        }}
      />,
    );

    expect(
      screen.getByRole("button", { name: /sending invoice/i }),
    ).toBeDisabled();
  });

  it("shows a dedicated WhatsApp sending state", () => {
    render(
      <InvoiceShareDialog
        {...baseProps}
        phase={INVOICE_FLOW_PHASE.READY}
        whatsappSending
        invoice={{
          ...baseProps.invoice,
          emailStatus: "matches",
          claimRequired: false,
          canView: true,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
  });
});
