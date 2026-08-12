import { isValidInvoiceEmail, normalizeInvoiceEmail } from "@/services/invoice";

export const INVOICE_FLOW_PHASE = Object.freeze({
  AUTH_REQUIRED: "authentication-required",
  AUTHENTICATING: "authenticating",
  LOOKUP: "invoice-lookup",
  SEARCHING: "searching",
  EMPTY: "no-invoices-found",
  LIST: "invoice-list",
  CONFIRMING: "email-confirmation-required",
  UPDATING: "updating-email",
  READY: "ready-to-share",
  SENDING: "sending-email",
  SENT: "email-sent",
  ERROR: "email-failed",
});

export const createInitialInvoiceFlow = ({
  authenticated = false,
  user = null,
  phone = "",
} = {}) => ({
  phase: authenticated
    ? INVOICE_FLOW_PHASE.LOOKUP
    : INVOICE_FLOW_PHASE.AUTH_REQUIRED,
  phone,
  invoices: [],
  selectedInvoice: null,
  googleUser: user,
  deliveryEmail: normalizeInvoiceEmail(user?.email || ""),
  message: "",
  error: "",
});

const replaceInvoice = (invoices, updatedInvoice) =>
  invoices.map((invoice) =>
    invoice.id === updatedInvoice.id ? updatedInvoice : invoice,
  );

export const invoiceFlowReducer = (state, action) => {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        phase: INVOICE_FLOW_PHASE.AUTHENTICATING,
        error: "",
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        phase: INVOICE_FLOW_PHASE.LOOKUP,
        googleUser: action.user,
        deliveryEmail: normalizeInvoiceEmail(action.user?.email || ""),
        error: "",
      };
    case "AUTH_REQUIRED":
      return {
        ...createInitialInvoiceFlow({ phone: state.phone }),
        error: action.error || "",
      };
    case "PHONE_CHANGE":
      return { ...state, phone: action.phone, error: "", message: "" };
    case "SEARCH_START":
      return {
        ...state,
        phase: INVOICE_FLOW_PHASE.SEARCHING,
        error: "",
        message: "",
      };
    case "SEARCH_EMPTY":
      return {
        ...state,
        phase: INVOICE_FLOW_PHASE.EMPTY,
        invoices: [],
        selectedInvoice: null,
        message: action.message || "No invoices were found.",
      };
    case "SEARCH_SUCCESS":
      return {
        ...state,
        phase: INVOICE_FLOW_PHASE.LIST,
        invoices: action.invoices,
        googleUser: action.user || state.googleUser,
        deliveryEmail: normalizeInvoiceEmail(
          action.user?.email || state.deliveryEmail,
        ),
        message: action.message || "",
        error: "",
      };
    case "SELECT_INVOICE":
      return {
        ...state,
        phase:
          action.invoice.emailStatus !== "matches"
            ? INVOICE_FLOW_PHASE.CONFIRMING
            : INVOICE_FLOW_PHASE.READY,
        selectedInvoice: action.invoice,
        deliveryEmail: normalizeInvoiceEmail(
          state.googleUser?.email || state.deliveryEmail,
        ),
        error: "",
        message: "",
      };
    case "CLOSE_INVOICE":
      return {
        ...state,
        phase: INVOICE_FLOW_PHASE.LIST,
        selectedInvoice: null,
        error: "",
        message: "",
      };
    case "UPDATE_START":
      return {
        ...state,
        phase: INVOICE_FLOW_PHASE.UPDATING,
        error: "",
      };
    case "INVOICE_READY":
      return {
        ...state,
        phase: INVOICE_FLOW_PHASE.READY,
        invoices: replaceInvoice(state.invoices, action.invoice),
        selectedInvoice: action.invoice,
        message: action.message || "Invoice confirmed.",
        error: "",
      };
    case "DELIVERY_EMAIL_CHANGE":
      return {
        ...state,
        deliveryEmail: action.email,
        error: "",
      };
    case "SEND_START":
      return {
        ...state,
        phase: INVOICE_FLOW_PHASE.SENDING,
        error: "",
        message: "",
      };
    case "SEND_SUCCESS":
      return {
        ...state,
        phase: INVOICE_FLOW_PHASE.SENT,
        message: action.message || "Invoice sent.",
        error: "",
      };
    case "FAILURE":
      return {
        ...state,
        phase: action.phase || INVOICE_FLOW_PHASE.ERROR,
        error: action.error,
      };
    case "RESET_LOOKUP":
      return createInitialInvoiceFlow({
        authenticated: true,
        user: state.googleUser,
      });
    default:
      return state;
  }
};

export const findRequestedInvoice = (invoices, requestedId) => {
  const normalizedId = Array.isArray(requestedId)
    ? requestedId[0]
    : requestedId;
  if (typeof normalizedId !== "string" || !normalizedId.trim()) return null;

  return (
    (Array.isArray(invoices) ? invoices : []).find(
      (invoice) => String(invoice?.id || "") === normalizedId.trim(),
    ) || null
  );
};

export const getInvoiceEmailScenario = (invoice) => {
  if (invoice?.emailStatus === "matches") return "matches";
  if (invoice?.emailStatus === "missing") return "missing";
  return "different";
};

export const validateDeliveryEmail = (value) =>
  isValidInvoiceEmail(value)
    ? ""
    : "Enter a valid email address for this delivery.";

export const shouldShowInvoiceAuthLoader = ({
  authReady,
  authGateExpired,
  phase,
}) =>
  phase === INVOICE_FLOW_PHASE.AUTHENTICATING ||
  (!authReady && !authGateExpired);
