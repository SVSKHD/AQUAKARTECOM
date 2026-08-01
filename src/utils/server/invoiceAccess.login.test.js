import { describe, expect, it } from "vitest";

import { isSameOriginRequest } from "./invoiceAccess";

describe("isSameOriginRequest", () => {
  it("accepts matching browser origins", () => {
    expect(
      isSameOriginRequest({
        headers: { origin: "https://aquakart.co.in", host: "aquakart.co.in" },
      }),
    ).toBe(true);
  });

  it("rejects cross-site session creation", () => {
    expect(
      isSameOriginRequest({
        headers: { origin: "https://attacker.example", host: "aquakart.co.in" },
      }),
    ).toBe(false);
  });
});
