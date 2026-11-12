import { describe, expect, it, vi } from "vitest";
import {
  OPEN_BLOG,
  openBlogInArtifact,
  relatedProducts,
  relatedReads,
  type BlogRead,
} from "./blogReads";

const read = (id: string, title: string, text = ""): BlogRead => ({
  id,
  title,
  href: `/blog/${id}`,
  image: null,
  summary: text,
  highlights: [],
  paragraphs: [text],
  minutes: 3,
});

describe("openBlogInArtifact", () => {
  it("reports whether the workspace took the post", () => {
    const r = read("a", "Hard water");
    expect(openBlogInArtifact(r)).toBe(false);
    const take = vi.fn((e: Event) => e.preventDefault());
    window.addEventListener(OPEN_BLOG, take);
    expect(openBlogInArtifact(r)).toBe(true);
    expect((take.mock.calls[0][0] as CustomEvent).detail).toBe(r);
    window.removeEventListener(OPEN_BLOG, take);
  });
});

describe("relatedReads", () => {
  it("ranks posts sharing words with the title first", () => {
    const me = read("me", "Why buy a water softener in Hyderabad");
    const list = [
      me,
      read("ro", "How to reduce RO water wastage"),
      read("soft", "Automatic vs manual water softener"),
      read("hyd", "Hard water areas of Hyderabad"),
    ];
    expect(relatedReads(me, list, 2).map((r) => r.id)).toEqual(["soft", "hyd"]);
  });
});

describe("relatedProducts", () => {
  const products = [
    {
      id: "s1",
      title: "Kent Automatic 25",
      cat: "softener",
      price: 40000,
      inStock: true,
    },
    {
      id: "s2",
      title: "Kent Bathroom Softener",
      cat: "softener",
      price: 14000,
      inStock: true,
    },
    {
      id: "s3",
      title: "Old Softener",
      cat: "softener",
      price: 9000,
      inStock: false,
    },
    {
      id: "p1",
      title: "Kent RO Grand",
      cat: "purifier",
      price: 18000,
      inStock: true,
    },
  ];

  it("puts products the post names first, then its subject's in stock", () => {
    const r = read(
      "x",
      "Fixing hard water",
      "Scale on taps means hard water. A softener such as the Kent Automatic 25 removes hardness.",
    );
    expect(relatedProducts(r, products).map((p) => p.id)).toEqual(["s1", "s2"]);
  });

  it("follows what the post is about", () => {
    const r = read(
      "y",
      "Is low TDS drinking water safe",
      "RO purifiers lower TDS.",
    );
    expect(relatedProducts(r, products).map((p) => p.id)).toEqual(["p1"]);
  });
});
