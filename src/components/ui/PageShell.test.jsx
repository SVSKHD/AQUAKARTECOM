import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PageShell from "./PageShell";

describe("PageShell", () => {
  it("renders children inside a white page shell", () => {
    render(<PageShell>Page content</PageShell>);

    expect(screen.getByText(/page content/i)).toBeInTheDocument();
    expect(screen.getByText(/page content/i).parentElement).toHaveClass("bg-white");
  });

  it("supports custom element", () => {
    render(
      <PageShell as="main" aria-label="Main page">
        Content
      </PageShell>,
    );

    expect(screen.getByRole("main", { name: /main page/i })).toBeInTheDocument();
  });

  it("applies optional top padding", () => {
    render(<PageShell withTopPadding>Content</PageShell>);

    expect(screen.getByText(/content/i).parentElement).toHaveClass("pt-8");
  });
});
