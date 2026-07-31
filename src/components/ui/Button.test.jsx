import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Button from "./Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Save changes</Button>);

    expect(
      screen.getByRole("button", { name: /save changes/i }),
    ).toBeInTheDocument();
  });

  it("calls onClick when enabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Submit</Button>);
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disables interaction while loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );

    const button = screen.getByRole("button", { name: /saving/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("supports full width styling", () => {
    render(<Button fullWidth>Continue</Button>);

    expect(screen.getByRole("button", { name: /continue/i })).toHaveClass(
      "w-full",
    );
  });
});
