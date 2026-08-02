import { describe, expect, it } from "vitest";
import { shouldUseRedirectFallback } from "./googleAuth";

describe("Google authentication fallback", () => {
  it("uses redirect when a browser blocks the popup", () => {
    expect(shouldUseRedirectFallback({ code: "auth/popup-blocked" })).toBe(
      true,
    );
  });

  it("keeps cancellation as a customer-controlled outcome", () => {
    expect(
      shouldUseRedirectFallback({ code: "auth/popup-closed-by-user" }),
    ).toBe(false);
  });
});
