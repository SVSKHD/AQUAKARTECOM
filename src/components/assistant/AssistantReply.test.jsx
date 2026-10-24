import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AssistantReply, { parseReply } from "./AssistantReply";

describe("AssistantReply", () => {
  it("renders bold, line breaks and lists", () => {
    const { container } = render(
      <AssistantReply
        text={
          "A **water softener** helps.\nIt removes scale.\n\n- Protects geysers\n- Softer skin\n\n1. Test hardness\n2. Pick a size"
        }
      />,
    );
    expect(container.querySelector("strong").textContent).toBe(
      "water softener",
    );
    expect(container.querySelectorAll("p br")).toHaveLength(1);
    expect(
      [...container.querySelectorAll("ul li")].map((li) => li.textContent),
    ).toEqual(["Protects geysers", "Softer skin"]);
    expect(container.querySelectorAll("ol li")).toHaveLength(2);
  });

  it("escapes HTML in replies instead of rendering it", () => {
    const { container } = render(
      <AssistantReply
        text={
          '<img src=x onerror="alert(1)"> **<b>hi</b>**\n- <script>x</script>'
        }
      />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror="alert(1)">');
    expect(container.querySelector("strong").textContent).toBe("<b>hi</b>");
  });

  it("parses headings and ignores empty input", () => {
    expect(parseReply("## Tips\ntext")).toEqual([
      { kind: "h", lines: ["Tips"] },
      { kind: "p", lines: ["text"] },
    ]);
    expect(parseReply("")).toEqual([]);
    expect(parseReply(undefined)).toEqual([]);
  });
});
