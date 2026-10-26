"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import {
  Cake,
  Check,
  ExternalLink,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  Receipt,
  Star,
  Trash2,
  X,
} from "lucide-react";
import UserServiceOperations from "@/services/user";
import { INR } from "./catalogue";
import { Avatar } from "./AquaHeader";
import ArrowScroller from "./ArrowScroller";
import type { Purchase } from "./HistoryDock";
import type { Address } from "./types";
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

export type ProfileTab = "profile" | "addresses" | "purchases";
const TABS: ProfileTab[] = ["profile", "addresses", "purchases"];
const LABELS: Record<ProfileTab, string> = {
  profile: "Profile",
  addresses: "Addresses",
  purchases: "Purchases",
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
};

type UpdateService = {
  UserUpdateDetails: (
    id: string,
    data: { newDetails: Record<string, unknown> },
    token: string,
  ) => Promise<{ data?: Record<string, unknown> }>;
};
const users = UserServiceOperations as unknown as UpdateService;

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
  const tabRefs = useRef<Record<ProfileTab, HTMLButtonElement | null>>({
    profile: null,
    addresses: null,
    purchases: null,
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

  // ---------- keyboard: Escape closes, Tab stays inside, arrows move tabs ----------
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
  const tabIndex = TABS.indexOf(tab);
  const onTabKey = (e: ReactKeyboardEvent) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = TABS[(tabIndex + d + TABS.length) % TABS.length];
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  const displayName =
    [form.firstName, form.lastName].filter(Boolean).join(" ") ||
    p.user.name ||
    "Your profile";
  const bday = birthdayIn(initial.dob);
  const counts: Record<ProfileTab, number | null> = {
    profile: null,
    addresses: addresses.length,
    purchases: p.purchases?.length ?? null,
  };

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
          <div className="aq-pf-head">
            <Avatar name={displayName} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 id="aq-pf-title" className="aq-display aq-pf-name">
                {displayName}
              </h2>
              <span className="aq-pf-sub">
                {p.user.email || "Signed in with Google"}
                {bday !== null && bday <= 30 && (
                  <span className="aq-pf-bday">
                    <Cake size={12} aria-hidden="true" />
                    {bday === 0
                      ? "Happy birthday!"
                      : `Birthday in ${bday} days`}
                  </span>
                )}
              </span>
            </div>
            <button
              type="button"
              className="aq-icon-btn"
              onClick={p.onClose}
              aria-label="Close profile"
            >
              <X size={16} />
            </button>
          </div>

          <div
            role="tablist"
            aria-label="Profile sections"
            className="aq-dock-tabs"
            style={
              {
                "--tabs": 3,
                "--ti": tabIndex,
                margin: "0 16px",
              } as CSSProperties
            }
            onKeyDown={onTabKey}
          >
            <span className="aq-dock-tab-pill" aria-hidden="true" />
            {TABS.map((t) => (
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
                className="aq-dock-tab"
                onClick={() => setTab(t)}
              >
                {LABELS[t]}
                {counts[t] ? (
                  <span className="aq-dock-count">{counts[t]}</span>
                ) : null}
              </button>
            ))}
          </div>

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
              id="aq-pf-panel-profile"
              aria-labelledby="aq-pf-tab-profile"
              hidden={tab !== "profile"}
            >
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
                          phone: e.target.value.replace(/\D/g, "").slice(0, 10),
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
                    <input
                      {...a}
                      className="aq-input"
                      type="date"
                      value={form.dob}
                      max={new Date().toISOString().slice(0, 10)}
                      min="1900-01-01"
                      onChange={(e) =>
                        setForm({ ...form, dob: e.target.value })
                      }
                      autoComplete="bday"
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
                <div className="aq-pf-actions" style={{ gridColumn: "1 / -1" }}>
                  <button
                    type="button"
                    className="aq-btn aq-btn-ghost"
                    onClick={p.onSignOut}
                    disabled={p.locked}
                  >
                    <LogOut size={15} /> Sign out
                  </button>
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

            {/* ---------- purchases ---------- */}
            <div
              role="tabpanel"
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
                  {p.purchases.map((inv) => {
                    const title = inv.items.length
                      ? `${inv.items[0]}${inv.itemCount > 1 ? ` + ${inv.itemCount - 1} more` : ""}`
                      : `Invoice ${inv.invoiceNo}`;
                    const paid = isPaid(inv.paidStatus);
                    return (
                      // A new tab keeps this chat where it is; the invoice page
                      // checks the Google sign-in before showing anything.
                      <a
                        key={inv.id}
                        className="aq-pf-buy"
                        href={`/invoice/${encodeURIComponent(inv.id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="aq-pf-buy-icon" aria-hidden="true">
                          <Receipt size={16} />
                        </span>
                        <span className="aq-pf-addr-text">
                          <span
                            style={{ fontWeight: 700, color: "var(--aq-ink)" }}
                          >
                            {title}
                          </span>
                          <span>
                            Invoice {inv.invoiceNo}
                            {inv.date ? ` · ${shortDate(inv.date)}` : ""}
                          </span>
                        </span>
                        <span className="aq-pf-buy-side">
                          <span
                            style={{ fontWeight: 800, color: "var(--aq-ink)" }}
                          >
                            {INR(inv.total_price)}
                          </span>
                          {inv.paidStatus &&
                            inv.paidStatus !== "Not available" && (
                              <span className="aq-dock-status" data-paid={paid}>
                                {paid ? "Paid" : inv.paidStatus}
                              </span>
                            )}
                        </span>
                        <ExternalLink
                          size={13}
                          aria-hidden="true"
                          style={{ color: "var(--aq-mut)" }}
                        />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="aq-pf-empty">
                  <Receipt size={20} aria-hidden="true" />
                  <b>No purchases yet</b>
                  <span>
                    Invoices for products you buy from Aquakart, online or in
                    store, show up here.
                  </span>
                </div>
              )}
            </div>
          </ArrowScroller>
        </div>
      </div>
    </>
  );
}
