import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Section from "./Section";

describe("Section", () => {
  it("renders header content and children", () => {
    render(
      <Section
        eyebrow="Aquakart"
        title="Premium Water Solutions"
        description="Reusable page section."
      >
        <p>Section body</p>
      </Section>,
    );

    expect(screen.getByText(/aquakart/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /premium water solutions/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/reusable page section/i)).toBeInTheDocument();
    expect(screen.getByText(/section body/i)).toBeInTheDocument();
  });

  it("renders as a custom element", () => {
    render(
      <Section as="div" role="region" title="Custom section">
        Content
      </Section>,
    );

    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("applies large spacing", () => {
    const { container } = render(<Section spacing="lg">Content</Section>);

    expect(container.firstChild).toHaveClass("py-16");
  });
});
