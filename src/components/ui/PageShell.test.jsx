import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PageShell from "./PageShell";

describe("PageShell", () => {
  it("renders children inside a white page shell", () => {
    render(<PageShell data-testid="page-shell">Page content</PageShell>);

    expect(screen.getByText(/page content/i)).toBeInTheDocument();
    expect(screen.getByTestId("page-shell")).toHaveClass("bg-white");
  });

  it("supports custom element", () => {
    render(
      <PageShell as="main" aria-label="Main page">
        Content
      </PageShell>,
    );

    expect(
      screen.getByRole("main", { name: /main page/i }),
    ).toBeInTheDocument();
  });

  it("applies optional top padding", () => {
    render(
      <PageShell data-testid="page-shell" withTopPadding>
        Content
      </PageShell>,
    );

    expect(screen.getByTestId("page-shell")).toHaveClass("pt-8");
  });
});
