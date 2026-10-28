import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { ...actual.default, get: vi.fn() } };
});

const { getRecentPurchases } = await import("./storefront");
const get = vi.mocked(axios.get);

describe("getRecentPurchases", () => {
  beforeEach(() => get.mockReset());

  it("returns the feed and passes area, limit and days through", async () => {
    const data = { area: "Kondapur", days: 30, recent: [], trending: [] };
    get.mockResolvedValueOnce({ data: { success: true, data } });
    await expect(
      getRecentPurchases({ area: "  Kondapur ", limit: 5, days: 7 }),
    ).resolves.toEqual(data);
    const [url, config] = get.mock.calls[0];
    expect(url).toMatch(/\/storefront\/recent-purchases$/);
    expect(config.params).toEqual({ area: "Kondapur", limit: 5, days: 7 });
    expect(config.timeout).toBeGreaterThan(0);
  });

  it("leaves out empty params and keeps the caller's config", async () => {
    get.mockResolvedValueOnce({
      data: { success: true, data: { recent: [] } },
    });
    const signal = new AbortController().signal;
    await getRecentPurchases({ area: "" }, { signal });
    const [, config] = get.mock.calls[0];
    expect(config.params).toEqual({});
    expect(config.signal).toBe(signal);
  });

  it("caps the area at 60 characters", async () => {
    get.mockResolvedValueOnce({ data: { data: null } });
    await getRecentPurchases({ area: "x".repeat(80) });
    expect(get.mock.calls[0][1].params.area).toHaveLength(60);
  });

  it("returns null when the response has no data", async () => {
    get.mockResolvedValueOnce({ data: { success: false } });
    await expect(getRecentPurchases()).resolves.toBeNull();
  });

  it("returns null on a network or server error", async () => {
    get.mockRejectedValueOnce(new Error("Network Error"));
    await expect(getRecentPurchases()).resolves.toBeNull();
    get.mockRejectedValueOnce(
      Object.assign(new Error("Request failed with status code 500"), {
        response: { status: 500, data: { success: false } },
      }),
    );
    await expect(getRecentPurchases({ area: "Kondapur" })).resolves.toBeNull();
  });
});
