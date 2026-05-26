import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import EmptyState from "./EmptyState";

const TestIcon = (props) => <svg data-testid="empty-icon" {...props} />;

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        title="No products found"
        description="Try changing the filters."
      />,
    );

    expect(screen.getByRole("heading", { name: /no products found/i })).toBeInTheDocument();
    expect(screen.getByText(/try changing the filters/i)).toBeInTheDocument();
  });

  it("renders optional icon", () => {
    render(<EmptyState icon={TestIcon} title="Empty cart" />);

    expect(screen.getByTestId("empty-icon")).toBeInTheDocument();
  });

  it("calls action handler", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <EmptyState
        title="Cart empty"
        actionLabel="Shop now"
        onAction={onAction}
      />,
    );

    await user.click(screen.getByRole("button", { name: /shop now/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("does not render action button without handler", () => {
    render(<EmptyState title="Empty" actionLabel="Shop now" />);

    expect(screen.queryByRole("button", { name: /shop now/i })).not.toBeInTheDocument();
  });
});
