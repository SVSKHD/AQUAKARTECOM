import { describe, expect, it } from "vitest";
import {
  alternatePhoneProblem,
  chromeIntentUrl,
  isInAppBrowser,
  isRefusedInAppSignIn,
  isPayReturn,
  toMobile,
} from "./payHelpers";

describe("pay helpers", () => {
  it("normalises Indian mobile numbers", () => {
    expect(toMobile("+91 98765 43210")).toBe("9876543210");
    expect(toMobile("098765 43210")).toBe("9876543210");
    expect(toMobile("12345")).toBe("");
    expect(toMobile("5876543210")).toBe("");
  });

  it("accepts no alternate mobile, or a valid one that differs from the primary", () => {
    expect(alternatePhoneProblem("", "98XXXXXX10")).toBe("");
    expect(alternatePhoneProblem("  ", "")).toBe("");
    expect(alternatePhoneProblem("123", "98XXXXXX10")).toMatch(/valid/);
    expect(alternatePhoneProblem("9876543210", "98XXXXXX10")).toBe("");
    // Only a number shown in full can be compared here; the server checks the rest.
    expect(alternatePhoneProblem("9876543210", "+91 9876543210")).toMatch(
      /different/,
    );
  });

  it("recognises PhonePe's return to the page", () => {
    expect(isPayReturn("1")).toBe(true);
    expect(isPayReturn(undefined)).toBe(false);
    expect(isPayReturn("0")).toBe(false);
  });

  it("recognises in-app browsers but not Chrome or Safari", () => {
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
      ),
    ).toBe(true);
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Instagram 300.0",
      ),
    ).toBe(true);
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
      ),
    ).toBe(false);
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(false);
  });

  it("recognises Google's refusal and builds a Chrome intent", () => {
    expect(isRefusedInAppSignIn({ code: "auth/disallowed-useragent" })).toBe(
      true,
    );
    expect(isRefusedInAppSignIn({ code: "auth/popup-closed-by-user" })).toBe(
      false,
    );
    expect(chromeIntentUrl("https://aquakart.co.in/pay/abc?return=1")).toBe(
      "intent://aquakart.co.in/pay/abc?return=1#Intent;scheme=https;package=com.android.chrome;end",
    );
  });
});
