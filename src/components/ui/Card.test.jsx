import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Card from "./Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Product card</Card>);

    expect(screen.getByText(/product card/i)).toBeInTheDocument();
  });

  it("renders as a custom element", () => {
    render(
      <Card as="article" aria-label="Featured product">
        Content
      </Card>,
    );

    expect(screen.getByRole("article", { name: /featured product/i })).toBeInTheDocument();
  });

  it("applies dark variant", () => {
    render(<Card variant="dark">Dark card</Card>);

    expect(screen.getByText(/dark card/i)).toHaveClass("bg-slate-950");
  });

  it("applies interactive class when requested", () => {
    render(<Card interactive>Interactive card</Card>);

    expect(screen.getByText(/interactive card/i)).toHaveClass(
      "hover:-translate-y-0.5",
    );
  });
});
