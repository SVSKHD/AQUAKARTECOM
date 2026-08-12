import { describe, expect, it } from "vitest";

import { getManagedSeoPageKey, normalizeManagedSeo } from "./managedSeo";

describe("managed SEO", () => {
  it("maps only supported static routes", () => {
    expect(getManagedSeoPageKey("/")).toBe("home");
    expect(getManagedSeoPageKey("/shop")).toBe("shop");
    expect(getManagedSeoPageKey("/product/[slug]")).toBeNull();
  });

  it("normalizes the backend contract for the SEO renderer", () => {
    expect(
      normalizeManagedSeo({
        active: true,
        title: "Aquakart",
        keywords: ["water", "softener"],
        canonicalUrl: "https://aquakart.co.in/shop",
        ogImage: "https://example.com/social.jpg",
      }),
    ).toMatchObject({
      title: "Aquakart",
      keywords: "water, softener",
      url: "https://aquakart.co.in/shop",
      photos: "https://example.com/social.jpg",
    });
  });

  it("ignores inactive records", () => {
    expect(normalizeManagedSeo({ active: false })).toBeNull();
  });
});
