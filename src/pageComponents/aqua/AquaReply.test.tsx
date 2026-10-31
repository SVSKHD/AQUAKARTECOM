import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AquaReply, { inline } from "./AquaReply";

const prices = (text: string) =>
  [
    ...render(<AquaReply text={text} />).container.querySelectorAll(
      ".aq-price-hl",
    ),
  ].map((el) => el.textContent);

describe("AquaReply prices", () => {
  it("drops the brackets around a price", () => {
    const { container } = render(
      <AquaReply text="You opened Kent Automatic 8L (₹31,500). Want more? (8 L)" />,
    );
    expect(container.textContent).toBe(
      "You opened Kent Automatic 8L ₹31,500. Want more? (8 L)",
    );
  });

  it("highlights every rupee amount in a reply", () => {
    expect(
      prices(
        "You opened Kent Automatic 8L (₹31,500). Filters are Rs. 499/- and INR 1,20,000 or ₹ 2.5 lakh.",
      ),
    ).toEqual(["₹31,500", "Rs. 499/-", "INR 1,20,000", "₹ 2.5 lakh"]);
  });

  it("works inside bold text and lists, and leaves plain numbers alone", () => {
    expect(
      prices("- **Kent Grand ₹18,500** for 4 people\n- 480 ppm hardness, 8 L"),
    ).toEqual(["₹18,500"]);
    expect(prices("Pick ₹14,500, or ₹9,999.")).toEqual(["₹14,500", "₹9,999"]);
  });

  it("only marks prices where asked (not thinking steps or notes)", () => {
    const { container } = render(<p>{inline("Costs ₹999", "k")}</p>);
    expect(container.querySelector(".aq-price-hl")).toBeNull();
    const marked = render(<p>{inline("Costs ₹999", "k", { prices: true })}</p>);
    expect(marked.container.querySelector(".aq-price-hl")?.textContent).toBe(
      "₹999",
    );
  });
});
