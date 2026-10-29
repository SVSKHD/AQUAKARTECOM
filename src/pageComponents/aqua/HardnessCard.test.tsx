import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HardnessCard from "./HardnessCard";
import { addressHardness } from "./hardnessData";

describe("HardnessCard folding", () => {
  beforeEach(() => {
    window.matchMedia ||= ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    window.localStorage.clear();
  });

  it("starts as a one-line invitation when no area is known, and opens the picker", async () => {
    const user = userEvent.setup();
    render(<HardnessCard onAsk={vi.fn()} />);
    const invite = screen.getByRole("button", {
      name: /would you like to see the hardness of your area\?/i,
    });
    expect(invite).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText("How hard is your water?"),
    ).not.toBeInTheDocument();
    await user.click(invite);
    expect(screen.getByText("How hard is your water?")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Hide water hardness" }),
    );
    expect(
      screen.getByRole("button", { name: /would you like to see/i }),
    ).toBeInTheDocument();
  });

  it("shows a compact reading for a saved area, and the full report when opened", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      "aqua.hardness",
      JSON.stringify({ city: "Hyderabad", area: "Gachibowli" }),
    );
    render(<HardnessCard onAsk={vi.fn()} />);
    const summary = await screen.findByRole("button", {
      name: /water hardness in gachibowli, hyderabad: about 560 ppm, very hard\. softener recommended/i,
    });
    expect(summary).toHaveTextContent("~560");
    expect(summary).toHaveTextContent("Very hard");
    expect(summary).toHaveTextContent("Softener recommended");
    // The full report (its verdict and CTA) only appears once opened.
    expect(screen.queryByText("Find a softener")).not.toBeInTheDocument();
    await user.click(summary);
    expect(screen.getByText("Find a softener")).toBeInTheDocument();
    expect(screen.getByText("A softener is recommended")).toBeInTheDocument();
  });

  it("starts from the shopper's saved home address", async () => {
    const user = userEvent.setup();
    const home = addressHardness({
      street: "Plot 12, Narsingi",
      city: "Hyderabad",
    });
    render(<HardnessCard onAsk={vi.fn()} home={home} />);
    const summary = await screen.findByRole("button", {
      name: /water hardness in narsingi, hyderabad: about 700 ppm, very hard/i,
    });
    await user.click(summary);
    expect(
      screen.getByText(/water hardness · your address/i),
    ).toBeInTheDocument();
    // Not stored: a later change of address should follow through.
    expect(window.localStorage.getItem("aqua.hardness")).toBeNull();
  });

  it("keeps an area the shopper picked over the home address", async () => {
    window.localStorage.setItem(
      "aqua.hardness",
      JSON.stringify({ city: "Hyderabad", area: "Gachibowli" }),
    );
    const home = addressHardness({ street: "Narsingi", city: "Hyderabad" });
    render(<HardnessCard onAsk={vi.fn()} home={home} />);
    expect(
      await screen.findByRole("button", { name: /gachibowli, hyderabad/i }),
    ).toBeInTheDocument();
  });
});
