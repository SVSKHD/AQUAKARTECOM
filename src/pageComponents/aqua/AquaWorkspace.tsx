"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PointerEvent as RPointerEvent,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import {
  canDispatch,
  flowReducer,
  initialFlow,
  isPaymentLocked,
  panelOpen,
  type FlowAction,
} from "@/utils/aquaFlow";
import {
  CheckoutPaymentError,
  findOrder,
  quote,
  quoteSessionId,
  startCheckoutPayment,
  type ServerOrder,
} from "@/utils/aquaCommerce";
import { aquaConfig, pickDayTheme } from "./config";
import { useAquaAuth } from "./useAquaAuth";
import { DEMO_PRODUCTS, loadCatalogue, toStoreItem } from "./catalogue";
import { storage, useIsMobile, useReducedMotion } from "./hooks";
import { readThinkingPref, writeThinkingPref } from "@/services/ai";
import { useAquaChat } from "./useAquaChat";
import {
  emptyPayment,
  type Address,
  type CheckoutDraft,
  type CheckoutItem,
  type Mood,
  type PaymentInfo,
  type Product,
  type QuoteState,
  type Selection,
  type SelectionMap,
} from "./types";
import ThemeLayer from "./ThemeLayer";
import AquaHeader from "./AquaHeader";
import HistoryDock from "./HistoryDock";
import Conversation from "./Conversation";
import WorkspacePanel from "./WorkspacePanel";
import ShopPopover, { type ShopTab } from "./ShopPopover";
import AquaTour, { TOUR_KEY } from "./AquaTour";
import type { Purchase } from "./HistoryDock";
import { getMyInvoices } from "@/services/invoice";

// Redux slices are plain JS; describe just what Aqua reads.
type StoreItem = {
  _id: string;
  title?: string;
  price?: number;
  quantity?: number;
  photos?: unknown[];
  discountPrice?: number;
  discountPriceStatus?: boolean;
};
type UserData = {
  token?: string;
  user?: {
    _id?: string;
    name?: string;
    firstName?: string;
    email?: string;
    phone?: string;
    addresses?: Address[];
    selectedAddress?: Address;
  };
} | null;
type RootState = {
  userData: UserData;
  cartData: StoreItem[];
  favData: StoreItem[];
};

const DEFAULT_SEL: Selection = { variant: 0, qty: 1 };
const clampSplit = (n: number) =>
  Math.min(aquaConfig.splitMax, Math.max(aquaConfig.splitMin, n));
const storePrice = (i: StoreItem) =>
  Number(
    i.discountPriceStatus && i.discountPrice ? i.discountPrice : i.price,
  ) || 0;
const storePhoto = (i: StoreItem) => {
  const p = (i.photos || [])[0] as string | { secure_url?: string } | undefined;
  return typeof p === "string" ? p : p?.secure_url;
};

export default function AquaWorkspace() {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile(aquaConfig.mobileBreakpoint);
  // Below 1024px (phones, iPads in portrait) a side-by-side split leaves the chat
  // ~300px wide and squeezes the panel, so the panel opens as a bottom sheet.
  const sheetLayout = useIsMobile(aquaConfig.splitBreakpoint);
  const store = useDispatch();
  const userData = useSelector((s: RootState) => s.userData);
  const cart = useSelector((s: RootState) => s.cartData) || [];
  const favs = useSelector((s: RootState) => s.favData) || [];
  const token = userData?.token || null;

  // ---------- flow machine: the only owner of panel/step state ----------
  const [flow, rawDispatch] = useReducer(flowReducer, initialFlow);
  const flowRef = useRef(flow);
  const dispatch = useCallback((a: FlowAction) => {
    if (
      process.env.NODE_ENV !== "production" &&
      !canDispatch(flowRef.current, a.type)
    ) {
      console.warn(
        `[aquaFlow] "${a.type}" rejected in state "${flowRef.current.state}"`,
        a,
      );
    }
    flowRef.current = flowReducer(flowRef.current, a);
    rawDispatch(a);
  }, []);
  const open = panelOpen(flow);
  const locked = isPaymentLocked(flow);

  // ---------- catalogue ----------
  const [catalogue, setCatalogue] = useState({
    products: DEMO_PRODUCTS,
    live: false,
    loading: true,
  });
  useEffect(() => {
    const ctl = new AbortController();
    loadCatalogue(ctl.signal).then((r) => {
      if (!ctl.signal.aborted) setCatalogue({ ...r, loading: false });
    });
    return () => ctl.abort();
  }, []);
  const products = catalogue.products;
  const byId = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );
  const commerceLive = catalogue.live && !!token;

  // ---------- per-product selections (restored when a product is reopened) ----------
  const [selections, setSelections] = useState<SelectionMap>({});
  const getSel = (id: string | null) => (id && selections[id]) || DEFAULT_SEL;
  const setSel = (id: string, patch: Partial<Selection>) =>
    setSelections((m) => ({
      ...m,
      [id]: { ...(m[id] || DEFAULT_SEL), ...patch },
    }));

  // ---------- compare ----------
  const [compare, setCompare] = useState<string[]>([]);
  const compareRef = useRef(compare);
  useEffect(() => {
    compareRef.current = compare;
  }, [compare]);
  const getCompare = useCallback(() => compareRef.current, []);
  const clearCompare = useCallback(() => setCompare([]), []);
  const toggleCompare = (id: string) => {
    // Adding to compare counts as looking at it, for the history dock.
    if (!compare.includes(id) && byId.has(id))
      setViewed((v) => [id, ...v.filter((x) => x !== id)].slice(0, 12));
    setCompare((c) =>
      c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-3),
    );
  };

  // ---------- chat (lives outside the flow machine) ----------
  // "Show thinking" (shared with the storefront widget): off sends thinking: false.
  const [showThinking, setShowThinking] = useState(readThinkingPref);
  const toggleThinking = () =>
    setShowThinking((on) => {
      writeThinkingPref(!on);
      return !on;
    });
  const chat = useAquaChat({
    products,
    getCompare,
    clearCompare,
    reducedMotion,
    thinking: showThinking,
    token,
    // The backend rejected the stored token: sign out properly instead of
    // showing a logged-in customer the guest limits.
    onSessionExpired: () => {
      store({ type: "LOGOUT", payload: null });
      showToast("Your session expired. Please log in again.");
    },
    // A saved conversation came back after a refresh: show it, not the welcome screen.
    onResumed: () => {
      if (flowRef.current.state === "welcome") dispatch({ type: "SEND" });
    },
  });

  // ---------- UI chrome ----------
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    storage.get("aqua.theme") === "dark" ? "dark" : "light",
  );
  const [dayTheme] = useState(() => pickDayTheme());
  const auth = useAquaAuth(token);
  const userName =
    (token && (userData?.user?.name || userData?.user?.firstName)) || null;
  useEffect(() => storage.set("aqua.theme", theme), [theme]);
  // Sign-in from the header fails out of sight of the dock: say why in a toast too.
  useEffect(() => {
    if (auth.error) showToast(auth.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.error]);
  const [split, setSplit] = useState(() =>
    clampSplit(Number(storage.get("aqua.split")) || aquaConfig.splitDefault),
  );
  const [dragging, setDragging] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [shop, setShop] = useState<ShopTab | null>(null);
  const [toast, setToast] = useState("");
  const toastT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const showToast = (t: string) => {
    clearTimeout(toastT.current);
    setToast(t);
    toastT.current = setTimeout(() => setToast(""), 2200);
  };
  const [focused, setFocused] = useState(false);
  const [greeting, setGreeting] = useState(true);
  const greetT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const greet = useCallback(() => {
    clearTimeout(greetT.current);
    setGreeting(true);
    greetT.current = setTimeout(() => setGreeting(false), 3200);
  }, []);
  useEffect(() => {
    greetT.current = setTimeout(() => setGreeting(false), 3200);
    return () => {
      clearTimeout(greetT.current);
      clearTimeout(toastT.current);
    };
  }, []);

  // Products the customer opened, newest first, for the history dock. Kept per
  // account across refreshes and new chats; a guest's list lasts for this visit.
  const viewedKey = token
    ? `aqua.viewed.${userData?.user?._id || userData?.user?.email || "me"}`
    : null;
  // The list and the key it belongs to change together, so a login never writes
  // one account's list under another's key.
  const [viewedState, setViewedState] = useState<{
    key: string | null;
    ids: string[];
  }>({ key: null, ids: [] });
  const viewed = viewedState.ids;
  const setViewed = (fn: (ids: string[]) => string[]) =>
    setViewedState((s) => ({ ...s, ids: fn(s.ids) }));
  useEffect(() => {
    setViewedState((s) => {
      if (s.key === viewedKey) return s;
      if (!viewedKey) return { key: null, ids: [] };
      let stored: string[] = [];
      try {
        const list = JSON.parse(storage.get(viewedKey) || "[]");
        if (Array.isArray(list))
          stored = list.filter((x) => typeof x === "string");
      } catch {
        // unreadable: start empty
      }
      // A guest who logs in keeps what they just browsed.
      const carried = s.key === null ? s.ids : [];
      return {
        key: viewedKey,
        ids: [...new Set([...carried, ...stored])].slice(0, 12),
      };
    });
  }, [viewedKey]);
  useEffect(() => {
    if (viewedState.key && viewedState.key === viewedKey)
      storage.set(
        viewedState.key,
        JSON.stringify(viewedState.ids.slice(0, 12)),
      );
  }, [viewedKey, viewedState]);
  // Opened in this conversation (Aqua follows up the first time only).
  const seenRef = useRef(new Set<string>());

  // ---------- mobile sheet ----------
  const [sheet, setSheet] = useState<"full" | "peek">("full");
  // Dragging the handle: the sheet follows the finger, then snaps to full or
  // peek (a flick decides the direction); dragging it near the bottom, or a firm
  // flick down from peek, closes it. A tap (or Enter/Space) toggles.
  const sheetRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{
    y: number;
    h: number;
    t: number;
    moved: boolean;
  } | null>(null);
  const skipClickRef = useRef(false);
  const [dragH, setDragH] = useState<number | null>(null);
  const onHandleDown = (e: RPointerEvent<HTMLButtonElement>) => {
    const el = sheetRef.current;
    if (!el) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      y: e.clientY,
      h: el.getBoundingClientRect().height,
      t: performance.now(),
      moved: false,
    };
  };
  const onHandleMove = (e: RPointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.abs(dy) < 6) return;
    d.moved = true;
    const fullH =
      window.innerHeight * 0.88 - (hideComposer ? 0 : composerH + mainPadB);
    setDragH(Math.min(fullH, Math.max(80, d.h - dy)));
  };
  const onHandleUp = (e: RPointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    skipClickRef.current = true;
    if (!d.moved) return setSheet((s) => (s === "full" ? "peek" : "full"));
    const dy = e.clientY - d.y;
    const v = dy / Math.max(1, performance.now() - d.t); // px/ms, positive = down
    const h = d.h - dy;
    const vh = window.innerHeight;
    setDragH(null);
    if ((h < vh * 0.2 || (v > 0.8 && sheet === "peek")) && !locked)
      return dispatch({ type: "CLOSE" });
    if (v > 0.5) return setSheet("peek");
    if (v < -0.5) return setSheet("full");
    setSheet(h > vh * 0.55 ? "full" : "peek");
  };
  const [peekFrom, setPeekFrom] = useState<number | null>(null);
  const [composerH, setComposerH] = useState(0);
  const roRef = useRef<ResizeObserver | null>(null);
  const composerRef = useCallback((el: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    if (!el) return;
    roRef.current = new ResizeObserver(([e]) =>
      setComposerH(Math.round(e.target.getBoundingClientRect().height)),
    );
    roRef.current.observe(el);
  }, []);

  // ---------- checkout + payment ----------
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [quoteState, setQuoteState] = useState<QuoteState>({ status: "idle" });
  const [payment, setPayment] = useState<PaymentInfo>(emptyPayment);

  const prefill = (
    items: CheckoutItem[],
    source: CheckoutDraft["source"],
  ): CheckoutDraft => {
    const u = userData?.user;
    const saved = u?.selectedAddress || u?.addresses?.[0];
    const prev = draft;
    return {
      source,
      items,
      name: prev?.name || u?.name || u?.firstName || "",
      phone: prev?.phone || u?.phone || "",
      email: prev?.email || u?.email || "",
      address:
        prev?.address ||
        (saved
          ? { ...saved }
          : { street: "", city: "", state: "", postalCode: "" }),
      savedAddressId: prev?.savedAddressId ?? saved?._id ?? null,
      slotDay: prev?.slotDay || "",
      slotTime: prev?.slotTime || "",
      coupon: prev?.coupon || chat.offerCode.current || "",
    };
  };

  // ---------- actions ----------
  const view = (id: string) => {
    const p = byId.get(id);
    if (!p || !canDispatch(flowRef.current, "VIEW"))
      return dispatch({ type: "VIEW", productId: id });
    const first = !seenRef.current.has(id);
    dispatch({ type: "VIEW", productId: id });
    setSheet("full");
    setDockOpen(false);
    setViewed((v) => [id, ...v.filter((x) => x !== id)].slice(0, 12));
    if (first) {
      seenRef.current.add(id);
      if (chat.messages.length)
        setTimeout(() => chat.onFirstView(p), reducedMotion ? 0 : 520);
    }
    chat.cheer(1200);
  };

  const buy = () => {
    const p = flow.productId ? byId.get(flow.productId) : undefined;
    if (!p || !p.inStock) return;
    const sel = getSel(p.id);
    const item: CheckoutItem = {
      id: p.id,
      qty: sel.qty,
      variant: sel.variant,
      variantLabel: p.variants?.[sel.variant],
      title: p.title,
      price: p.price,
      photo: p.photos[0],
    };
    setDraft(prefill([item], "buy"));
    setQuoteState({ status: "idle" });
    dispatch({ type: "BUY" });
  };

  const checkoutCart = () => {
    const items: CheckoutItem[] = cart
      .filter((c) => byId.get(c._id)?.inStock !== false)
      .map((c) => {
        const p = byId.get(c._id);
        return {
          id: c._id,
          qty: c.quantity || 1,
          variant: 0,
          title: p?.title || c.title || "Product",
          price: p?.price ?? storePrice(c),
          photo: p?.photos[0] || storePhoto(c),
        };
      });
    if (!items.length) return showToast("Your cart is empty");
    setDraft(prefill(items, "cart"));
    setQuoteState({ status: "idle" });
    setShop(null);
    setSheet("full");
    dispatch({ type: "CHECKOUT_CART", productId: items[0].id });
  };

  const addToCart = (id: string, qty = 1) => {
    const p = byId.get(id);
    if (!p) return;
    if (!p.inStock) return showToast(`${p.title} is ${p.stock.toLowerCase()}`);
    const existing = cart.find((c) => c._id === id);
    if (existing)
      store({
        type: "UPDATE_QUANTITY",
        payload: {
          productId: id,
          quantity: Math.min(10, (existing.quantity || 1) + qty),
        },
      });
    else store({ type: "ADD_TO_CART", payload: toStoreItem(p, qty) });
    showToast("Added to cart");
    chat.cheer(1300);
  };

  const toggleFav = (id: string) => {
    const on = favs.some((f) => f._id === id);
    const p = byId.get(id);
    if (on) store({ type: "REMOVE_FROM_FAV", payload: id });
    else if (p) store({ type: "ADD_TO_FAV", payload: toStoreItem(p) });
    showToast(on ? "Removed from favourites" : "Saved to favourites");
    if (!on) chat.cheer(1100);
  };

  const sendMessage = (text: string) => {
    const productId =
      open && flow.productId && flow.state === "product"
        ? flow.productId
        : null;
    const ok = chat.send(text, productId);
    if (!ok) return false;
    if (flowRef.current.state === "welcome") dispatch({ type: "SEND" });
    if (sheetLayout && open) setPeekFrom(chat.messages.length);
    return true;
  };

  const newChat = () => {
    if (isPaymentLocked(flowRef.current)) return;
    chat.clear();
    seenRef.current = new Set();
    setCompare([]);
    setSelections({});
    setPeekFrom(null);
    setDockOpen(false);
    dispatch({ type: "RESET" });
    greet();
  };

  const onLogo = () => {
    if (isPaymentLocked(flowRef.current)) return;
    dispatch({ type: "RESET" });
    greet();
  };

  const restoreChat = (id: string) => {
    if (isPaymentLocked(flowRef.current)) return;
    chat.restore(id);
    seenRef.current = new Set();
    setDockOpen(false);
    // A restored conversation is a sent conversation: move off the welcome screen.
    if (flowRef.current.state === "welcome") dispatch({ type: "SEND" });
  };

  const openSavedChat = async (id: string) => {
    if (isPaymentLocked(flowRef.current)) return;
    setDockOpen(false);
    if (!(await chat.openSaved(id)))
      return showToast("Couldn't open that chat. Try again.");
    seenRef.current = new Set();
    setCompare([]);
    if (flowRef.current.state === "welcome") dispatch({ type: "SEND" });
  };

  // Shipping address in the shape POST /payments requires (state is mandatory there).
  const paymentAddress = (d: CheckoutDraft) => ({
    name: d.name.trim(),
    phone: d.phone,
    street: d.address.street.trim(),
    city: d.address.city.trim(),
    state: (d.address.state || "").trim(),
    postalCode: d.address.postalCode,
  });

  // Click handler for Pay / Retry. The live path pays the server-side checkout
  // session from the quote (POST /payments); PhonePe's popup opens synchronously
  // inside startCheckoutPayment, before any await, so it isn't blocked.
  const pay = (kind: "PAY" | "RETRY") => {
    if (!draft || !canDispatch(flowRef.current, kind)) return;
    if (!commerceLive) {
      setPayment({ ...emptyPayment, live: false });
      dispatch({ type: kind });
      return;
    }
    if (quoteState.status !== "ready" || quoteState.demo) return;
    const d = draft;
    const address = paymentAddress(d);
    // A session is consumed once a payment is created, so a retry quotes again.
    let sessionId = kind === "PAY" ? quoteSessionId(quoteState.data) : null;
    const key = nanoid();
    const started = startCheckoutPayment(
      async () => {
        if (!sessionId) {
          const fresh = await quote(d.items, d.coupon, token);
          setQuoteState({ status: "ready", demo: false, data: fresh });
          sessionId = quoteSessionId(fresh);
        }
        if (!sessionId)
          throw new CheckoutPaymentError(
            "Couldn't price this order. Please try again.",
          );
        return {
          checkoutSessionId: sessionId,
          shippingAddress: address,
          billingAddress: address,
        };
      },
      token,
      key,
    );
    dispatch({ type: kind });
    setPayment({ ...emptyPayment, live: true, key });
    started.then(
      ({ attemptId, orderId, url, popup }) =>
        setPayment((p) =>
          p.key === key ? { ...p, attemptId, orderId, url, popup } : p,
        ),
      (e: CheckoutPaymentError) => {
        const reason = e?.sessionExpired
          ? "Your checkout timed out, so the price needs to be checked again. Press Retry to continue."
          : e?.message || "Couldn't start PhonePe.";
        setPayment((p) => (p.key === key ? { ...p, reason } : p));
        dispatch({ type: "FAILED" });
      },
    );
  };

  // Only called with a payment-status response that reported "paid".
  const onVerified = (attempt: ServerOrder | null) => {
    const ids = { orderId: payment.orderId, userId: userData?.user?._id };
    setPayment((p) => ({
      ...p,
      serverOrder: {
        ...(attempt || {}),
        totalAmount: attempt?.amount,
        shippingAddress: draft ? paymentAddress(draft) : undefined,
        installation: draft
          ? { day: draft.slotDay, slot: draft.slotTime }
          : undefined,
      },
    }));
    // Fetch the created order for its order number and items (best effort).
    findOrder(ids.orderId, ids.userId, token).then((order) => {
      if (order)
        setPayment((p) => ({
          ...p,
          serverOrder: { ...p.serverOrder, ...order },
        }));
    });
    dispatch({ type: "VERIFIED" });
    draft?.items.forEach((i) =>
      store({ type: "REMOVE_FROM_CART", payload: i.id }),
    );
    chat.post(
      "Payment verified by Aquakart and your order is confirmed. Ask me anything about installation.",
    );
  };

  const onFailed = (reason: string) => {
    setPayment((p) => ({ ...p, reason }));
    dispatch({ type: "FAILED" });
  };

  const onDemoPreview = () => {
    setPayment({
      ...emptyPayment,
      live: false,
      demoId: "DEMO-" + nanoid(4).toUpperCase(),
    });
    dispatch({ type: "DEMO_PREVIEW" });
    chat.post(
      "That was a demo walkthrough, so no payment was taken and no order was placed. On the live site this screen only appears after our server verifies your PhonePe payment.",
    );
  };

  // ---------- divider ----------
  const mainRef = useRef<HTMLElement>(null);
  const onDividerDown = (e: RPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onDividerMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!dragging || !mainRef.current) return;
    const r = mainRef.current.getBoundingClientRect();
    setSplit(clampSplit(((e.clientX - r.left - 12) / (r.width - 24)) * 100));
  };
  const onDividerUp = () => {
    if (!dragging) return;
    setDragging(false);
    storage.set("aqua.split", String(Math.round(split)));
  };

  // ---------- purchases: invoices on the signed-in account, for the history dock ----------
  // Loaded on sign-in, refreshed whenever the dock opens and after an order is
  // confirmed (so a new invoice shows up). The list stays on screen while it refreshes.
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const orderConfirmed = flow.state === "confirmed";
  useEffect(() => {
    if (!token) return void setPurchases(null);
    let alive = true;
    getMyInvoices(token)
      .then((list: Purchase[]) => alive && setPurchases(list))
      .catch(() => alive && setPurchases((prev) => prev ?? []));
    return () => {
      alive = false;
    };
  }, [token, dockOpen, orderConfirmed]);

  // ---------- AI tour: once, on a first visit's start screen; replay from the dock ----------
  const [tourOpen, setTourOpen] = useState(false);
  const welcomeIdle =
    flow.state === "welcome" && !chat.messages.length && !chat.resuming;
  useEffect(() => {
    if (!welcomeIdle || storage.get(TOUR_KEY)) return;
    const t = setTimeout(() => setTourOpen(true), 1200);
    return () => clearTimeout(t);
  }, [welcomeIdle]);
  const closeTour = useCallback((finished: boolean) => {
    setTourOpen(false);
    storage.set(TOUR_KEY, finished ? "done" : "skipped");
  }, []);

  // ---------- droplet mood: derived, never stored ----------
  const mood: Mood =
    flow.state === "confirmed"
      ? "success"
      : flow.state === "payment_failed"
        ? "error"
        : flow.state === "payment_pending" || chat.status === "thinking"
          ? "thinking"
          : chat.status === "streaming"
            ? "speaking"
            : chat.happy
              ? "happy"
              : focused
                ? "listening"
                : flow.state === "welcome" && greeting
                  ? "greeting"
                  : "idle";

  const statusText =
    flow.state === "payment_pending"
      ? "Waiting for PhonePe…"
      : chat.status === "thinking"
        ? "Looking through the catalogue…"
        : chat.status === "streaming"
          ? "Replying…"
          : focused
            ? "Listening…"
            : `${chat.aiMode === "offline" ? "AI offline · basic answers" : "Online"} · ${
                catalogue.live ? "live catalogue" : "demo catalogue"
              }`;

  // Mobile preview strip: Aqua's latest reply after a send while the sheet is open.
  const lastMsg = chat.messages[chat.messages.length - 1];
  const peekText =
    sheetLayout &&
    open &&
    peekFrom !== null &&
    chat.messages.length > peekFrom + 1 &&
    lastMsg?.role === "aqua" &&
    lastMsg.done
      ? lastMsg.text
      : "";

  const selectedProduct = flow.productId
    ? byId.get(flow.productId) || null
    : null;
  const hideComposer = sheetLayout && locked;
  const mainPadB = isMobile ? 8 : 12;

  const panel = open ? (
    <WorkspacePanel
      flow={flow}
      dispatch={dispatch}
      product={selectedProduct}
      selection={getSel(flow.productId)}
      onSelection={(patch) => flow.productId && setSel(flow.productId, patch)}
      reason={flow.productId ? chat.reasons[flow.productId] : undefined}
      isFav={!!flow.productId && favs.some((f) => f._id === flow.productId)}
      inCart={!!flow.productId && cart.some((c) => c._id === flow.productId)}
      inCompare={!!flow.productId && compare.includes(flow.productId)}
      onAddToCart={(id, qty) => addToCart(id, qty)}
      onToggleFav={toggleFav}
      onToggleCompare={toggleCompare}
      onBuy={buy}
      onAsk={(text) => sendMessage(text)}
      draft={draft}
      setDraft={setDraft}
      savedAddresses={userData?.user?.addresses || []}
      quoteState={quoteState}
      setQuoteState={setQuoteState}
      commerceLive={commerceLive}
      catalogueLive={catalogue.live}
      signedIn={!!token}
      token={token}
      onPay={() => pay("PAY")}
      onRetry={() => pay("RETRY")}
      payment={payment}
      onVerified={onVerified}
      onFailed={onFailed}
      onDemoPreview={onDemoPreview}
      onNewChat={newChat}
      mood={mood}
      dark={theme === "dark"}
      isMobile={isMobile}
    />
  ) : null;

  return (
    <div
      className="aq-root"
      data-aq-mode={theme}
      data-aq-theme={dayTheme}
      data-flow={flow.state}
    >
      <ThemeLayer />
      <AquaHeader
        flow={flow}
        mood={mood}
        dark={theme === "dark"}
        statusText={statusText}
        catalogueLabel={
          catalogue.loading
            ? "Loading catalogue…"
            : catalogue.live
              ? ""
              : "Demo catalogue"
        }
        isMobile={isMobile}
        locked={locked}
        cartCount={cart.length}
        favCount={favs.length}
        historyCount={
          viewed.length + chat.sessions.length + chat.savedChats.length
        }
        dockOpen={dockOpen}
        onToggleDock={() => setDockOpen((v) => !v)}
        onLogo={onLogo}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onOpenShop={(tab) => setShop((s) => (s === tab ? null : tab))}
        onNewChat={newChat}
        userName={userName}
        authBusy={auth.busy}
        onSignIn={auth.signIn}
        thinking={showThinking}
        onToggleThinking={chat.aiMode === "live" ? toggleThinking : undefined}
      />

      <main
        ref={mainRef}
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
          position: "relative",
          zIndex: 21,
          padding: `0 12px ${mainPadB}px`,
        }}
      >
        <section
          aria-label="Conversation"
          style={{
            flex: "1 1 0",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <Conversation
            flow={flow}
            dispatch={dispatch}
            chat={chat}
            products={byId}
            mood={mood}
            dark={theme === "dark"}
            userName={userName}
            isMobile={isMobile}
            panelOpen={open}
            selectedProduct={selectedProduct}
            favIds={favs.map((f) => f._id)}
            cartIds={cart.map((c) => c._id)}
            compare={compare}
            onOpen={view}
            onToggleFav={toggleFav}
            onToggleCompare={toggleCompare}
            onClearCompare={clearCompare}
            onAddToCart={(id) => addToCart(id)}
            onBuy={buy}
            onSend={sendMessage}
            onSignIn={auth.signIn}
            signingIn={auth.busy}
            signInError={auth.error}
            onFocusChange={setFocused}
            hideComposer={hideComposer}
            composerRef={composerRef}
            peekText={peekText}
            onPeekOpen={() => {
              setSheet("peek");
              setPeekFrom(null);
            }}
            onPeekDismiss={() => setPeekFrom(null)}
          />
        </section>

        {!sheetLayout && open && (
          <div
            className="aq-divider"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panels"
            aria-valuemin={aquaConfig.splitMin}
            aria-valuemax={aquaConfig.splitMax}
            aria-valuenow={Math.round(split)}
            tabIndex={0}
            data-dragging={dragging}
            onPointerDown={onDividerDown}
            onPointerMove={onDividerMove}
            onPointerUp={onDividerUp}
            onPointerCancel={onDividerUp}
            onDoubleClick={() => {
              setSplit(aquaConfig.splitDefault);
              storage.set("aqua.split", String(aquaConfig.splitDefault));
            }}
            onKeyDown={(e) => {
              const d =
                e.key === "ArrowLeft" ? -2 : e.key === "ArrowRight" ? 2 : 0;
              if (!d) return;
              e.preventDefault();
              const next = clampSplit(split + d);
              setSplit(next);
              storage.set("aqua.split", String(Math.round(next)));
            }}
          >
            <span />
          </div>
        )}

        {!sheetLayout && (
          <aside
            aria-label="Workspace"
            aria-hidden={!open}
            className={open ? "aq-glass" : undefined}
            style={{
              // Pixel floors on both sides: on an iPad in portrait 40/60 would squeeze
              // the panel under its 340px content and clip it.
              width: open
                ? `clamp(360px, ${100 - split}%, calc(100% - 320px))`
                : 0,
              opacity: open ? 1 : 0,
              flexShrink: 0,
              overflow: "hidden",
              borderRadius: 28,
              position: "relative",
              transition: dragging
                ? "none"
                : "width 320ms ease, opacity 220ms ease",
            }}
          >
            {panel}
          </aside>
        )}
      </main>

      <HistoryDock
        open={dockOpen}
        locked={locked}
        sessions={chat.sessions.filter(
          (s) =>
            !s.sessionId || !chat.savedChats.some((c) => c.id === s.sessionId),
        )}
        savedChats={chat.savedChats}
        onOpenSaved={openSavedChat}
        purchases={purchases}
        viewed={viewed
          .map((id) => byId.get(id))
          .filter((p): p is Product => !!p)}
        onClose={() => setDockOpen(false)}
        onNewChat={newChat}
        onRestore={restoreChat}
        onStartTour={() => {
          setDockOpen(false);
          setTourOpen(true);
        }}
        onDeleteSaved={chat.deleteSaved}
        onDeleteSession={chat.deleteSession}
        onView={view}
        userName={userName}
        authBusy={auth.busy}
        authError={auth.error}
        onSignIn={auth.signIn}
        onSignOut={auth.signOut}
        thinking={showThinking}
        onToggleThinking={chat.aiMode === "live" ? toggleThinking : undefined}
        canView={canDispatch(flow, "VIEW")}
      />

      {/* Dims the chat behind a full sheet; the composer below stays usable.
          Tapping it tucks the sheet down to peek. */}
      {sheetLayout && open && sheet === "full" && (
        <div
          aria-hidden="true"
          onClick={() => setSheet("peek")}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: hideComposer ? 0 : composerH + mainPadB,
            zIndex: 29,
            background: "rgba(7,26,37,.28)",
            animation: "aqIn .25s ease both",
          }}
        />
      )}
      {sheetLayout && open && (
        <aside
          ref={sheetRef}
          aria-label="Workspace"
          className="aq-glass aq-sheet"
          data-dragging={dragH !== null}
          style={{
            position: "absolute",
            // Phones: edge to edge on the composer. Tablets: a centred card no
            // wider than 760px, floating just above the composer.
            left: isMobile ? 0 : "max(12px, calc((100% - 760px) / 2))",
            right: isMobile ? 0 : "max(12px, calc((100% - 760px) / 2))",
            bottom:
              (hideComposer ? 0 : composerH + mainPadB) + (isMobile ? 0 : 8),
            height:
              dragH !== null
                ? dragH
                : sheet === "full"
                  ? `calc(88dvh - ${(hideComposer ? 0 : composerH + mainPadB) + (isMobile ? 0 : 8)}px)`
                  : "34dvh",
            borderRadius: isMobile ? "24px 24px 0 0" : 24,
            zIndex: 30,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transition:
              dragH !== null
                ? "none"
                : "height 360ms cubic-bezier(.22,.8,.24,1), bottom 320ms ease",
            animation: reducedMotion ? undefined : "aqSheetIn 320ms ease both",
          }}
        >
          <button
            type="button"
            className="aq-sheet-handle"
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={() => {
              dragRef.current = null;
              setDragH(null);
            }}
            onClick={() => {
              // Pointer taps are handled on pointer-up; this is for keyboards.
              if (skipClickRef.current)
                return void (skipClickRef.current = false);
              setSheet((s) => (s === "full" ? "peek" : "full"));
            }}
            aria-label={
              sheet === "full"
                ? "Collapse panel (or drag)"
                : "Expand panel (or drag)"
            }
            aria-expanded={sheet === "full"}
          >
            <span />
          </button>
          <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
            {panel}
          </div>
        </aside>
      )}

      {shop && (
        <ShopPopover
          tab={shop}
          onTab={setShop}
          onClose={() => setShop(null)}
          cart={cart.map((c) => ({
            id: c._id,
            title: byId.get(c._id)?.title || c.title || "Product",
            price: byId.get(c._id)?.price ?? storePrice(c),
            photo: byId.get(c._id)?.photos[0] || storePhoto(c),
            qty: c.quantity || 1,
          }))}
          favs={favs.map((f) => ({
            id: f._id,
            title: byId.get(f._id)?.title || f.title || "Product",
            price: byId.get(f._id)?.price ?? storePrice(f),
            photo: byId.get(f._id)?.photos[0] || storePhoto(f),
            qty: 1,
          }))}
          canCheckout={canDispatch(flow, "CHECKOUT_CART")}
          canView={canDispatch(flow, "VIEW") && !locked}
          onQty={(id, qty) =>
            store({
              type: "UPDATE_QUANTITY",
              payload: {
                productId: id,
                quantity: Math.max(1, Math.min(10, qty)),
              },
            })
          }
          onRemoveCart={(id) =>
            store({ type: "REMOVE_FROM_CART", payload: id })
          }
          onRemoveFav={(id) => store({ type: "REMOVE_FROM_FAV", payload: id })}
          onAddToCart={(id) => addToCart(id)}
          onView={(id) => {
            setShop(null);
            if (byId.has(id)) view(id);
          }}
          onCheckout={checkoutCart}
        />
      )}

      {toast && (
        <div
          aria-live="polite"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 110,
            zIndex: 60,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              background: "rgba(7,26,37,.88)",
              backdropFilter: "blur(22px)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "0 14px 30px rgba(7,26,37,.25)",
              animation: "aqPop .25s ease both",
            }}
          >
            {toast}
          </div>
        </div>
      )}

      <AquaTour open={tourOpen} onClose={closeTour} />
    </div>
  );
}
