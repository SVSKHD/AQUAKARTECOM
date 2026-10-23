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
import { startPhonePe, type ServerOrder } from "@/utils/aquaCommerce";
import { aquaConfig, pickDayTheme } from "./config";
import { useAquaAuth } from "./useAquaAuth";
import { DEMO_PRODUCTS, loadCatalogue, toStoreItem } from "./catalogue";
import { storage, useIsMobile, useReducedMotion } from "./hooks";
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
  const toggleCompare = (id: string) =>
    setCompare((c) =>
      c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-3),
    );

  // ---------- chat (lives outside the flow machine) ----------
  const chat = useAquaChat({
    products,
    getCompare,
    clearCompare,
    reducedMotion,
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

  // Products opened in this conversation (history dock + first-view follow-up).
  const [viewed, setViewed] = useState<string[]>([]);

  // ---------- mobile sheet ----------
  const [sheet, setSheet] = useState<"full" | "peek">("full");
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
    const first = !viewed.includes(id);
    dispatch({ type: "VIEW", productId: id });
    setSheet("full");
    setDockOpen(false);
    if (first) {
      setViewed((v) => [id, ...v]);
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
    if (isMobile && open) setPeekFrom(chat.messages.length);
    return true;
  };

  const newChat = () => {
    if (isPaymentLocked(flowRef.current)) return;
    chat.clear();
    setViewed([]);
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
    setDockOpen(false);
    // A restored conversation is a sent conversation: move off the welcome screen.
    if (flowRef.current.state === "welcome") dispatch({ type: "SEND" });
  };

  const buildOrder = (txn: string, orderId: string) => {
    const d = draft!;
    const q = quoteState.status === "ready" ? quoteState.data : {};
    const addr = { ...d.address };
    return {
      user: userData?.user?._id,
      customerName: d.name.trim(),
      email: d.email.trim(),
      phone: d.phone,
      number: d.phone,
      transactionId: txn,
      orderType: "Payment Method(Phone Pe Gateway)",
      orderId,
      items: d.items.map((i) => ({
        productId: i.id,
        name: i.title,
        price: i.price,
        quantity: i.qty,
        ...(i.variantLabel ? { variant: i.variantLabel } : {}),
      })),
      totalAmount: Number(q.payableAmount),
      discountAmount: Number(q.discount ?? 0),
      paymentMethod: "OTHER THAN CASH ON DELIVERY",
      paymentStatus: "Pending",
      currency: "INR",
      billingAddress: addr,
      shippingAddress: addr,
      shippingMethod: "Standard",
      shippingCost: Number(q.deliveryCharge ?? 50),
      estimatedDelivery: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      orderStatus: "Processing",
      installation: { day: d.slotDay, slot: d.slotTime },
      ...(d.coupon ? { couponCode: d.coupon } : {}),
      ...(q.id || q._id ? { checkoutSessionId: q.id || q._id } : {}),
    };
  };

  // Click handler for Pay / Retry. In the live path PhonePe's popup is opened
  // synchronously inside startPhonePe, before any await, so it isn't blocked.
  const pay = (kind: "PAY" | "RETRY") => {
    if (!draft || !canDispatch(flowRef.current, kind)) return;
    if (!commerceLive) {
      setPayment({ ...emptyPayment, live: false });
      dispatch({ type: kind });
      return;
    }
    if (quoteState.status !== "ready" || quoteState.demo) return;
    const day = dayjs().format("DDMMYYYY");
    const txn = `AQTR-PGPP${nanoid(5).toUpperCase()}D${day}`;
    const orderId = `AQOD${day}${nanoid(2).toUpperCase()}`;
    const started = startPhonePe(buildOrder(txn, orderId), token);
    dispatch({ type: kind });
    setPayment({ ...emptyPayment, live: true, txn, orderId });
    started.then(
      ({ url, popup }) =>
        setPayment((p) => (p.txn === txn ? { ...p, url, popup } : p)),
      (e: Error) => {
        setPayment((p) =>
          p.txn === txn
            ? { ...p, reason: e?.message || "Couldn't start PhonePe." }
            : p,
        );
        dispatch({ type: "FAILED" });
      },
    );
  };

  // Only called with an order-status response that reported "paid".
  const onVerified = (order: ServerOrder | null) => {
    setPayment((p) => ({ ...p, serverOrder: order }));
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
            : catalogue.live
              ? "Online · live catalogue"
              : "Online · demo catalogue";

  // Mobile preview strip: Aqua's latest reply after a send while the sheet is open.
  const lastMsg = chat.messages[chat.messages.length - 1];
  const peekText =
    isMobile &&
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
  const hideComposer = isMobile && locked;
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
        historyCount={viewed.length + chat.sessions.length}
        dockOpen={dockOpen}
        onToggleDock={() => setDockOpen((v) => !v)}
        onLogo={onLogo}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onOpenShop={(tab) => setShop((s) => (s === tab ? null : tab))}
        onNewChat={newChat}
        userName={userName}
        authBusy={auth.busy}
        onSignIn={auth.signIn}
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

        {!isMobile && open && (
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

        {!isMobile && (
          <aside
            aria-label="Workspace"
            aria-hidden={!open}
            className={open ? "aq-glass" : undefined}
            style={{
              width: open ? `${100 - split}%` : 0,
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
        sessions={chat.sessions}
        viewed={viewed
          .map((id) => byId.get(id))
          .filter((p): p is Product => !!p)}
        onClose={() => setDockOpen(false)}
        onNewChat={newChat}
        onRestore={restoreChat}
        onView={view}
        userName={userName}
        authBusy={auth.busy}
        authError={auth.error}
        onSignIn={auth.signIn}
        onSignOut={auth.signOut}
        canView={canDispatch(flow, "VIEW")}
      />

      {isMobile && open && (
        <aside
          aria-label="Workspace"
          className="aq-glass"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: hideComposer ? 0 : composerH + mainPadB,
            height:
              sheet === "full"
                ? `calc(88dvh - ${hideComposer ? 0 : composerH + mainPadB}px)`
                : "34dvh",
            borderRadius: "24px 24px 0 0",
            zIndex: 30,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transition: "height 320ms ease, bottom 320ms ease",
            animation: reducedMotion ? undefined : "aqSheetIn 320ms ease both",
          }}
        >
          <button
            type="button"
            onClick={() => setSheet((s) => (s === "full" ? "peek" : "full"))}
            aria-label={sheet === "full" ? "Collapse panel" : "Expand panel"}
            aria-expanded={sheet === "full"}
            style={{
              height: 44,
              border: 0,
              background: "transparent",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 44,
                height: 5,
                borderRadius: 4,
                background: "rgba(var(--aq-ln),.22)",
              }}
            />
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
    </div>
  );
}
