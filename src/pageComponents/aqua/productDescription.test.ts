import { describe, expect, it } from "vitest";
import { mapReal } from "./catalogue";
import { findFact, parseDescription } from "./productDescription";

// Trimmed from live /all-products descriptions.
const SPEC_HTML = `<div class="bg-gray-100 p-6">
  <p class="text-gray-600">Hard water leaves scale on fittings.</p>
  <ul class="mt-4">
    <li><h4 class="text-lg">Product Name</h4><p>KENT Sand Filter</p></li>
    <li><h4 class="text-lg">Maximum Flow Rate</h4><p>3000 L/hr</p></li>
    <li><h4 class="text-lg">Ideal place</h4><p>Flats &amp; bathrooms</p></li>
  </ul>
  <p class="mt-4"><strong>Important:</strong> Plumbing is approximately ₹1200.</p>
  <p>\`\`\`</p>
</div>`;

const ESCAPED_HTML =
  "<div>&lt;h2&gt;KENT Washing Machine Water Softener&lt;/h2&gt;</div><div><br></div>" +
  "<div>&lt;p&gt;</div><div>Softens water for washing machines.</div><div>&lt;/p&gt;</div>" +
  "<div>&lt;h3&gt;Key Benefits&lt;/h3&gt;</div><div>&lt;ul&gt;</div>" +
  "<div>&nbsp; &lt;li&gt;Better lather&lt;/li&gt;</div><div>&nbsp; &lt;li&gt;Less detergent&lt;/li&gt;</div>" +
  "<div>&lt;/ul&gt;</div>";

describe("parseDescription", () => {
  it("splits intro, spec pairs and an Important note", () => {
    expect(parseDescription(SPEC_HTML)).toEqual([
      { kind: "p", text: "Hard water leaves scale on fittings." },
      {
        kind: "facts",
        items: [
          { label: "Maximum Flow Rate", value: "3000 L/hr" },
          { label: "Ideal place", value: "Flats & bathrooms" },
        ],
      },
      {
        kind: "note",
        label: "Important",
        text: "Plumbing is approximately ₹1200.",
      },
    ]);
  });

  it("reads markup that was stored escaped", () => {
    expect(parseDescription(ESCAPED_HTML)).toEqual([
      { kind: "h", text: "KENT Washing Machine Water Softener" },
      { kind: "p", text: "Softens water for washing machines." },
      { kind: "h", text: "Key Benefits" },
      { kind: "list", items: ["Better lather", "Less detergent"] },
    ]);
  });

  it("returns plain text only; React escapes any literal markup", () => {
    expect(parseDescription("<p>Use &lt;b&gt; carefully</p>")).toEqual([
      { kind: "p", text: "Use <b> carefully" },
    ]);
  });
});

describe("mapReal", () => {
  it("drops the site suffix and fills specs from the description", () => {
    const p = mapReal({
      _id: "x",
      title: "Kent Sandfilter | Aquakart",
      price: 9000,
      description: SPEC_HTML,
    });
    expect(p.title).toBe("Kent Sandfilter");
    expect(p.flow).toBe("3000 L/hr");
    expect(findFact(p.about!, /ideal/i)).toBe("Flats & bathrooms");
    expect(p.desc).toContain("Hard water leaves scale");
  });
});
