import type { Dispatch } from "react";
import type { Flow, FlowAction } from "@/utils/aquaFlow";

export type Category =
  "softener" | "purifier" | "filter" | "commercial" | "other";

export type Product = {
  id: string;
  title: string;
  brand: string;
  cat: Category;
  price: number;
  mrp: number;
  photos: string[];
  inStock: boolean;
  stock: string;
  desc: string;
  capacity?: string;
  flow?: string;
  maxPeople?: number;
  maxPpm?: number;
  regen?: string;
  warranty?: string;
  install?: string;
  maintenance?: string;
  variants?: string[];
  slug?: string;
  demo?: boolean;
  // Original API object, kept so Redux cart/favourites stay compatible with the rest of the site.
  raw?: Record<string, unknown>;
};

export type Selection = { variant: number; qty: number };
export type SelectionMap = Record<string, Selection>;

export type ChatMessage = {
  id: string;
  role: "user" | "aqua";
  text: string;
  full?: string;
  done?: boolean;
  typing?: boolean;
  productId?: string | null;
  products?: string[];
  chips?: string[];
  note?: string;
  table?: string[];
  // A failed backend answer; `retry` holds what to resend.
  error?: boolean;
  retry?: { text: string; productId: string | null };
};

export type ChatStatus = "idle" | "thinking" | "streaming";

export type Mood =
  | "idle"
  | "greeting"
  | "listening"
  | "thinking"
  | "speaking"
  | "happy"
  | "success"
  | "error";

export type CheckoutSource = "buy" | "cart";
export type CheckoutItem = {
  id: string;
  qty: number;
  variant: number;
  variantLabel?: string;
  title: string;
  price: number;
  photo?: string;
};

export type QuoteState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      data: import("@/utils/aquaCommerce").Quote;
      demo: boolean;
    }
  | { status: "error"; error: string };

export type Address = {
  _id?: string;
  label?: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
};

export type CheckoutDraft = {
  source: CheckoutSource;
  items: CheckoutItem[];
  name: string;
  phone: string;
  email: string;
  address: Address;
  savedAddressId: string | null;
  slotDay: string;
  slotTime: string;
  coupon: string;
};

export type PaymentInfo = {
  live: boolean;
  txn: string | null;
  orderId: string | null;
  url: string | null;
  popup: Window | null;
  reason: string;
  // Only ever set from a /order/transaction-id response that reported "paid".
  serverOrder: Record<string, unknown> | null;
  demoId: string | null;
};

export const emptyPayment: PaymentInfo = {
  live: false,
  txn: null,
  orderId: null,
  url: null,
  popup: null,
  reason: "",
  serverOrder: null,
  demoId: null,
};

export type FlowDispatch = Dispatch<FlowAction>;
export type FlowProps = { flow: Flow; dispatch: FlowDispatch };
