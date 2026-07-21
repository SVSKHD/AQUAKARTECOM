import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AquaReuseDrawer from "./drawer";

describe("AquaReuseDrawer", () => {
  it("renders floating drawer content and footer", () => {
    render(
      <AquaReuseDrawer
        open
        close={vi.fn()}
        title="Tune your solution"
        description="Choose the filters that matter."
        footer={<button type="button">View products</button>}
      >
        <p>Filter content</p>
      </AquaReuseDrawer>,
    );

    expect(
      screen.getByRole("heading", { name: /tune your solution/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/choose the filters/i)).toBeInTheDocument();
    expect(screen.getByText(/filter content/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /view products/i }),
    ).toBeInTheDocument();
  });

  it("calls close from the accessible close button", async () => {
    const user = userEvent.setup();
    const close = vi.fn();

    render(
      <AquaReuseDrawer open close={close} title="Your cart">
        Cart content
      </AquaReuseDrawer>,
    );

    await user.click(screen.getByRole("button", { name: /close your cart/i }));
    expect(close).toHaveBeenCalledTimes(1);
  });
});
