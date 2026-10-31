"use client";

import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import {
  Cake,
  Droplets,
  CalendarClock,
  Check,
  ChevronDown,
  ExternalLink,
  Heart,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Plus,
  ReceiptIndianRupee,
  ShieldCheck,
  ShoppingCart,
  Star,
  Trash2,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import AquaDatePicker from "@/components/reusables/datePicker";
import orderService from "@/services/order";
import UserServiceOperations from "@/services/user";
import { INR } from "./catalogue";
import { Avatar } from "./AquaHeader";
import ArrowScroller from "./ArrowScroller";
import { addressHardness, level, type HomeHardness } from "./hardnessData";
import type { Purchase } from "./HistoryDock";
import {
  installationLabel,
  nextInstallation,
  normalizeOrders,
  ORDER_STEPS,
  orderStage,
  orderTitle,
  paymentView,
  type OrderRowData,
} from "./orders";
import { supportLink, TONES } from "./PaymentParts";
import { purchaseLines } from "./purchaseItems";
import { ShopList, type ShopRow } from "./ShopPopover";
import type { Address, Product } from "./types";
import {
  addressLine,
  editAddresses,
  emptyAddress,
  profileDetails,
  profileForm,
  sameAddress,
  validateAddress,
  validateProfile,
  type ProfileForm,
  type ProfileUser,
} from "./profile";

export type ProfileTab =
  "profile" | "addresses" | "orders" | "purchases" | "cart" | "fav";
const TABS: ProfileTab[] = [
  "profile",
  "addresses",
  "orders",
  "purchases",
  "cart",
  "fav",
];
const LABELS: Record<ProfileTab, string> = {
  profile: "Profile",
  addresses: "Addresses",
  orders: "Orders",
  purchases: "Purchases",
  cart: "Cart",
  fav: "Favourites",
};
const BLURBS: Record<ProfileTab, string> = {
  profile:
    "Your account at a glance, and the details we deliver and invoice to.",
  addresses: "Checkout offers your default address first.",
  orders:
    "Everything you've ordered here, with delivery and installation dates.",
  purchases:
    "Invoices for what you've bought from Aquakart, online or in store.",
  cart: "Ready when you are.",
  fav: "Products you've saved for later.",
};
const ICONS: Record<ProfileTab, typeof ReceiptIndianRupee> = {
  profile: UserRound,
  addresses: MapPin,
  orders: Package,
  purchases: ReceiptIndianRupee,
  cart: ShoppingCart,
  fav: Heart,
};

type Props = {
  user: ProfileUser;
  token: string;
  purchases: Purchase[] | null;
  initialTab?: ProfileTab;
  locked: boolean;
  onClose: () => void;
  // The saved fields, already trimmed to what the dialog edits (for the Redux user).
  onSaved: (patch: Partial<ProfileUser>, message: string) => void;
  onSignOut: () => void;
  // Cart and Favourites tabs (the same rows and actions as the shop sheet).
  cart: ShopRow[];
  favs: ShopRow[];
  canView: boolean;
  canCheckout: boolean;
  onQty: (id: string, qty: number) => void;
  onRemoveCart: (id: string) => void;
  onRemoveFav: (id: string) => void;
  onAddToCart: (id: string) => void;
  // Opens a product (closes the dialog first).
  onView: (id: string) => void;
  onCheckout: () => void;
  onChat?: () => void;
  // Catalogue, to match a purchase's items to products in its quick view.
  products: Product[];
};

type UpdateService = {
  UserUpdateDetails: (
    id: string,
    data: { newDetails: Record<string, unknown> },
    token: string,
  ) => Promise<{ data?: Record<string, unknown> }>;
};
const users = UserServiceOperations as unknown as UpdateService;
const orders = orderService as unknown as {
  getOrdersByUserId: (id: string, token: string) => Promise<unknown>;
};

// The server answers with the whole user document; keep only what this dialog owns.
const pickSaved = (
  sent: Record<string, unknown>,
  res: Record<string, unknown> | undefined,
): Partial<ProfileUser> => {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(sent)) out[k] = res?.[k] ?? sent[k];
  return out as Partial<ProfileUser>;
};

const errorText = (e: unknown) => {
  const err = e as {
    authError?: boolean;
    message?: string;
    response?: { data?: { message?: string } };
  };
  if (err?.authError) return "Your session expired. Sign in again to save.";
  const m = err?.response?.data?.message || err?.message || "";
  return /duplicate|E11000|in use/i.test(m)
    ? "That mobile number is already on another Aquakart account."
    : "Couldn't save just now. Check your connection and try again.";
};

const shortDate = (d?: string) => {
  const t = d ? new Date(d) : null;
  return t && !Number.isNaN(t.getTime())
    ? t.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
};
const isPaid = (s?: string) =>
  /^(paid|completed|success)/i.test(String(s || "").trim());

// Days until the next birthday (0 = today), or null without a date.
const birthdayIn = (dob: string, now = new Date()) => {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), Number(m[1]) - 1, Number(m[2]));
  if (next < today)
    next = new Date(now.getFullYear() + 1, Number(m[1]) - 1, Number(m[2]));
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
};

// A labelled input whose hint / error is announced as its description, not
// folded into its name.
function Field({
  label,
  hint,
  bad = false,
  wide = false,
  children,
}: {
  label: string;
  hint?: string;
  bad?: boolean;
  wide?: boolean;
  children: (a: { id: string; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = useId();
  return (
    <div
      className="aq-field"
      style={wide ? { gridColumn: "1 / -1" } : undefined}
    >
      <label htmlFor={id}>{label}</label>
      {children({ id, "aria-describedby": hint ? `${id}-hint` : undefined })}
      {hint && (
        <span id={`${id}-hint`} className="aq-pf-hint" data-bad={bad}>
          {hint}
        </span>
      )}
    </div>
  );
}

export default function ProfileDialog(p: Props) {
  const [tab, setTab] = useState<ProfileTab>(p.initialTab || "profile");
  // Which way the last switch went: panels and the header slide in from it.
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const go = (next: ProfileTab) => {
    if (next === tab) return;
    setDir(TABS.indexOf(next) > TABS.indexOf(tab) ? "fwd" : "back");
    setTab(next);
  };
  const tabRefs = useRef<Record<ProfileTab, HTMLButtonElement | null>>({
    profile: null,
    addresses: null,
    orders: null,
    purchases: null,
    cart: null,
    fav: null,
  });
  const dialogRef = useRef<HTMLDivElement>(null);
  const userId = p.user._id || "";

  // ---------- profile form (prefilled; reset if the account changes) ----------
  const [form, setForm] = useState<ProfileForm>(() => profileForm(p.user));
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState<null | "profile" | "addresses">(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setForm(profileForm(p.user));
    setTouched(false);
    // Only a different account resets the form; saves update p.user too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  const errors = touched ? validateProfile(form) : {};
  const initial = profileForm(p.user);
  const dirty = (Object.keys(form) as (keyof ProfileForm)[]).some(
    (k) => form[k] !== initial[k],
  );

  const save = async (
    kind: "profile" | "addresses",
    newDetails: Record<string, unknown>,
    message: string,
    extra: Partial<ProfileUser> = {},
  ) => {
    if (!userId) return false;
    setBusy(kind);
    setError("");
    try {
      const res = await users.UserUpdateDetails(
        userId,
        { newDetails },
        p.token,
      );
      p.onSaved({ ...pickSaved(newDetails, res?.data), ...extra }, message);
      return true;
    } catch (e) {
      setError(errorText(e));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const saveProfile = async () => {
    setTouched(true);
    if (Object.keys(validateProfile(form)).length) return;
    // The header greets by `name` first, so it follows the edit too.
    await save("profile", profileDetails(form), "Profile saved", {
      name: [form.firstName.trim(), form.lastName.trim()]
        .filter(Boolean)
        .join(" "),
    });
  };

  // ---------- address book ----------
  const addresses = p.user.addresses || [];
  const current = p.user.selectedAddress || null;
  // null: not editing; -1: a new address; otherwise the index being edited.
  const [editing, setEditing] = useState<number | null>(null);
  const [addr, setAddr] = useState<Address>(emptyAddress);
  const [addrDefault, setAddrDefault] = useState(false);
  const [addrTouched, setAddrTouched] = useState(false);
  const addrMissing = addrTouched ? validateAddress(addr) : [];
  const startEdit = (i: number) => {
    setEditing(i);
    setAddr(i >= 0 ? { ...emptyAddress(), ...addresses[i] } : emptyAddress());
    setAddrDefault(i < 0 && !addresses.length);
    setAddrTouched(false);
    setError("");
  };
  const applyAddresses = async (
    change: Parameters<typeof editAddresses>[2],
    message: string,
  ) => {
    const next = editAddresses(addresses, current, change);
    return save(
      "addresses",
      { addresses: next.addresses, selectedAddress: next.selectedAddress },
      message,
    );
  };
  const saveAddress = async () => {
    setAddrTouched(true);
    if (validateAddress(addr).length || editing === null) return;
    const ok = await applyAddresses(
      {
        kind: "save",
        index: editing >= 0 ? editing : null,
        address: addr,
        makeDefault: addrDefault,
      },
      editing >= 0 ? "Address updated" : "Address added",
    );
    if (ok) setEditing(null);
  };

  // ---------- orders: loaded on open (the overview shows the next installation) ----------
  const [orderList, setOrderList] = useState<OrderRowData[] | null | "error">(
    null,
  );
  const [ordersTry, setOrdersTry] = useState(0);
  const ordersLoaded = Array.isArray(orderList);
  useEffect(() => {
    if (ordersLoaded || !userId) return;
    let alive = true;
    setOrderList(null);
    orders
      .getOrdersByUserId(userId, p.token)
      .then((res) => alive && setOrderList(normalizeOrders(res)))
      .catch(() => alive && setOrderList("error"));
    return () => {
      alive = false;
    };
    // p.token changes only with the account, which remounts the dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordersLoaded, userId, ordersTry]);

  // ---------- keyboard: Escape closes, Tab stays inside, arrows move between sections ----------
  useEffect(() => {
    const el = dialogRef.current;
    // No scroll: on phones the sheet is still sliding up from below the screen.
    el?.querySelector<HTMLElement>("[data-autofocus]")?.focus({
      preventScroll: true,
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        p.onClose();
        return;
      }
      if (e.key !== "Tab" || !el) return;
      const f = [
        ...el.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a[href], [tabindex="0"]',
        ),
      ].filter((x) => !x.closest("[inert]"));
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onTabKey = (e: ReactKeyboardEvent) => {
    const d = /^Arrow(Down|Right)$/.test(e.key)
      ? 1
      : /^Arrow(Up|Left)$/.test(e.key)
        ? -1
        : 0;
    if (!d) return;
    e.preventDefault();
    const i = TABS.indexOf(tab);
    const next = TABS[(i + d + TABS.length) % TABS.length];
    go(next);
    tabRefs.current[next]?.focus();
  };

  // ---------- the highlight that glides to the selected section ----------
  const navRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<CSSProperties | null>(null);
  useLayoutEffect(() => {
    const nav = navRef.current;
    const el = tabRefs.current[tab];
    if (!nav || !el) return;
    const place = () =>
      setPill({
        width: el.offsetWidth,
        height: el.offsetHeight,
        transform: `translate(${el.offsetLeft}px, ${el.offsetTop}px)`,
      });
    place();
    // Phones: the sections are a chip row; keep the chosen one in view.
    if (nav.scrollWidth > nav.clientWidth) {
      const left = el.offsetLeft - (nav.clientWidth - el.offsetWidth) / 2;
      nav.scrollTo?.({ left, behavior: "smooth" });
    }
    const ro =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place);
    ro?.observe(nav);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [tab]);

  const displayName =
    [form.firstName, form.lastName].filter(Boolean).join(" ") ||
    p.user.name ||
    "Your profile";
  const bday = birthdayIn(initial.dob);
  const loadedOrders = Array.isArray(orderList) ? orderList : [];
  const upcoming = nextInstallation(loadedOrders);
  // Estimated from the default address's area (or city), like the chat's card.
  const home = addressHardness(current || addresses[0]);
  const homeLevel = home ? level(home.ppm) : null;
  const counts: Record<ProfileTab, number | null> = {
    profile: null,
    addresses: addresses.length,
    orders: Array.isArray(orderList) ? orderList.length : null,
    purchases: p.purchases?.length ?? null,
    cart: p.cart.length,
    fav: p.favs.length,
  };
  const overview: {
    label: string;
    value: string;
    tab: ProfileTab;
    ink?: string;
  }[] = [
    {
      label: "Mobile",
      value: initial.phone ? `+91 ${initial.phone}` : "Not added yet",
      tab: "profile",
    },
    {
      label: "Default address",
      value: addressLine(current || addresses[0]) || "Not added yet",
      tab: "addresses",
    },
    {
      label: "Water at home",
      value:
        home && homeLevel
          ? `${homeLevel.label} · ~${home.ppm} ppm (${home.area ? home.area.name : `${home.city.name} average`})`
          : addresses.length
            ? "No estimate for this city yet"
            : "Add an address to see it",
      tab: "addresses",
      ink: homeLevel?.ink,
    },
    {
      label: "Next installation",
      value: upcoming
        ? installationLabel(upcoming.installation)
        : Array.isArray(orderList)
          ? "Nothing scheduled"
          : "Checking…",
      tab: "orders",
    },
    {
      label: "Orders",
      value: Array.isArray(orderList)
        ? `${orderList.length} placed`
        : orderList === "error"
          ? "Couldn't load"
          : "Checking…",
      tab: "orders",
    },
  ];

  return (
    <>
      <div className="aq-pf-scrim" aria-hidden="true" onClick={p.onClose} />
      <div className="aq-pf-layer">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="aq-pf-title"
          className="aq-glass aq-pf"
        >
          {/* ---------- left rail: who, sections, sign out ---------- */}
          <aside className="aq-pf-rail">
            <div className="aq-pf-me">
              <Avatar name={displayName} size={52} />
              <div className="aq-pf-me-text">
                <h2 id="aq-pf-title" className="aq-display aq-pf-name">
                  {displayName}
                </h2>
                <span className="aq-pf-sub">
                  {p.user.email || "Signed in with Google"}
                </span>
                {(p.user.roleName === "admin" ||
                  p.user.roleName === "tester") && (
                  <span
                    className="aq-pf-role"
                    data-role={p.user.roleName}
                    title="No daily limit on chats with Aqua"
                  >
                    <ShieldCheck size={12} aria-hidden="true" />
                    {p.user.roleName === "admin" ? "Admin" : "Tester"} ·
                    unlimited chats
                  </span>
                )}
                {bday !== null && bday <= 30 && (
                  <span className="aq-pf-bday">
                    <Cake size={12} aria-hidden="true" />
                    {bday === 0
                      ? "Happy birthday!"
                      : `Birthday in ${bday} days`}
                  </span>
                )}
              </div>
            </div>

            <div
              role="tablist"
              aria-label="Profile sections"
              aria-orientation="vertical"
              className="aq-pf-nav"
              ref={navRef}
              onKeyDown={onTabKey}
            >
              {/* Hidden until measured, so it doesn't fly in from the corner. */}
              <span
                className="aq-pf-navpill"
                aria-hidden="true"
                style={pill || { opacity: 0 }}
              />
              {TABS.map((t) => {
                const Icon = ICONS[t];
                return (
                  <button
                    key={t}
                    ref={(el) => {
                      tabRefs.current[t] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`aq-pf-tab-${t}`}
                    aria-controls={`aq-pf-panel-${t}`}
                    aria-selected={tab === t}
                    tabIndex={tab === t ? 0 : -1}
                    className="aq-pf-navtab"
                    onClick={() => go(t)}
                  >
                    <Icon size={17} aria-hidden="true" />
                    <span className="aq-pf-tab-label">{LABELS[t]}</span>
                    {counts[t] ? (
                      <span className="aq-dock-count">{counts[t]}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="aq-pf-foot">
              <span className="aq-pf-foot-who">
                <span>Signed in as</span>
                <b>{p.user.email || displayName}</b>
              </span>
              <button
                type="button"
                className="aq-pf-signout"
                onClick={p.onSignOut}
                disabled={p.locked}
                title={
                  p.locked ? "Finish or wait for the payment first" : undefined
                }
              >
                <LogOut size={15} aria-hidden="true" /> Sign out
              </button>
            </div>
          </aside>

          {/* ---------- right: the selected section ---------- */}
          <section
            className="aq-pf-main"
            aria-labelledby={`aq-pf-tab-${tab}`}
            data-dir={dir}
          >
            <header className="aq-pf-main-head">
              {/* Keyed: the title and blurb swap in with the panel. */}
              <div key={tab} className="aq-pf-head-swap">
                <h3 className="aq-display aq-pf-main-title">{LABELS[tab]}</h3>
                <p className="aq-pf-main-sub">{BLURBS[tab]}</p>
              </div>
              <button
                type="button"
                className="aq-icon-btn"
                onClick={p.onClose}
                aria-label="Close profile"
              >
                <X size={16} />
              </button>
            </header>

            {error && (
              <div role="alert" className="aq-pf-error">
                {error}
              </div>
            )}

            <ArrowScroller
              wrapClassName="aq-pf-scroll"
              className="aq-pf-body"
              label={LABELS[tab].toLowerCase()}
              resetKey={tab}
            >
              {/* ---------- profile ---------- */}
              <div
                role="tabpanel"
                className="aq-pf-panel"
                id="aq-pf-panel-profile"
                aria-labelledby="aq-pf-tab-profile"
                hidden={tab !== "profile"}
              >
                <div className="aq-pf-overview">
                  {overview.map((o) =>
                    o.tab === "profile" ? (
                      <div key={o.label} className="aq-pf-stat">
                        <span>{o.label}</span>
                        <b style={o.ink ? { color: o.ink } : undefined}>
                          {o.value}
                        </b>
                      </div>
                    ) : (
                      <button
                        key={o.label}
                        type="button"
                        className="aq-pf-stat"
                        onClick={() => go(o.tab)}
                      >
                        <span>{o.label}</span>
                        <b style={o.ink ? { color: o.ink } : undefined}>
                          {o.value}
                        </b>
                      </button>
                    ),
                  )}
                </div>
                <h4 className="aq-pf-section">Personal details</h4>
                <form
                  className="aq-pf-grid"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveProfile();
                  }}
                >
                  <Field label="First name" hint={errors.firstName} bad>
                    {(a) => (
                      <input
                        {...a}
                        data-autofocus
                        className="aq-input"
                        value={form.firstName}
                        onChange={(e) =>
                          setForm({ ...form, firstName: e.target.value })
                        }
                        autoComplete="given-name"
                        aria-invalid={!!errors.firstName}
                      />
                    )}
                  </Field>
                  <Field label="Last name">
                    {(a) => (
                      <input
                        {...a}
                        className="aq-input"
                        value={form.lastName}
                        onChange={(e) =>
                          setForm({ ...form, lastName: e.target.value })
                        }
                        autoComplete="family-name"
                      />
                    )}
                  </Field>
                  <Field label="Mobile number" hint={errors.phone} bad>
                    {(a) => (
                      <input
                        {...a}
                        className="aq-input"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            phone: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10),
                          })
                        }
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="10 digits"
                        aria-invalid={!!errors.phone}
                      />
                    )}
                  </Field>
                  <Field
                    label="Birthday"
                    hint={errors.dob || "Optional"}
                    bad={!!errors.dob}
                  >
                    {(a) => (
                      // Same glass picker as the rest of the site: opens on a
                      // year grid, then month, then day; 1900 → today.
                      <AquaDatePicker
                        {...a}
                        name="dob"
                        birthday
                        value={form.dob}
                        placeholder="Add your birthday"
                        onChange={(e: { target: { value: string } }) =>
                          setForm({ ...form, dob: e.target.value })
                        }
                        aria-invalid={!!errors.dob}
                      />
                    )}
                  </Field>
                  <Field
                    label="Email"
                    hint="From your Google sign-in. Invoices are sent here."
                    wide
                  >
                    {(a) => (
                      <input
                        {...a}
                        className="aq-input"
                        value={p.user.email || ""}
                        disabled
                        readOnly
                      />
                    )}
                  </Field>
                  <div
                    className="aq-pf-actions"
                    style={{ gridColumn: "1 / -1" }}
                  >
                    <span style={{ flex: 1 }} />
                    <button
                      type="submit"
                      className="aq-btn aq-btn-primary"
                      disabled={!dirty || busy !== null}
                    >
                      {busy === "profile" ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </form>
              </div>

              {/* ---------- addresses ---------- */}
              <div
                role="tabpanel"
                className="aq-pf-panel"
                id="aq-pf-panel-addresses"
                aria-labelledby="aq-pf-tab-addresses"
                hidden={tab !== "addresses"}
              >
                <div className="aq-pf-list">
                  {addresses.map((a, i) =>
                    editing === i ? null : (
                      <div key={a._id || i} className="aq-pf-addr">
                        <MapPin
                          size={16}
                          aria-hidden="true"
                          className="aq-pf-addr-icon"
                        />
                        <span className="aq-pf-addr-text">
                          <span
                            style={{ fontWeight: 700, color: "var(--aq-ink)" }}
                          >
                            {a.city || `Address ${i + 1}`}
                            {sameAddress(a, current) && (
                              <span className="aq-pf-tag">Default</span>
                            )}
                          </span>
                          <span>{addressLine(a)}</span>
                          <HardnessChip h={addressHardness(a)} />
                        </span>
                        {!sameAddress(a, current) && (
                          <button
                            type="button"
                            className="aq-icon-btn"
                            aria-label={`Use ${addressLine(a)} by default`}
                            title="Make default"
                            disabled={busy !== null}
                            onClick={() =>
                              void applyAddresses(
                                { kind: "default", index: i },
                                "Default address updated",
                              )
                            }
                          >
                            <Star size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="aq-icon-btn"
                          aria-label={`Edit ${addressLine(a)}`}
                          title="Edit"
                          disabled={busy !== null}
                          onClick={() => startEdit(i)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="aq-icon-btn"
                          aria-label={`Remove ${addressLine(a)}`}
                          title="Remove"
                          disabled={busy !== null}
                          onClick={() =>
                            void applyAddresses(
                              { kind: "remove", index: i },
                              "Address removed",
                            )
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ),
                  )}

                  {editing !== null ? (
                    <form
                      className="aq-card aq-pf-grid"
                      style={{ padding: 14 }}
                      onSubmit={(e) => {
                        e.preventDefault();
                        void saveAddress();
                      }}
                    >
                      <label
                        className="aq-field"
                        style={{ gridColumn: "1 / -1" }}
                      >
                        House, street, area
                        <input
                          className="aq-input"
                          value={addr.street}
                          onChange={(e) =>
                            setAddr({ ...addr, street: e.target.value })
                          }
                          autoComplete="street-address"
                          autoFocus
                        />
                      </label>
                      <label className="aq-field">
                        City
                        <input
                          className="aq-input"
                          value={addr.city}
                          onChange={(e) =>
                            setAddr({ ...addr, city: e.target.value })
                          }
                          autoComplete="address-level2"
                        />
                      </label>
                      <label className="aq-field">
                        State
                        <input
                          className="aq-input"
                          value={addr.state || ""}
                          onChange={(e) =>
                            setAddr({ ...addr, state: e.target.value })
                          }
                          autoComplete="address-level1"
                        />
                      </label>
                      <label className="aq-field">
                        PIN code
                        <input
                          className="aq-input"
                          value={addr.postalCode}
                          onChange={(e) =>
                            setAddr({
                              ...addr,
                              postalCode: e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6),
                            })
                          }
                          inputMode="numeric"
                          autoComplete="postal-code"
                        />
                      </label>
                      {editing < 0 && addresses.length > 0 && (
                        <label className="aq-pf-check">
                          <input
                            type="checkbox"
                            checked={addrDefault}
                            onChange={(e) => setAddrDefault(e.target.checked)}
                          />
                          Use as my default address
                        </label>
                      )}
                      {addrMissing.length > 0 && (
                        <span
                          className="aq-pf-hint"
                          data-bad="true"
                          style={{ gridColumn: "1 / -1" }}
                        >
                          Add {addrMissing.join(", ")}.
                        </span>
                      )}
                      <div
                        className="aq-pf-actions"
                        style={{ gridColumn: "1 / -1" }}
                      >
                        <span style={{ flex: 1 }} />
                        <button
                          type="button"
                          className="aq-btn aq-btn-ghost"
                          onClick={() => setEditing(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="aq-btn aq-btn-primary"
                          disabled={busy !== null}
                        >
                          <Check size={15} />
                          {busy === "addresses" ? "Saving…" : "Save address"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="aq-option aq-pf-add"
                      onClick={() => startEdit(-1)}
                    >
                      <Plus size={16} aria-hidden="true" />
                      <span style={{ fontWeight: 700 }}>Add an address</span>
                      <span style={{ fontSize: 12, color: "var(--aq-mut)" }}>
                        Checkout offers your default address first.
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* ---------- orders ---------- */}
              <div
                role="tabpanel"
                className="aq-pf-panel"
                id="aq-pf-panel-orders"
                aria-labelledby="aq-pf-tab-orders"
                hidden={tab !== "orders"}
              >
                {orderList === null ? (
                  <div
                    className="aq-pf-list"
                    role="status"
                    aria-label="Loading your orders"
                  >
                    {[0, 1, 2].map((n) => (
                      <span key={n} className="aq-dock-skeleton" />
                    ))}
                  </div>
                ) : orderList === "error" ? (
                  <div className="aq-pf-empty" role="alert">
                    <Package size={20} aria-hidden="true" />
                    <b>Couldn&apos;t load your orders</b>
                    <span>Check your connection and try again.</span>
                    <button
                      type="button"
                      className="aq-btn aq-btn-glass"
                      onClick={() => {
                        setOrderList(null);
                        setOrdersTry((n) => n + 1);
                      }}
                    >
                      Try again
                    </button>
                  </div>
                ) : orderList.length ? (
                  <div className="aq-pf-list">
                    {orderList.map((o) => (
                      <OrderRow
                        key={o.id}
                        order={o}
                        products={p.products}
                        canView={p.canView}
                        onView={p.onView}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="aq-pf-empty">
                    <Package size={20} aria-hidden="true" />
                    <b>No orders yet</b>
                    <span>
                      Orders you place here, paid online or cash on delivery,
                      show up with their payment status.
                    </span>
                  </div>
                )}
              </div>

              {/* ---------- purchases ---------- */}
              <div
                role="tabpanel"
                className="aq-pf-panel"
                id="aq-pf-panel-purchases"
                aria-labelledby="aq-pf-tab-purchases"
                hidden={tab !== "purchases"}
              >
                {p.purchases === null ? (
                  <div
                    className="aq-pf-list"
                    role="status"
                    aria-label="Loading your purchases"
                  >
                    {[0, 1, 2].map((n) => (
                      <span key={n} className="aq-dock-skeleton" />
                    ))}
                  </div>
                ) : p.purchases.length ? (
                  <div className="aq-pf-list">
                    {p.purchases.map((inv) => (
                      <PurchaseRow
                        key={inv.id}
                        inv={inv}
                        products={p.products}
                        canView={p.canView}
                        onView={p.onView}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="aq-pf-empty">
                    <ReceiptIndianRupee size={20} aria-hidden="true" />
                    <b>No purchases yet</b>
                    <span>
                      Invoices for products you buy from Aquakart, online or in
                      store, show up here.
                    </span>
                  </div>
                )}
              </div>

              {/* ---------- cart & favourites ---------- */}
              {(["cart", "fav"] as const).map((k) => (
                <div
                  key={k}
                  role="tabpanel"
                  className="aq-pf-panel"
                  id={`aq-pf-panel-${k}`}
                  aria-labelledby={`aq-pf-tab-${k}`}
                  hidden={tab !== k}
                >
                  <ShopList
                    kind={k}
                    inline
                    rows={k === "cart" ? p.cart : p.favs}
                    canView={p.canView}
                    canCheckout={p.canCheckout}
                    onQty={p.onQty}
                    onRemove={k === "cart" ? p.onRemoveCart : p.onRemoveFav}
                    onAddToCart={p.onAddToCart}
                    onView={p.onView}
                    onCheckout={p.onCheckout}
                    onChat={p.onChat}
                  />
                </div>
              ))}
            </ArrowScroller>
          </section>
        </div>
      </div>
    </>
  );
}

// Where this address sits on the hardness scale. An estimate for its area
// (or city), never a test of the water at that address.
function HardnessChip({ h }: { h: HomeHardness | null }) {
  if (!h) return null;
  const lv = level(h.ppm);
  return (
    <span
      className="aq-pf-hard"
      style={{ background: lv.tint, color: lv.ink }}
      title="Estimated for the area, not a test of your water"
    >
      <Droplets size={12} aria-hidden="true" />
      {lv.label} water · ~{h.ppm} ppm
      <span className="aq-pf-hard-where">
        {h.area ? `est. for ${h.area.name}` : `${h.city.name} average`}
      </span>
    </span>
  );
}

// One purchase: the summary row toggles a quick view of what's in it, each item
// matched to the catalogue (photo, open the product), with the full invoice a
// tap away. Lists what the API sends (the first few names, or full lines).
function PurchaseRow({
  inv,
  products,
  canView,
  onView,
}: {
  inv: Purchase;
  products: Product[];
  canView: boolean;
  onView: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const first = inv.items[0]?.replace(/\s*\|\s*aquakart\s*$/i, "");
  const title = first
    ? `${first}${inv.itemCount > 1 ? ` + ${inv.itemCount - 1} more` : ""}`
    : `Invoice ${inv.invoiceNo}`;
  const paid = isPaid(inv.paidStatus);
  const { lines, more } = purchaseLines(inv, products);
  return (
    <div className="aq-pf-buy-wrap" data-open={open}>
      <button
        type="button"
        className="aq-pf-buy"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="aq-pf-buy-icon" aria-hidden="true">
          <ReceiptIndianRupee size={16} />
        </span>
        <span className="aq-pf-addr-text">
          <span style={{ fontWeight: 700, color: "var(--aq-ink)" }}>
            {title}
          </span>
          <span>
            Invoice {inv.invoiceNo}
            {inv.date ? ` · ${shortDate(inv.date)}` : ""}
          </span>
        </span>
        <span className="aq-pf-buy-side">
          <span style={{ fontWeight: 800, color: "var(--aq-ink)" }}>
            {INR(inv.total_price)}
          </span>
          {inv.paidStatus && inv.paidStatus !== "Not available" && (
            <span className="aq-dock-status" data-paid={paid}>
              {paid ? "Paid" : inv.paidStatus}
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="aq-pf-buy-chev"
          data-open={open}
        />
      </button>
      <div id={bodyId} className="aq-pf-quick" hidden={!open}>
        {lines.map((l, i) => {
          const prod = l.product;
          const meta = [
            l.qty ? `Qty ${l.qty}` : null,
            l.price ? INR(l.price) : null,
            !l.price && prod ? `Now ${INR(prod.price)}` : null,
          ].filter(Boolean);
          return (
            <div key={`${l.name}-${i}`} className="aq-pf-quick-row">
              {prod?.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element -- catalogue images on Cloudinary
                <img src={prod.photos[0]} alt="" loading="lazy" />
              ) : (
                <span className="aq-pf-quick-ph" aria-hidden="true">
                  <Package size={16} />
                </span>
              )}
              <span className="aq-pf-quick-text">
                <b>{l.name}</b>
                <span>{meta.join(" · ") || "Service or accessory"}</span>
              </span>
              {prod && (
                <button
                  type="button"
                  className="aq-chip aq-chip-soft"
                  onClick={() => onView(prod.id)}
                  disabled={!canView}
                  aria-label={`View ${l.name}`}
                >
                  View
                </button>
              )}
            </div>
          );
        })}
        {more > 0 && (
          <span className="aq-pf-quick-more">
            + {more} more {more === 1 ? "item" : "items"} on the invoice
          </span>
        )}
        {/* A new tab keeps this chat where it is; the invoice page checks the
            Google sign-in before showing anything. */}
        {inv.canView !== false && (
          <a
            className="aq-hard-link aq-pf-quick-link"
            href={`/invoice/${encodeURIComponent(inv.id)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open full invoice <ExternalLink size={12} aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  );
}

// One order from checkout. The summary (first item, number and date, total,
// payment) toggles the details; delivery and installation dates stay in view
// on the card, since they're what a shopper opens this tab for.
function OrderRow({
  order,
  products,
  canView,
  onView,
}: {
  order: OrderRowData;
  products: Product[];
  canView: boolean;
  onView: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const pay = paymentView(order);
  const stage = orderStage(order);
  const byId = new Map(products.map((x) => [x.id, x]));
  const address = order.address
    ? addressLine(order.address as unknown as Address)
    : "";
  const delivery =
    stage === -1
      ? "Cancelled"
      : order.deliveredOn
        ? `Delivered ${shortDate(order.deliveredOn)}`
        : order.estimatedDelivery
          ? `Expected by ${shortDate(order.estimatedDelivery)}`
          : "We'll share the date soon";
  const install =
    stage === -1
      ? "Not needed"
      : installationLabel(order.installation) || "We'll call to schedule it";
  const breakdown = [
    order.discount
      ? [
          `Discount${order.coupon ? ` (${order.coupon})` : ""}`,
          `− ${INR(order.discount)}`,
        ]
      : null,
    order.delivery != null
      ? ["Delivery", order.delivery ? INR(order.delivery) : "Free"]
      : null,
    order.tax ? ["Tax", INR(order.tax)] : null,
  ].filter(Boolean) as [string, string][];
  const help = supportLink(
    `Hi Aquakart, about my order ${order.number}${
      order.total != null ? ` (${INR(order.total)})` : ""
    }: ${pay.label.toLowerCase()}. Can you help?`,
  );
  return (
    <div className="aq-pf-buy-wrap aq-pf-order" data-open={open}>
      <button
        type="button"
        className="aq-pf-buy"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="aq-pf-buy-icon" aria-hidden="true">
          <Package size={16} />
        </span>
        <span className="aq-pf-addr-text">
          <span style={{ fontWeight: 700, color: "var(--aq-ink)" }}>
            {orderTitle(order)}
          </span>
          <span>
            {order.number}
            {order.date ? ` · Placed ${shortDate(order.date)}` : ""}
          </span>
        </span>
        <span className="aq-pf-buy-side">
          {order.total != null && (
            <span style={{ fontWeight: 800, color: "var(--aq-ink)" }}>
              {INR(order.total)}
            </span>
          )}
          <span
            className="aq-pf-orderpay"
            style={{
              background: TONES[pay.tone].bg,
              color: TONES[pay.tone].fg,
            }}
          >
            {pay.label}
          </span>
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="aq-pf-buy-chev"
          data-open={open}
        />
      </button>

      <dl className="aq-pf-dates">
        <div>
          <dt>
            <Truck size={14} aria-hidden="true" /> Delivery
          </dt>
          <dd>{delivery}</dd>
        </div>
        <div>
          <dt>
            <CalendarClock size={14} aria-hidden="true" /> Installation
          </dt>
          <dd data-pending={!order.installation}>{install}</dd>
        </div>
      </dl>

      <div id={bodyId} className="aq-pf-quick" hidden={!open}>
        {stage === -1 ? (
          <span className="aq-pf-cancelled">This order was cancelled.</span>
        ) : (
          <ol className="aq-pf-steps" aria-label="Order progress">
            {ORDER_STEPS.map((label, i) => (
              <li
                key={label}
                data-done={i <= stage}
                aria-current={i === stage ? "step" : undefined}
              >
                <span aria-hidden="true">
                  {i <= stage ? <Check size={11} /> : null}
                </span>
                {label}
              </li>
            ))}
          </ol>
        )}
        {order.lines.map((l, i) => {
          const prod = l.productId ? byId.get(l.productId) : undefined;
          const meta = [
            `Qty ${l.qty}`,
            l.price != null ? INR(l.price) : null,
          ].filter(Boolean);
          return (
            <div key={`${l.name}-${i}`} className="aq-pf-quick-row">
              {prod?.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element -- catalogue images on Cloudinary
                <img src={prod.photos[0]} alt="" loading="lazy" />
              ) : (
                <span className="aq-pf-quick-ph" aria-hidden="true">
                  <Package size={16} />
                </span>
              )}
              <span className="aq-pf-quick-text">
                <b>{l.name}</b>
                <span>{meta.join(" · ")}</span>
              </span>
              {prod && (
                <button
                  type="button"
                  className="aq-chip aq-chip-soft"
                  onClick={() => onView(prod.id)}
                  disabled={!canView}
                  aria-label={`View ${l.name}`}
                >
                  View
                </button>
              )}
            </div>
          );
        })}
        <dl className="aq-pf-orderinfo">
          <dt>Payment</dt>
          <dd>
            {order.cod ? "Cash on delivery" : "PhonePe"} · {pay.label}
          </dd>
          {order.orderStatus && (
            <>
              <dt>Order status</dt>
              <dd>{order.orderStatus}</dd>
            </>
          )}
          {address && (
            <>
              <dt>Deliver to</dt>
              <dd>{address}</dd>
            </>
          )}
          {breakdown.map(([k, v]) => (
            <Fragment key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </Fragment>
          ))}
          {order.total != null && (
            <>
              <dt>Total</dt>
              <dd style={{ fontWeight: 800, color: "var(--aq-ink)" }}>
                {INR(order.total)}
              </dd>
            </>
          )}
        </dl>
        <a
          className="aq-hard-link aq-pf-quick-link"
          href={help}
          target="_blank"
          rel="noopener noreferrer"
        >
          {pay.tone === "bad"
            ? "Payment didn't go through? Get help on WhatsApp"
            : "Questions about this order or its installation? Ask us on WhatsApp"}{" "}
          <ExternalLink size={12} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
