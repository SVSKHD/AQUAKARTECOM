const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.aquakart.co.in/v1";
const SESSION_KEY = "aquakart_analytics_session_id";
const HEARTBEAT_MS = 15000;

const randomId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
};

const getSessionId = () => {
  if (typeof window === "undefined") return "";
  let sessionId = window.localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = randomId();
    window.localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

const sendEvent = (payload, keepalive = false) => {
  if (typeof window === "undefined") return Promise.resolve();
  return fetch(`${API_BASE}/analytics/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive,
    credentials: "omit",
  }).catch(() => undefined);
};

export const startAnalyticsVisit = (url) => {
  if (typeof window === "undefined") return () => {};

  const visitId = randomId();
  const sessionId = getSessionId();
  const startedAt = Date.now();
  const pagePath = (url || window.location.pathname + window.location.search).slice(0, 500);
  const basePayload = {
    visitId,
    sessionId,
    pagePath,
    pageTitle: document.title || "",
    referrer: document.referrer || "",
  };

  const durationSeconds = () => Math.max(0, Math.round((Date.now() - startedAt) / 1000));
  let stopped = false;

  sendEvent({ ...basePayload, event: "open", durationSeconds: 0 });

  const heartbeat = window.setInterval(() => {
    if (stopped || document.visibilityState !== "visible") return;
    sendEvent({ ...basePayload, event: "heartbeat", durationSeconds: durationSeconds() });
  }, HEARTBEAT_MS);

  const onVisibilityChange = () => {
    if (!stopped && document.visibilityState === "hidden") {
      sendEvent({ ...basePayload, event: "heartbeat", durationSeconds: durationSeconds() }, true);
    }
  };

  const onPageHide = () => {
    if (!stopped) {
      sendEvent({ ...basePayload, event: "leave", durationSeconds: durationSeconds() }, true);
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", onPageHide);

  return () => {
    if (stopped) return;
    stopped = true;
    window.clearInterval(heartbeat);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", onPageHide);
    sendEvent({ ...basePayload, event: "leave", durationSeconds: durationSeconds() }, true);
  };
};
