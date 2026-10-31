import { describe, expect, it } from "vitest";
import { isCompareAction } from "./compareAction";

describe("isCompareAction", () => {
  it("matches the Compare buttons, whatever the case or spacing", () => {
    for (const t of ["Compare these", "compare", "  Compare picks "])
      expect(isCompareAction(t)).toBe(true);
  });

  it("leaves typed questions about comparing alone", () => {
    for (const t of [
      "compare kent automatic and kent bathroom",
      "Which is better to compare?",
      "Compare these two for a family of 4",
    ])
      expect(isCompareAction(t)).toBe(false);
  });
});
