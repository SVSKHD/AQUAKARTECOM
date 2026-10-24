import { describe, expect, it } from "vitest";
import { suggestFollowUps } from "./aiFollowUps";

describe("suggestFollowUps", () => {
  it("offers quick answers when the assistant asked a question", () => {
    expect(
      suggestFollowUps(
        "Which softener?",
        "A 20 L softener usually works. How many people live in your household?",
      ),
    ).toEqual(["We are 2 people", "We are 3–4 people", "We are 5 or more"]);
    expect(
      suggestFollowUps(
        "Hardness?",
        "Is your water from a borewell or municipal supply?",
      ),
    ).toEqual(["It's borewell water", "It's municipal water", "A mix of both"]);
  });

  it("offers topic follow-ups, capped at 3", () => {
    const s = suggestFollowUps(
      "Do I need a softener for 400 ppm?",
      "Yes, 400 ppm is very hard water. A softener helps.",
    );
    expect(s).toHaveLength(3);
    expect(s[0]).toBe("What capacity softener do I need?");
  });

  it("never repeats something already asked", () => {
    const s = suggestFollowUps("RO?", "An RO purifier suits high TDS.", [
      "Do I need RO or UV for my water?",
    ]);
    expect(s).not.toContain("Do I need RO or UV for my water?");
    expect(s.length).toBeGreaterThan(0);
  });

  it("falls back to general questions", () => {
    expect(suggestFollowUps("Hi", "Hello! How can I help you today")).toEqual([
      "Which softener suits my home?",
      "What TDS is safe to drink?",
      "Talk to an AquaKart expert",
    ]);
  });
});
