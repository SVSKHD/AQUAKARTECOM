import { describe, expect, it } from "vitest";
import { HOME_TITLE, shortTitle, tabTitle } from "./pageTitle";

describe("pageTitle", () => {
  it("uses the platform title when there is no chat", () => {
    expect(tabTitle(null)).toBe(HOME_TITLE);
    expect(tabTitle("   ")).toBe(HOME_TITLE);
  });

  it("puts the chat title first", () => {
    expect(tabTitle("Softener for a 3BHK in Gachibowli")).toBe(
      "Softener for a 3BHK in Gachibowli · Aquakart AI",
    );
  });

  it("keeps long titles to one line, cut at a word", () => {
    const t = shortTitle(
      "Which water softener do I need for a family of five living in Kokapet with borewell water?",
    );
    expect(t.length).toBeLessThanOrEqual(60);
    expect(t).toBe(
      "Which water softener do I need for a family of five living…",
    );
    expect(shortTitle("line one\n  line two")).toBe("line one line two");
  });
});
