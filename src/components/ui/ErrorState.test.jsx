import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ErrorState from "./ErrorState";

describe("ErrorState", () => {
  it("renders default error content", () => {
    render(<ErrorState />);

    expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByText(/please try again/i)).toBeInTheDocument();
  });

  it("renders custom title and description", () => {
    render(
      <ErrorState
        title="Products unavailable"
        description="Refresh the page after some time."
      />,
    );

    expect(screen.getByRole("heading", { name: /products unavailable/i })).toBeInTheDocument();
    expect(screen.getByText(/refresh the page/i)).toBeInTheDocument();
  });

  it("calls retry handler", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ErrorState onRetry={onRetry} retryLabel="Reload" />);

    await user.click(screen.getByRole("button", { name: /reload/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not render retry button without handler", () => {
    render(<ErrorState retryLabel="Reload" />);

    expect(screen.queryByRole("button", { name: /reload/i })).not.toBeInTheDocument();
  });
});
