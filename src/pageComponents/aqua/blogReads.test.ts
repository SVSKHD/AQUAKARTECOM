import { describe, expect, it } from "vitest";
import {
  htmlToParagraphs,
  podcastScript,
  toBlogRead,
  toBlogReads,
} from "./blogReads";

const blog = {
  _id: "b1",
  slug: "hard-water-hyderabad",
  title: "Hard water in Hyderabad",
  description:
    "<p>Hard water &amp; scale.</p><p>Borewells run <b>harder</b>.<br>Test first.</p><script>alert(1)</script>",
  shortDescription: "Why borewell water scales your geyser.",
  keyHighlights: ["Test the water", " Size the softener "],
  titleImages: [{ secure_url: "https://img/x.jpg" }],
};

describe("blogReads", () => {
  it("turns CMS HTML into plain paragraphs, dropping scripts", () => {
    expect(htmlToParagraphs(blog.description)).toEqual([
      "Hard water & scale.",
      "Borewells run harder.",
      "Test first.",
    ]);
  });

  it("drops markdown that CMS posts sometimes carry", () => {
    expect(
      htmlToParagraphs("<p>## Why</p><p>Causes **scale buildup** fast.</p>"),
    ).toEqual(["Why", "Causes scale buildup fast."]);
  });

  it("builds a read with a link, image, summary and highlights", () => {
    const r = toBlogRead(blog)!;
    expect(r).toMatchObject({
      id: "b1",
      href: "/blog/hard-water-hyderabad",
      image: "https://img/x.jpg",
      summary: "Why borewell water scales your geyser.",
      highlights: ["Test the water", "Size the softener"],
      minutes: 1,
    });
  });

  it("skips drafts and posts without a body, and reads the { data } shape", () => {
    const reads = toBlogReads({
      success: true,
      data: [
        blog,
        { ...blog, _id: "b2", status: "draft" },
        { ...blog, _id: "b3", description: "<p> </p>" },
      ],
    });
    expect(reads.map((r) => r.id)).toEqual(["b1"]);
    expect(toBlogReads({ data: null })).toEqual([]);
    // Only the newest few by default; the rest live on the blog page.
    const many = {
      data: ["a", "b", "c", "d", "e"].map((id) => ({ ...blog, _id: id })),
    };
    expect(toBlogReads(many).map((r) => r.id)).toEqual(["a", "b", "c"]);
    expect(toBlogReads(undefined)).toEqual([]);
  });

  it("does not repeat the summary when it is the first paragraph", () => {
    const r = toBlogRead({ ...blog, shortDescription: "" })!;
    expect(r.summary).toBe("Hard water & scale.");
    expect(r.paragraphs[0]).toBe("Borewells run harder.");
  });

  it("reads the podcast as intro, summary, key points, article, sign-off", () => {
    const lines = podcastScript(toBlogRead(blog)!).split("\n");
    expect(lines[0]).toBe(
      "You're listening to Aquakart Reads. Hard water in Hyderabad.",
    );
    expect(lines[2]).toBe("Key points. Test the water. Size the softener.");
    expect(lines.at(-1)).toMatch(/end of this episode/);
  });
});
