// Small, pure helpers for the /pay/[token] screens (unit-tested on their own).

export const payPath = (token: string) => `/pay/${encodeURIComponent(token)}`;

// Where PhonePe sends the customer back (set by the backend on initiate).
export const isPayReturn = (v: unknown) => v === "1";

export const money = (value: number | null | undefined) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);

// A 10-digit Indian mobile number, from what was typed ("+91 98765 43210",
// "098765 43210"), or "" when it isn't one.
export function toMobile(raw: string): string {
  let d = (raw || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : "";
}

// Why the alternate number can't be used ("" when it can). It is optional, as
// on the backend. The primary is never sent in full, so "must differ" can only
// be checked against a fully shown number.
export function alternatePhoneProblem(raw: string, primaryMasked: string) {
  if (!raw.trim()) return "";
  const mobile = toMobile(raw);
  if (!mobile) return "Enter a valid 10-digit mobile number.";
  const shown = (primaryMasked || "").replace(/\D/g, "");
  if (shown.length >= 10 && shown.endsWith(mobile))
    return "Use a different number from your primary mobile.";
  return "";
}

// In-app browsers (WhatsApp, Instagram, Facebook, Android WebViews) where
// Google may refuse sign-in. Chrome Custom Tabs and SFSafariViewController,
// which WhatsApp normally uses, report as Chrome/Safari and are not matched.
export function isInAppBrowser(ua: string): boolean {
  return /WhatsApp|FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|; wv\)/i.test(
    ua || "",
  );
}

export const isAndroid = (ua: string) => /Android/i.test(ua || "");

// Google's answer when it won't sign in from an embedded browser.
export const isRefusedInAppSignIn = (error: unknown) => {
  const e = error as { code?: string; message?: string } | null;
  return (
    e?.code === "auth/disallowed-useragent" ||
    /disallowed[_-]useragent/i.test(e?.message || "")
  );
};

// Opens the page in Chrome from an Android WebView. iOS has no equivalent:
// the customer copies the link or uses the share menu.
export function chromeIntentUrl(href: string): string {
  try {
    const u = new URL(href);
    return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(":", "")};package=com.android.chrome;end`;
  } catch {
    return href;
  }
}

// The paid status /pay/[token] just confirmed, handed to the success page so
// it can show the receipt at once while it re-checks with the server. Kept in
// sessionStorage (this tab only); storage failures are ignored.
const paidKey = (token: string) => `aq-pay-paid:${token}`;

export function rememberPaid(token: string, status: unknown) {
  try {
    window.sessionStorage.setItem(paidKey(token), JSON.stringify(status));
  } catch {
    // Private mode or storage blocked: the success page just loads normally.
  }
}

export function recallPaid<T extends { status?: unknown }>(
  token: string,
): T | null {
  try {
    const raw = window.sessionStorage.getItem(paidKey(token));
    const v = raw ? (JSON.parse(raw) as T) : null;
    return v && typeof v === "object" && v.status === "paid" ? v : null;
  } catch {
    return null;
  }
}
