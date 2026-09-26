import { describe, expect, it } from "vitest";

import {
  PUBLIC_ROUTES,
  PUBLIC_SEO_CONFIG,
  getPublicRoute,
  getPublicSeoKey,
  getStaticSitemapEntries,
  normalizePublicPath,
} from "./publicRoutes";

describe("public route registry", () => {
  it("keeps route paths and SEO keys unique", () => {
    const paths = PUBLIC_ROUTES.map((route) => route.path);
    const seoKeys = PUBLIC_ROUTES.map((route) => route.seoKey);

    expect(new Set(paths).size).toBe(paths.length);
    expect(new Set(seoKeys).size).toBe(seoKeys.length);
  });

  it("resolves canonical static SEO keys from route paths", () => {
    expect(getPublicSeoKey("/")).toBe("home");
    expect(getPublicSeoKey("/shop")).toBe("shop");
    expect(getPublicSeoKey("/shop/")).toBe("shop");
    expect(getPublicSeoKey("/contact-us?from=footer")).toBe("contact-us");
    expect(getPublicSeoKey("/checkout")).toBeNull();
  });

  it("derives the fallback SEO config from the same registry", () => {
    PUBLIC_ROUTES.forEach((route) => {
      expect(PUBLIC_SEO_CONFIG[route.seoKey]).toEqual(route.seo);
      expect(route.seo?.title).toBeTruthy();
      expect(route.seo?.description).toBeTruthy();
    });
  });

  it("derives static sitemap entries from the same registry", () => {
    const sitemapEntries = getStaticSitemapEntries();

    expect(sitemapEntries).toHaveLength(PUBLIC_ROUTES.length);
    expect(sitemapEntries).toContainEqual({
      loc: "/",
      changefreq: "daily",
      priority: "1.0",
    });
    expect(sitemapEntries).toContainEqual({
      loc: "/shop",
      changefreq: "daily",
      priority: "0.9",
    });
  });

  it("normalizes paths safely", () => {
    expect(normalizePublicPath("shop/")).toBe("/shop");
    expect(normalizePublicPath("/blogs#latest")).toBe("/blogs");
    expect(getPublicRoute("/not-registered")).toBeNull();
  });
});
