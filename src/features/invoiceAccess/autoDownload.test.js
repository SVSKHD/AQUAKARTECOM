import { beforeEach, describe, expect, it } from "vitest";

import {
  clearDownloadAfterLogin,
  consumeDownloadAfterLogin,
  requestDownloadAfterLogin,
} from "./autoDownload";

const ID = "6a6ff135aafb698d0de9966b";

describe("download after login", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") window.sessionStorage.clear();
  });

  it("fires once for the invoice that asked, within ten minutes", () => {
    requestDownloadAfterLogin(ID, 1_000);
    expect(consumeDownloadAfterLogin(ID, 2_000)).toBe(true);
    expect(consumeDownloadAfterLogin(ID, 2_000)).toBe(false);
  });

  it("ignores another invoice and keeps the request", () => {
    requestDownloadAfterLogin(ID, 0);
    expect(consumeDownloadAfterLogin("other", 0)).toBe(false);
    expect(consumeDownloadAfterLogin(ID, 0)).toBe(true);
  });

  it("expires stale requests and clears them", () => {
    requestDownloadAfterLogin(ID, 0);
    expect(consumeDownloadAfterLogin(ID, 11 * 60 * 1000)).toBe(false);
    expect(consumeDownloadAfterLogin(ID, 0)).toBe(false);
  });

  it("can be cancelled", () => {
    requestDownloadAfterLogin(ID, 0);
    clearDownloadAfterLogin();
    expect(consumeDownloadAfterLogin(ID, 0)).toBe(false);
  });
});
