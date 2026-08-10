import { describe, expect, it } from "vitest";
import { getUserDisplayName, getUserInitials, isGoogleSession } from "./user";

describe("user display name", () => {
  it("builds the name from the fields the backend actually returns", () => {
    // The API has no `name` column — only firstName/lastName.
    expect(
      getUserDisplayName({ firstName: "Hithesh", lastName: "Sunkara" }),
    ).toBe("Hithesh Sunkara");
  });

  it("falls back to the email handle instead of a generic placeholder", () => {
    expect(getUserDisplayName({ email: "koushik@aquakart.co.in" })).toBe(
      "koushik",
    );
  });

  it("keeps the legacy name field working", () => {
    expect(getUserDisplayName({ name: "Aqua Customer" })).toBe("Aqua Customer");
  });

  it("uses the fallback when there is nothing to show", () => {
    expect(getUserDisplayName(null, "User")).toBe("User");
    expect(getUserDisplayName({}, "User")).toBe("User");
  });

  it("derives initials from the resolved name", () => {
    expect(getUserInitials({ firstName: "Hithesh", lastName: "Sunkara" })).toBe(
      "HS",
    );
    expect(getUserInitials({})).toBe("A");
  });
});

describe("google session detection", () => {
  it("recognises a session Firebase is responsible for", () => {
    expect(isGoogleSession({ user: { firebaseUid: "uid-1" } })).toBe(true);
    expect(isGoogleSession({ user: { authProvider: "google.com" } })).toBe(
      true,
    );
  });

  it("leaves OTP sessions alone so Firebase cannot sign them out", () => {
    expect(isGoogleSession({ user: { email: "a@b.com" } })).toBe(false);
    expect(isGoogleSession(null)).toBe(false);
  });
});
