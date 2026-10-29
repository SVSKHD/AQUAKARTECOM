import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A stand-in for Google Identity Services: prompt() reports what we tell it to.
const gis = (behaviour) => {
  let callback;
  const id = {
    initialize: vi.fn((cfg) => {
      callback = cfg.callback;
    }),
    prompt: vi.fn((onMoment) => behaviour({ callback, onMoment })),
    cancel: vi.fn(),
    disableAutoSelect: vi.fn(),
  };
  window.google = { accounts: { id } };
  return id;
};

const load = async () => {
  vi.resetModules();
  return import("./googleOneTap");
};

describe("googleOneTap", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "client-1"));
  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.google;
  });

  it("resolves with the Google ID token the card returns", async () => {
    const id = gis(({ callback }) => callback({ credential: "id-token" }));
    const { promptGoogleOneTap } = await load();
    await expect(promptGoogleOneTap()).resolves.toBe("id-token");
    expect(id.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: "client-1",
        use_fedcm_for_prompt: true,
      }),
    );
  });

  it("resolves null when Google skips the card, so sign-in can fall back", async () => {
    gis(({ onMoment }) => onMoment({ isSkippedMoment: () => true }));
    const { promptGoogleOneTap } = await load();
    await expect(promptGoogleOneTap()).resolves.toBeNull();
  });

  it("shares one open card and releases it on cancel", async () => {
    const id = gis(() => {});
    const { promptGoogleOneTap, cancelGoogleOneTap } = await load();
    const first = promptGoogleOneTap();
    expect(promptGoogleOneTap()).toBe(first);
    await Promise.resolve();
    cancelGoogleOneTap();
    await expect(first).resolves.toBeNull();
    expect(id.cancel).toHaveBeenCalled();
  });

  it("does nothing without a client ID", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");
    const id = gis(() => {});
    const { promptGoogleOneTap } = await load();
    await expect(promptGoogleOneTap()).resolves.toBeNull();
    expect(id.prompt).not.toHaveBeenCalled();
  });
});
