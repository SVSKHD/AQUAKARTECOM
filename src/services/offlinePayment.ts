// Payment links the team sends for an order agreed offline (a pre-invoice or a
// quotation on the backend). The storefront never branches on which kind it
// is: it shows "Your order" and the document number the API returns.
//
// Backend contract: AQUAKARTBACKEND docs/OFFLINE_PAYMENT_LINKS.md
//   GET  /payments/offline/:token            public summary (no auth)
//   POST /payments/offline/:token/customer   binds the signed-in account, saves address + alternatePhone
//   POST /payments/offline/:token/initiate   { redirectUrl } (PhonePe returns to /pay/:token?return=1)
//   GET  /payments/offline/:token/status     verified status; also tells whose link it is
//
// Signed-in calls send the Firebase ID token (Authorization) and the backend
// session JWT (X-Aquakart-Session). Unknown, revoked, expired and changed
// links all answer 404 LINK_UNAVAILABLE: one "no longer valid" screen.
import axios from "axios";
import { getFirebaseAuth } from "@/lib/firebase/client";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const PATH = "/payments/offline";
const START_TIMEOUT_MS = 30000;
const STATUS_TIMEOUT_MS = 15000;

export type OfflineLine = {
  name: string;
  description: string;
  quantity: number;
  // Not sent by the backend today; shown when it is.
  imageUrl: string | null;
};

export type OfflineSummary = {
  reference: string;
  lines: OfflineLine[];
  subtotal: number | null;
  discount: number | null;
  tax: number | null;
  total: number;
  currency: string;
  expiresAt: string | null;
  // The public view only knows paid / not paid; the rest needs sign-in.
  paid: boolean;
  // Masked primary mobile, when the backend sends one.
  phoneMasked: string;
};

export type OfflinePaymentState = "unpaid" | "pending" | "paid" | "failed";

export type OfflineStatus = {
  status: OfflinePaymentState;
  reference: string;
  invoiceNumber: string | null;
  // The invoice page (/invoice/[id]) needs the invoice's id; the backend
  // doesn't send it yet, and the download button stays hidden without it.
  invoiceId: string | null;
  invoiceReady: boolean;
  amount: number | null;
  amountPaid: number | null;
  transactionId: string | null;
  paidAt: string | null;
};

export type OfflineAddress = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
};

export type OfflineCustomerBody = {
  // Appended to the account's address book (never overwrites; identical
  // addresses aren't duplicated).
  address: OfflineAddress;
  alternatePhone?: string;
};

export type OfflineErrorKind =
  | "invalid" // unknown, revoked, expired or changed link
  | "bound" // linked to another Aquakart account
  | "details" // signed in, but details not confirmed yet (link unbound)
  | "paid" // already paid
  | "auth" // sign in (again) first
  | "other";

export class OfflinePaymentError extends Error {
  kind: OfflineErrorKind;
  status?: number;
  code?: string;
  constructor(
    message: string,
    kind: OfflineErrorKind,
    status?: number,
    code?: string,
  ) {
    super(message);
    this.name = "OfflinePaymentError";
    this.kind = kind;
    this.status = status;
    this.code = code;
  }
}

type AxiosLikeError = {
  response?: {
    status?: number;
    data?: {
      message?: string;
      code?: string;
      details?: Record<string, unknown>;
    };
  };
  code?: string;
  message?: string;
};

const toError = (e: unknown, fallback: string): OfflinePaymentError => {
  if (e instanceof OfflinePaymentError) return e;
  const err = e as AxiosLikeError;
  const status = err?.response?.status;
  const data = err?.response?.data || {};
  const code = String(data.code || "").toUpperCase();
  const make = (message: string, kind: OfflineErrorKind) =>
    new OfflinePaymentError(message, kind, status, code || undefined);
  if (status === 404 || code === "LINK_UNAVAILABLE")
    return make("This link is no longer valid.", "invalid");
  if (status === 403 || code === "LINK_BOUND_TO_ANOTHER_USER")
    return make(
      "This payment link is linked to another Aquakart account.",
      "bound",
    );
  if (status === 401) return make("Please sign in again to continue.", "auth");
  if (code === "CUSTOMER_DETAILS_REQUIRED")
    return make("Confirm your details before paying.", "details");
  if (code === "ALREADY_PAID")
    return make("This order is already paid.", "paid");
  if (err?.code === "ECONNABORTED")
    return make(
      "Aquakart is taking too long to answer. Please try again.",
      "other",
    );
  // VALIDATION_FAILED: details are keyed by field; show the first one.
  const detail =
    data.details && typeof data.details === "object"
      ? Object.values(data.details).find((v) => typeof v === "string")
      : undefined;
  return make((detail as string) || data.message || fallback, "other");
};

// Firebase ID token (cached by Firebase, refreshed when close to expiry) plus
// the backend session, as the customer endpoints require.
async function authHeaders(sessionToken: string) {
  let idToken = "";
  try {
    const fb = getFirebaseAuth();
    await fb.authStateReady?.();
    idToken = (await fb.currentUser?.getIdToken()) || "";
  } catch {
    idToken = "";
  }
  if (!idToken || !sessionToken)
    throw new OfflinePaymentError("Please sign in again to continue.", "auth");
  return {
    Authorization: `Bearer ${idToken}`,
    "X-Aquakart-Session": sessionToken,
  };
}

const url = (token: string, tail = "") =>
  `${BASE}${PATH}/${encodeURIComponent(token)}${tail}`;

const body = (res: { data?: unknown }) => {
  const d = res?.data as { data?: unknown } | undefined;
  return (d && typeof d === "object" && "data" in d ? d.data : d) as Record<
    string,
    unknown
  > | null;
};

const num = (v: unknown): number | null => {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};
const str = (v: unknown): string =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
const strOrNull = (v: unknown) => str(v) || null;

// Backend statuses: not_started, pending, paid, failed, expired, refunded.
// Only an explicit "paid" counts as paid.
export const toOfflineState = (v: unknown): OfflinePaymentState => {
  const s = str(v).toLowerCase();
  if (s === "paid") return "paid";
  if (s === "pending" || s === "created") return "pending";
  if (s === "failed" || s === "expired" || s === "refunded") return "failed";
  return "unpaid";
};

export const toSummary = (
  raw: Record<string, unknown> | null,
): OfflineSummary => {
  const r = raw || {};
  const lines = Array.isArray(r.products) ? r.products : [];
  return {
    reference: str(r.documentNumber),
    lines: lines
      .filter((l): l is Record<string, unknown> => !!l && typeof l === "object")
      .map((l) => ({
        name: str(l.name) || "Item",
        description: str(l.description),
        quantity: num(l.quantity) ?? 1,
        imageUrl: strOrNull(l.imageUrl),
      })),
    subtotal: num(r.subTotal),
    discount: num(r.discount),
    tax: num(r.tax),
    total: num(r.amount) ?? 0,
    currency: str(r.currency) || "INR",
    expiresAt: strOrNull(r.expiresAt),
    paid: str(r.state).toLowerCase() === "paid",
    phoneMasked: str(r.phoneMasked),
  };
};

export const toStatus = (
  raw: Record<string, unknown> | null,
): OfflineStatus => {
  const r = raw || {};
  return {
    status: toOfflineState(r.status),
    reference: str(r.documentNumber),
    invoiceNumber: strOrNull(r.invoiceNo),
    invoiceId: strOrNull(r.invoiceId),
    invoiceReady: r.invoiceReady === true,
    amount: num(r.amount),
    amountPaid: num(r.amountPaid),
    transactionId: strOrNull(r.gatewayTransactionId),
    paidAt: strOrNull(r.paidAt),
  };
};

export async function getOfflineSummary(
  token: string,
  signal?: AbortSignal,
): Promise<OfflineSummary> {
  try {
    const res = await axios.get(url(token), {
      signal,
      timeout: STATUS_TIMEOUT_MS,
    });
    return toSummary(body(res));
  } catch (e) {
    throw toError(e, "Couldn't load this order.");
  }
}

export async function saveOfflineCustomer(
  token: string,
  data: OfflineCustomerBody,
  sessionToken: string,
): Promise<void> {
  try {
    await axios.post(url(token, "/customer"), data, {
      headers: await authHeaders(sessionToken),
      timeout: STATUS_TIMEOUT_MS,
    });
  } catch (e) {
    throw toError(e, "Couldn't save your details.");
  }
}

export async function initiateOfflinePayment(
  token: string,
  sessionToken: string,
): Promise<{ redirectUrl: string }> {
  try {
    const res = await axios.post(
      url(token, "/initiate"),
      {},
      {
        headers: await authHeaders(sessionToken),
        timeout: START_TIMEOUT_MS,
      },
    );
    const redirectUrl = str(body(res)?.redirectUrl);
    if (!redirectUrl)
      throw new OfflinePaymentError(
        "PhonePe did not return a payment page.",
        "other",
      );
    return { redirectUrl };
  } catch (e) {
    throw toError(e, "Couldn't start the payment.");
  }
}

// Also answers "whose link is this": 403 another account, 409
// CUSTOMER_DETAILS_REQUIRED nobody yet (kind "details").
export async function getOfflineStatus(
  token: string,
  sessionToken: string,
  signal?: AbortSignal,
): Promise<OfflineStatus> {
  try {
    const res = await axios.get(url(token, "/status"), {
      headers: await authHeaders(sessionToken),
      signal,
      timeout: STATUS_TIMEOUT_MS,
    });
    return toStatus(body(res));
  } catch (e) {
    throw toError(e, "Couldn't check the payment.");
  }
}

// The storefront catalogue (same source as the invoice page), used only to
// show product photos and details next to the order's lines. Prices come from
// the order, never from here. Resolves to null when it can't be loaded.
export async function getProductCatalogue(
  signal?: AbortSignal,
): Promise<unknown> {
  try {
    const res = await axios.get("/api/all-products", {
      params: { query: "ecom" },
      signal,
      timeout: STATUS_TIMEOUT_MS,
    });
    return res.data ?? null;
  } catch {
    return null;
  }
}
