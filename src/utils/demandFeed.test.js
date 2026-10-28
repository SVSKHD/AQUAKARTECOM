import { describe, expect, it, vi } from "vitest";
import {
  areaFromUser,
  demandHeadings,
  describeRawProduct,
  loadDemandFeed,
  localityFromAddress,
  matchProduct,
  recentLine,
  relativeTime,
  trendingEntryFor,
  trendingLine,
} from "./demandFeed";

const NOW = new Date("2026-10-28T12:30:00Z").getTime();
const hoursAgo = (h) => new Date(NOW - h * 3600000).toISOString();

describe("relativeTime", () => {
  it("reads hour-rounded times without false precision", () => {
    expect(relativeTime(hoursAgo(0.5), NOW)).toBe("in the last hour");
    expect(relativeTime(hoursAgo(1), NOW)).toBe("1 hour ago");
    expect(relativeTime(hoursAgo(3), NOW)).toBe("3 hours ago");
    expect(relativeTime(hoursAgo(30), NOW)).toBe("yesterday");
    expect(relativeTime(hoursAgo(24 * 5), NOW)).toBe("5 days ago");
    expect(relativeTime(hoursAgo(24 * 45), NOW)).toBe("a month ago");
  });

  it("gives nothing for a missing or bad time", () => {
    expect(relativeTime(null, NOW)).toBe("");
    expect(relativeTime("not a date", NOW)).toBe("");
  });
});

describe("feed lines", () => {
  const item = {
    productName: "Kent Softener",
    quantity: 1,
    area: "Gachibowli",
    purchasedAt: hoursAgo(3),
  };

  it("builds the recent line, leaving out a missing location", () => {
    expect(recentLine(item, NOW)).toBe(
      "Kent Softener · bought in Gachibowli · 3 hours ago",
    );
    expect(recentLine({ ...item, area: null }, NOW)).toBe(
      "Kent Softener · bought · 3 hours ago",
    );
    expect(recentLine({ ...item, quantity: 2 }, NOW)).toBe(
      "2 × Kent Softener · bought in Gachibowli · 3 hours ago",
    );
    expect(
      recentLine({ ...item, productName: "Kent Automatic 8L | Aquakart" }, NOW),
    ).toBe("Kent Automatic 8L · bought in Gachibowli · 3 hours ago");
  });

  it("builds the trending line from orders and days", () => {
    expect(trendingLine({ orders: 12 }, 30)).toBe(
      "Bought 12 times in the last 30 days",
    );
    expect(trendingLine({ orders: 1 }, 7)).toBe(
      "Bought once in the last 7 days",
    );
  });
});

describe("localityFromAddress", () => {
  it("picks the locality the way the backend does", () => {
    expect(
      localityFromAddress(
        "Flat 4, Lake View Apts, Kondapur, Hyderabad, Telangana 500084",
      ),
    ).toBe("Kondapur");
    expect(
      localityFromAddress({
        street: "Plot 12, narsingi",
        city: "Hyderabad",
        state: "Telangana",
        postalCode: "500075",
      }),
    ).toBe("Narsingi");
  });

  it("gives null for a bare city or a house-number line", () => {
    expect(localityFromAddress("Hyderabad, Telangana 500001")).toBeNull();
    expect(
      localityFromAddress({ street: "Plot 12", city: "Hyderabad" }),
    ).toBeNull();
    expect(localityFromAddress(null)).toBeNull();
  });

  it("uses the selected address, else the first saved one", () => {
    expect(
      areaFromUser({
        selectedAddress: { street: "Gachibowli", city: "Hyderabad" },
        addresses: [{ street: "Kondapur", city: "Hyderabad" }],
      }),
    ).toBe("Gachibowli");
    expect(
      areaFromUser({ addresses: [{ street: "Kondapur", city: "Hyderabad" }] }),
    ).toBe("Kondapur");
    expect(areaFromUser(undefined)).toBeNull();
  });
});

describe("matchProduct", () => {
  const raw = [
    { _id: "a1", slug: "kent-softener", title: "Kent Softener" },
    { _id: "b2", slug: "kent-automatic-8l", title: "Kent Automatic 8L" },
  ];

  it("matches by id first, then by slug (any case)", () => {
    expect(matchProduct({ productId: "b2", productSlug: null }, raw)).toBe(
      raw[1],
    );
    expect(
      matchProduct({ productId: "zz", productSlug: "Kent-Softener" }, raw),
    ).toBe(raw[0]);
  });

  it("works with the Aqua catalogue's `id`", () => {
    const aqua = [{ id: "a1", slug: "kent-softener" }];
    expect(matchProduct({ productId: "a1" }, aqua)).toBe(aqua[0]);
  });

  it("returns null when nothing matches", () => {
    expect(
      matchProduct({ productId: "zz", productSlug: "nope" }, raw),
    ).toBeNull();
    expect(matchProduct({ productId: "a1" }, [])).toBeNull();
  });

  it("finds a product's trending entry", () => {
    const feed = {
      trending: [
        { productId: null, productSlug: "kent-automatic-8l", orders: 4 },
      ],
    };
    expect(trendingEntryFor(raw[1], feed)).toEqual(feed.trending[0]);
    expect(trendingEntryFor(raw[0], feed)).toBeNull();
  });
});

describe("loadDemandFeed", () => {
  const local = {
    area: "Kondapur",
    days: 30,
    recent: [{ productName: "A" }],
    trending: [],
  };
  const all = {
    area: null,
    days: 30,
    recent: [{ productName: "B" }],
    trending: [],
  };

  it("uses the area's feed when it has recent purchases", async () => {
    const fetchFeed = vi.fn().mockResolvedValue(local);
    await expect(
      loadDemandFeed(fetchFeed, { area: "Kondapur" }),
    ).resolves.toEqual({
      feed: local,
      nearby: true,
    });
    expect(fetchFeed).toHaveBeenCalledTimes(1);
  });

  it("falls back to all areas when the area has nothing recent", async () => {
    const fetchFeed = vi
      .fn()
      .mockResolvedValueOnce({ ...local, recent: [] })
      .mockResolvedValueOnce(all);
    const result = await loadDemandFeed(fetchFeed, {
      area: "Kondapur",
      limit: 8,
    });
    expect(result).toEqual({ feed: all, nearby: false });
    expect(fetchFeed.mock.calls[1][0]).toEqual({ limit: 8, days: undefined });
    expect(demandHeadings(result).recent).toBe("Recently bought on Aquakart");
  });

  it("fetches all areas straight away without an area", async () => {
    const fetchFeed = vi.fn().mockResolvedValue(all);
    await loadDemandFeed(fetchFeed, {});
    expect(fetchFeed).toHaveBeenCalledTimes(1);
    expect(fetchFeed.mock.calls[0][0].area).toBeUndefined();
  });

  it("resolves null instead of throwing", async () => {
    const fetchFeed = vi.fn().mockRejectedValue(new Error("500"));
    await expect(
      loadDemandFeed(fetchFeed, { area: "Kondapur" }),
    ).resolves.toBeNull();
  });

  it("names the area in the headings only for a nearby feed", () => {
    expect(demandHeadings({ feed: local, nearby: true })).toEqual({
      recent: "Recently bought near you",
      trending: "Popular in Kondapur",
    });
    expect(
      demandHeadings({ feed: { ...all, days: 7 }, nearby: false }).trending,
    ).toBe("In demand");
  });
});

describe("describeRawProduct", () => {
  it("uses the catalogue's sale price, photo and slug link", () => {
    expect(
      describeRawProduct({
        _id: "a1",
        slug: "kent-softener",
        title: "Kent Softener | Aquakart",
        price: 7000,
        discountPrice: 5500,
        discountPriceStatus: true,
        photos: [{ secure_url: "https://img/1.png" }],
      }),
    ).toEqual({
      href: "/product/kent-softener",
      photo: "https://img/1.png",
      price: 5500,
      title: "Kent Softener",
    });
  });

  it("falls back to the list price and the id link", () => {
    expect(
      describeRawProduct({ _id: "a1", title: "X", price: 900, photos: [] }),
    ).toMatchObject({ href: "/product/a1", photo: null, price: 900 });
  });
});
