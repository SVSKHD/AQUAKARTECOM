import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Input from "./Input";

describe("Input", () => {
  it("renders label and input", () => {
    render(<Input label="Email" placeholder="Enter email" />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter email/i)).toBeInTheDocument();
  });

  it("calls onChange when typed into", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Input label="Name" onChange={onChange} />);
    await user.type(screen.getByLabelText(/name/i), "Aqua");

    expect(onChange).toHaveBeenCalled();
  });

  it("shows helper text", () => {
    render(<Input label="Phone" helperText="Use WhatsApp number" />);

    expect(screen.getByText(/use whatsapp number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toHaveAccessibleDescription(
      "Use WhatsApp number",
    );
  });

  it("shows error state and aria-invalid", () => {
    render(<Input label="Email" error="Email is required" />);

    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Email is required");
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
});
