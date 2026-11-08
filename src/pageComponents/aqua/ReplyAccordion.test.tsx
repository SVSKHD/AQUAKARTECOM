import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ReplyAccordion from "./ReplyAccordion";

// jsdom has no layout: every reply measures 0 high, so it counts as short.
describe("ReplyAccordion", () => {
  it("puts Copy above the reply, and doesn't fold a short reply", () => {
    render(
      <ReplyAccordion id="m1" text="Soft water" defaultOpen={false}>
        <p>Soft water</p>
      </ReplyAccordion>,
    );
    expect(
      screen.getByRole("button", { name: "Copy reply" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Soft water")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Show more" })).toBeNull();
  });

  it("folds a long reply and opens it from the toggle", async () => {
    const user = userEvent.setup();
    const desc = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollHeight",
    );
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get: () => 400,
    });
    try {
      render(
        <ReplyAccordion id="m2" text="Long" defaultOpen={false}>
          <p>Long answer</p>
        </ReplyAccordion>,
      );
      const toggle = screen.getByRole("button", { name: "Show more" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      await user.click(toggle);
      expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    } finally {
      if (desc)
        Object.defineProperty(HTMLElement.prototype, "scrollHeight", desc);
    }
  });
});
