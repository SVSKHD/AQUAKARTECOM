import { describe, expect, it } from "vitest";
import { replyPlainText } from "./ReplyActions";

describe("replyPlainText", () => {
  it("copies the reply without markdown bold, keeping lists readable", () => {
    const reply = [
      "Two good fits:",
      "",
      "1. **Kent Automatic 8L** – for bathrooms",
      "   * Wall mounted",
      "2. **Kent Automatic Water Softener 25** – whole home",
      "",
      "### Installation",
      "- Needs a drain",
    ].join("\n");
    expect(replyPlainText(reply)).toBe(
      [
        "Two good fits:",
        "",
        "1. Kent Automatic 8L – for bathrooms",
        "   - Wall mounted",
        "2. Kent Automatic Water Softener 25 – whole home",
        "",
        "Installation",
        "- Needs a drain",
      ].join("\n"),
    );
  });
});
