import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const firebase = vi.hoisted(() => ({
  currentUser: null,
  authStateReady: () => Promise.resolve(),
}));
const signOutMock = vi.hoisted(() => vi.fn(() => Promise.resolve()));
const autoSelectOff = vi.hoisted(() => vi.fn());

vi.mock("@/lib/firebase/client", () => ({
  getFirebaseAuth: () => firebase,
  getGoogleProvider: () => ({}),
  isFirebaseConfigured: () => true,
}));
vi.mock("firebase/auth", () => ({
  getRedirectResult: vi.fn(),
  GoogleAuthProvider: { credential: vi.fn() },
  onAuthStateChanged: vi.fn(),
  signInWithCredential: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: signOutMock,
}));
vi.mock("@/services/googleOneTap", () => ({
  disableGoogleAutoSelect: autoSelectOff,
}));

process.env.NEXT_PUBLIC_API_URL = "https://api.example.test";

const {
  canReuseSession,
  checkBackendSession,
  restoreExistingGoogleLogin,
  sessionExpiresAt,
  signOutEverywhere,
} = await import("./googleAuth");

const DAY = 24 * 60 * 60 * 1000;
const jwtWith = (payload) =>
  `x.${btoa(JSON.stringify(payload)).replace(/=+$/, "")}.y`;
const sessionFor = (uid, expiresInMs) => ({
  token: jwtWith({
    _id: "u1",
    exp: Math.floor((Date.now() + expiresInMs) / 1000),
  }),
  user: { firebaseUid: uid, email: "ravi@example.com" },
});

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  firebase.currentUser = null;
  signOutMock.mockClear();
  autoSelectOff.mockClear();
});
afterEach(() => vi.unstubAllGlobals());

describe("stored session reuse", () => {
  it("reads the expiry from the token", () => {
    expect(sessionExpiresAt(jwtWith({ exp: 1700000000 }))).toBe(1700000000000);
    expect(sessionExpiresAt("not-a-jwt")).toBeNull();
    expect(sessionExpiresAt(jwtWith({ _id: "u1" }))).toBeNull();
  });

  it("reuses only the same Google account with over a week left", () => {
    expect(canReuseSession(sessionFor("g1", 20 * DAY), "g1")).toBe(true);
    expect(canReuseSession(sessionFor("g1", 20 * DAY), "g2")).toBe(false);
    expect(canReuseSession(sessionFor("g1", 3 * DAY), "g1")).toBe(false);
    expect(canReuseSession(null, "g1")).toBe(false);
  });

  it("skips the backend exchange when the stored session can be reused", async () => {
    firebase.currentUser = { uid: "g1", getIdToken: vi.fn() };
    const result = await restoreExistingGoogleLogin(sessionFor("g1", 20 * DAY));
    expect(result).toEqual({ reused: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(firebase.currentUser.getIdToken).not.toHaveBeenCalled();
  });

  it("exchanges for a new session when the stored one is near expiry", async () => {
    firebase.currentUser = {
      uid: "g1",
      getIdToken: vi.fn(() => Promise.resolve("fb-id")),
    };
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ token: "new", user: { firebaseUid: "g1" } }),
    });
    const result = await restoreExistingGoogleLogin(sessionFor("g1", DAY));
    expect(result.token).toBe("new");
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.example.test/v1/auth/google",
    );
  });

  it("restores nothing when Firebase is signed out", async () => {
    expect(await restoreExistingGoogleLogin(sessionFor("g1", 20 * DAY))).toBe(
      null,
    );
  });
});

describe("checkBackendSession", () => {
  it("separates refused, accepted and unreachable", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    expect(await checkBackendSession("t")).toEqual({ state: "invalid" });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ user: { email: "a@b.c" } }),
    });
    expect(await checkBackendSession("t")).toEqual({
      state: "ok",
      user: { email: "a@b.c" },
    });

    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
    expect(await checkBackendSession("t")).toEqual({ state: "unknown" });

    fetchMock.mockRejectedValueOnce(new Error("offline"));
    expect(await checkBackendSession("t")).toEqual({ state: "unknown" });

    expect(await checkBackendSession("")).toEqual({ state: "invalid" });
  });
});

describe("signOutEverywhere", () => {
  it("turns off auto sign-in, clears Firebase, cancels the token and this tab's data", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    sessionStorage.setItem("aqua.chat.tab", "chat-1");
    sessionStorage.setItem("aq-pay-paid:abc", "{}");
    sessionStorage.setItem("aquakart_keep", "1");
    await signOutEverywhere("session-token");
    expect(autoSelectOff).toHaveBeenCalled();
    expect(signOutMock).toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example.test/v1/auth/logout");
    expect(init.headers.Authorization).toBe("Bearer session-token");
    expect(init.keepalive).toBe(true);
    expect(sessionStorage.getItem("aqua.chat.tab")).toBeNull();
    expect(sessionStorage.getItem("aq-pay-paid:abc")).toBeNull();
    expect(sessionStorage.getItem("aquakart_keep")).toBe("1");
  });

  it("still signs out of Firebase when the backend can't be reached", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(signOutEverywhere("t")).resolves.toBeUndefined();
    expect(signOutMock).toHaveBeenCalled();
    error.mockRestore();
  });
});
