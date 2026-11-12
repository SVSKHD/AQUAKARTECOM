import { describe, expect, it } from "vitest";
import { parseQuickQuestions, quickAnswer } from "./quizParse";

const reply = `Mud points to a sand filter first.

- **Kent Sandfilter** clears sand and silt.

**Quick questions:**
1. Water source: borewell / tanker / municipal
2. Home: flat / villa / independent house
3. Bathrooms: 1 / 2 / 3 / 4+
4. Anything you noticed: describe it
Reply in one message, e.g. 1 borewell, 2 villa, 3 4+`;

describe("parseQuickQuestions", () => {
  it("reads the questions and leaves the rest of the reply", () => {
    const q = parseQuickQuestions(reply)!;
    expect(q.questions).toEqual([
      {
        n: 1,
        label: "Water source",
        options: ["borewell", "tanker", "municipal"],
      },
      { n: 2, label: "Home", options: ["flat", "villa", "independent house"] },
      { n: 3, label: "Bathrooms", options: ["1", "2", "3", "4+"] },
      // Fewer than 2 options: a free-text question.
      { n: 4, label: "Anything you noticed", options: [] },
    ]);
    expect(q.hint).toMatch(/^Reply in one message/);
    expect(q.body).toBe(
      "Mud points to a sand filter first.\n\n- **Kent Sandfilter** clears sand and silt.",
    );
  });

  it("finds the header at the end of a sentence", () => {
    const q = parseQuickQuestions(
      "Please share a few details. Quick questions:\n1. Water source: borewell / tanker",
    )!;
    expect(q.questions).toHaveLength(1);
    expect(q.body).toBe("Please share a few details.");
  });

  it("is null without a header or a valid question", () => {
    expect(parseQuickQuestions("Just text.")).toBeNull();
    expect(
      parseQuickQuestions("Quick questions:\nWhere do you live?"),
    ).toBeNull();
  });
});

describe("quickAnswer", () => {
  it("builds one message, skipping unanswered questions", () => {
    const qs = parseQuickQuestions(reply)!.questions;
    expect(quickAnswer(qs, { 1: "borewell", 3: "4+" })).toBe(
      "1 borewell, 3 4+",
    );
    expect(quickAnswer(qs, { 2: "villa" }, " orange stains ")).toBe(
      "2 villa. orange stains",
    );
  });
});
