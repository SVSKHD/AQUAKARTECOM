import { describe, expect, it } from "vitest";
import { DEMO_PRODUCTS } from "./catalogue";
import {
  chatProducts,
  mentionedProducts,
  namedProducts,
  splitReply,
} from "./replyProducts";

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

describe("namedProducts", () => {
  const kent = (id: string, title: string) => ({
    ...DEMO_PRODUCTS[0],
    id,
    title,
  });
  const catalogue = [
    kent("k25", "Kent Automatic Water Softener 25 Litres"),
    kent("k40", "Kent Automatic Water Softener 40 Litres"),
    kent("k100", "Kent Automatic Water Softener 100 L"),
    kent("k8", "Kent Automatic Water Softener 8 Litres"),
    kent("kb", "Kent Bathroom Water Softener 5.5 L"),
  ];

  it("finds bold names mid-sentence, in order, once each", () => {
    const reply = [
      "- **For a home with several bathrooms (a villa, duplex, or independent house):** You can compare a single master system, such as the **Kent Automatic Water Softener 25**, **Kent Automatic Water Softener 40**, or **Kent Automatic Water Softener 100L**, with a softener per bathroom like the **Kent Automatic 8L** or **Kent Bathroom Water Softener 5.5L** (manual).",
      "",
      "The **Kent Automatic Water Softener 25** suits most homes.",
    ].join("\n");
    expect(namedProducts(reply, catalogue)).toEqual([
      "k25",
      "k40",
      "k100",
      "k8",
      "kb",
    ]);
  });

  it("ignores bold text that isn't a product", () => {
    expect(
      namedProducts(
        "**Water softener** helps. **Book a site visit**.",
        catalogue,
      ),
    ).toEqual([]);
  });
});

describe("chatProducts", () => {
  it("collects the chat's products newest answer first, once each", () => {
    const ids = chatProducts(
      [
        { role: "aqua", text: `Try the **${compact.title}**.` },
        { role: "user", text: `What about **${home.title}**?` },
        { role: "aqua", text: "Here you go", products: [home.id, "gone"] },
        { role: "aqua", text: "Compared", table: [compact.id, home.id] },
      ],
      DEMO_PRODUCTS,
    );
    expect(ids).toEqual([compact.id, home.id]);
  });

  it("is empty for a chat without products", () => {
    expect(chatProducts([{ role: "user", text: "hi" }], DEMO_PRODUCTS)).toEqual(
      [],
    );
  });
});
