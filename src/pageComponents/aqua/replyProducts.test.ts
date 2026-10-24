import { describe, expect, it } from "vitest";
import { DEMO_PRODUCTS } from "./catalogue";
import { mentionedProducts, splitReply } from "./replyProducts";

const byTitle = (t: string) => DEMO_PRODUCTS.find((p) => p.title === t)!;
const compact = byTitle("Compact Water Softener 10 L");
const home = byTitle("Home Water Softener 20 L Auto");

describe("splitReply", () => {
  it("puts each numbered product's write-up on that product", () => {
    const reply = [
      "Here are two good fits:",
      "",
      `1. **${compact.title}** – Great for couples in small flats.`,
      "   - Needs a drain nearby",
      `2. **${home.title}**: Whole-home softening for four.`,
      "",
      "Want me to compare them?",
    ].join("\n");
    const segs = splitReply(reply, DEMO_PRODUCTS)!;
    expect(segs.map((s) => s.kind)).toEqual([
      "text",
      "product",
      "product",
      "text",
    ]);
    expect(segs[1]).toMatchObject({
      product: { id: compact.id },
      summary: "Great for couples in small flats.",
      points: ["Needs a drain nearby"],
    });
    expect(segs[2]).toMatchObject({
      product: { id: home.id },
      summary: "Whole-home softening for four.",
    });
  });

  it("groups a heading's paragraph and bullets under that product", () => {
    const reply = [
      `### ${home.title}`,
      "Regenerates only when needed.",
      "- **Capacity:** 20 L resin",
      "- 2 years warranty",
      "### Installation",
      "A plumber fits it at the inlet.",
    ].join("\n");
    const segs = splitReply(reply, DEMO_PRODUCTS)!;
    expect(segs[0]).toMatchObject({
      kind: "product",
      product: { id: home.id },
      summary: "Regenerates only when needed.",
      points: ["**Capacity:** 20 L resin", "2 years warranty"],
    });
    expect(segs[1].kind).toBe("text");
  });

  it("returns null when no product is written about by name", () => {
    expect(
      splitReply(
        "Hard water leaves scale on taps.\n\n- Use a softener",
        DEMO_PRODUCTS,
      ),
    ).toBeNull();
  });

  it("does not match on generic words alone", () => {
    expect(
      mentionedProducts(
        "**Water softener** – any softener helps.",
        DEMO_PRODUCTS,
      ),
    ).toEqual([]);
  });
});
