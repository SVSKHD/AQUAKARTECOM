// Aquakart AI shopping flow: one state machine for the whole single-page session.
// Driven with useReducer in AquaWorkspace. The chat, cart and favourites live
// OUTSIDE this machine and are never reset by it.

export type FlowState =
  | "welcome"
  | "chatting"
  | "product"
  // The comparison artifact: compared products side by side in the panel.
  | "compare"
  | "checkout"
  | "payment_pending"
  | "payment_failed"
  | "confirmed";

export type FlowActionType =
  | "SEND"
  | "VIEW"
  | "COMPARE"
  | "BUY"
  | "CHECKOUT_CART"
  | "BACK"
  | "CLOSE"
  | "RESUME"
  | "RESET"
  | "PAY"
  | "VERIFIED"
  | "FAILED"
  | "DEMO_PREVIEW"
  | "RETRY"
  | "EDIT";

export type FlowAction = { type: FlowActionType; productId?: string | null };

export type Flow = {
  state: FlowState;
  parked: FlowState | null;
  productId: string | null;
};

type Target = FlowState | "*parked";

export const FLOW: Record<
  FlowState,
  Partial<Record<FlowActionType, Target>>
> = {
  welcome: {
    SEND: "chatting",
    VIEW: "product",
    COMPARE: "compare",
    CHECKOUT_CART: "checkout",
  },
  chatting: {
    VIEW: "product",
    COMPARE: "compare",
    CHECKOUT_CART: "checkout",
    RESUME: "*parked",
    RESET: "welcome",
  },
  product: {
    VIEW: "product",
    // Only offered when the product was opened from the comparison.
    BACK: "compare",
    COMPARE: "compare",
    BUY: "checkout",
    CHECKOUT_CART: "checkout",
    CLOSE: "chatting",
    RESET: "welcome",
  },
  // View or buy any compared product from here (BUY carries its productId).
  compare: {
    VIEW: "product",
    COMPARE: "compare",
    BUY: "checkout",
    CHECKOUT_CART: "checkout",
    CLOSE: "chatting",
    RESET: "welcome",
  },
  checkout: {
    BACK: "product",
    VIEW: "product",
    COMPARE: "compare",
    PAY: "payment_pending",
    CLOSE: "chatting",
    RESET: "welcome",
  },
  payment_pending: {
    VERIFIED: "confirmed",
    FAILED: "payment_failed",
    DEMO_PREVIEW: "confirmed",
  },
  payment_failed: {
    // A late "paid" from the server (after a timeout or a manual re-check).
    VERIFIED: "confirmed",
    RETRY: "payment_pending",
    EDIT: "checkout",
    VIEW: "product",
    COMPARE: "compare",
    CLOSE: "chatting",
    RESET: "welcome",
  },
  confirmed: {
    VIEW: "product",
    COMPARE: "compare",
    CLOSE: "chatting",
    RESET: "welcome",
  },
};

export const initialFlow: Flow = {
  state: "welcome",
  parked: null,
  productId: null,
};

// Returns the state an action would lead to, or null when the machine rejects it.
export function nextState(f: Flow, type: FlowActionType): FlowState | null {
  const target = FLOW[f.state]?.[type];
  if (!target) return null;
  return target === "*parked" ? f.parked : target;
}

export const canDispatch = (f: Flow, type: FlowActionType) =>
  nextState(f, type) !== null;

// Closing the panel from checkout / failed payment "parks" it so the customer can resume.
export function flowReducer(f: Flow, action: FlowAction): Flow {
  const next = nextState(f, action.type);
  if (!next) return f; // illegal transition: ignore
  const parked =
    action.type === "CLOSE" &&
    (f.state === "checkout" || f.state === "payment_failed")
      ? f.state
      : null;
  const productId =
    next === "compare"
      ? null
      : next === "chatting" || next === "welcome"
        ? parked
          ? f.productId
          : null
        : (action.productId ?? f.productId);
  return { state: next, parked, productId };
}

export const panelOpen = (f: Flow) =>
  f.state !== "welcome" && f.state !== "chatting";
export const isPaymentLocked = (f: Flow) => f.state === "payment_pending";
