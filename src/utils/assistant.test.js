import { describe, expect, it } from "vitest";
import { productAssistantPrompt } from "./assistant";

describe("productAssistantPrompt", () => {
  it("drops the SEO suffix and picks a use case from the category", () => {
    expect(
      productAssistantPrompt({
        title: "Kent Bathroom Water Softener 5.5L | Aquakart",
        category: { title: "Softeners" },
      }),
    ).toBe(
      "Tell me about Kent Bathroom Water Softener 5.5L. Is it right for hard water in my home?",
    );
    expect(
      productAssistantPrompt({
        title: "Kent Grand Star ZWW",
        category: "RO Purifiers",
      }),
    ).toBe(
      "Tell me about Kent Grand Star ZWW. Is it right for safe drinking water at home?",
    );
    expect(
      productAssistantPrompt({ title: "Kent Sandfilter", category: "Filters" }),
    ).toBe(
      "Tell me about Kent Sandfilter. Is it right for whole-home water filtration?",
    );
  });

  it("falls back gracefully", () => {
    expect(productAssistantPrompt(null)).toBe(
      "Tell me about this product. Is it right for my home?",
    );
  });
});
