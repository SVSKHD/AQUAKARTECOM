"use client";

import { useEffect, useId, useState } from "react";
import {
  AlertTriangle,
  Check,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  addressLine,
  cleanAddress,
  deliveryIssues,
  deliveryReason,
  emptyAddress,
  hasAddress,
  sameAddress,
  toAddress,
  toAddresses,
  validateAddress,
} from "./profile";
import type { Address } from "./types";

type Props = {
  address: Address;
  savedAddressId: string | null;
  saved: Address[];
  // The account's default (checkout picks it first; tagged "Default").
  defaultAddress?: Address | null;
  signedIn: boolean;
  // Use this address for the order (savedId when it's in the address book).
  onPick: (address: Address, savedId: string | null) => void;
  // Guests type straight into the order's address.
  onChange: (patch: Partial<Address>) => void;
  // Saves a new address to the account; resolves with the stored copy.
  onSave?: (address: Address) => Promise<Address>;
  // Edit or delete a saved address (by its place in `saved`).
  onEdit?: (index: number, address: Address) => Promise<Address>;
  onRemove?: (index: number) => Promise<Address[]>;
  // The new-address form is open (checkout waits for it to be confirmed).
  onAddingChange: (adding: boolean) => void;
};

const filled = hasAddress;
const trimmed = (a: Address): Address => {
  const c = cleanAddress(a);
  return {
    street: c.street,
    city: c.city,
    state: c.state,
    postalCode: c.postalCode,
  };
};

function AddressFields({
  value,
  onChange,
  autoFocus = false,
}: {
  value: Address;
  onChange: (patch: Partial<Address>) => void;
  autoFocus?: boolean;
}) {
  return (
    <>
      <label className="aq-field">
        House, street, area
        <input
          className="aq-input"
          value={value.street}
          onChange={(e) => onChange({ street: e.target.value })}
          autoComplete="street-address"
          autoFocus={autoFocus}
        />
      </label>
      <div className="aq-addr-row">
        <label className="aq-field">
          City
          <input
            className="aq-input"
            value={value.city}
            onChange={(e) => onChange({ city: e.target.value })}
            autoComplete="address-level2"
          />
        </label>
        <label className="aq-field">
          State
          <input
            className="aq-input"
            value={value.state || ""}
            onChange={(e) => onChange({ state: e.target.value })}
            autoComplete="address-level1"
          />
        </label>
        <label className="aq-field">
          PIN code
          <input
            className="aq-input"
            value={value.postalCode}
            onChange={(e) =>
              onChange({
                postalCode: e.target.value.replace(/\D/g, "").slice(0, 6),
              })
            }
            inputMode="numeric"
            autoComplete="postal-code"
          />
        </label>
      </div>
    </>
  );
}

// Why the order can't go to this address, shown under it (nothing when it can).
function Issue({ issues }: { issues: string[] }) {
  if (!issues.length) return null;
  return (
    <span className="aq-addr-issue">
      <AlertTriangle size={13} aria-hidden="true" />
      {deliveryReason(issues)}
    </span>
  );
}

// Checkout's delivery address. Signed in: pick one of the saved addresses
// (a radio list with the default tagged), edit or delete one, or add a new one
// on the spot and save it to the account. Guests type the address in directly.
// An address the order can't be delivered to says why, and opens to be fixed.
export default function CheckoutAddress({
  address: rawAddress,
  savedAddressId,
  saved: rawSaved,
  defaultAddress: rawDefault,
  signedIn,
  onPick,
  onChange,
  onSave,
  onEdit,
  onRemove,
  onAddingChange,
}: Props) {
  // Account data can hold partial addresses: normalise before any `.trim()`.
  const address = toAddress(rawAddress);
  const saved = toAddresses(rawSaved);
  const defaultAddress = rawDefault ? toAddress(rawDefault) : null;
  const legendId = useId();
  const [adding, setAdding] = useState(
    () => signedIn && saved.length === 0 && !filled(address),
  );
  const [form, setForm] = useState<Address>(emptyAddress);
  const [keep, setKeep] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  // What the form edits: a saved address (its index), this order's one-off
  // address ("draft"), or nothing (adding a new one).
  const [editing, setEditing] = useState<number | "draft" | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [rowBusy, setRowBusy] = useState(false);
  const [rowError, setRowError] = useState("");
  useEffect(() => onAddingChange(adding), [adding, onAddingChange]);

  if (!signedIn)
    return (
      <>
        <AddressFields value={address} onChange={onChange} />
        {/* Once the PIN is typed in full, say what still stops delivery. */}
        {address.postalCode.length === 6 && (
          <Issue issues={deliveryIssues(address)} />
        )}
        <span className="aq-addr-note">
          Sign in to save addresses for next time.
        </span>
      </>
    );

  const selected = (a: Address) =>
    !adding &&
    (savedAddressId && a._id
      ? a._id === savedAddressId
      : sameAddress(a, address));
  const oneOff = filled(address) && !saved.some((a) => sameAddress(a, address));
  const missing = touched ? validateAddress(form) : [];

  const openForm = (start: Address, edit: number | "draft" | null) => {
    setForm(trimmed(start));
    setKeep(true);
    setError("");
    setRowError("");
    setDeleting(null);
    // Editing an existing address shows what still needs fixing straight away.
    setTouched(edit !== null);
    setEditing(edit);
    setAdding(true);
  };
  const startAdding = () => openForm(emptyAddress(), null);
  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };
  const pickOnce = () => {
    onPick(trimmed(form), null);
    closeForm();
  };
  const confirm = async () => {
    setTouched(true);
    if (validateAddress(form).length) return;
    if (editing === "draft") return pickOnce();
    const index = typeof editing === "number" ? editing : null;
    if (index === null && (!keep || !onSave)) return pickOnce();
    if (index !== null && !onEdit) return pickOnce();
    setBusy(true);
    setError("");
    try {
      const stored =
        index !== null && onEdit
          ? await onEdit(index, trimmed(form))
          : await onSave!(trimmed(form));
      onPick(stored, stored._id ?? null);
      closeForm();
    } catch (e) {
      setError(
        (e as Error)?.message ||
          "Couldn't save the address just now. Check your connection.",
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = async (i: number) => {
    if (!onRemove) return;
    const gone = saved[i];
    const wasSelected = selected(gone) || sameAddress(gone, address);
    setRowBusy(true);
    setRowError("");
    try {
      const left = toAddresses(await onRemove(i));
      setDeleting(null);
      if (editing === i) closeForm();
      // The order was going to this address: move it to the first one left.
      if (wasSelected) {
        const next = left[0];
        onPick(next ? { ...next } : emptyAddress(), next?._id ?? null);
        if (!next) openForm(emptyAddress(), null);
      }
    } catch (e) {
      setRowError(
        (e as Error)?.message || "Couldn't delete the address just now.",
      );
    } finally {
      setRowBusy(false);
    }
  };

  const formIssues = touched ? deliveryIssues(form) : [];
  const editingSaved = typeof editing === "number";

  return (
    <fieldset className="aq-addr" aria-labelledby={legendId}>
      <span id={legendId} className="aq-addr-ask">
        {saved.length
          ? "Select a delivery address"
          : "Add the address we deliver and install at"}
      </span>

      {(saved.length > 0 || oneOff) && (
        <div
          role="radiogroup"
          aria-labelledby={legendId}
          className="aq-addr-list"
        >
          {saved.map((a, i) => {
            const on = selected(a);
            const isDefault = sameAddress(a, defaultAddress);
            const issues = deliveryIssues(a);
            const label = addressLine(a) || a.label || `address ${i + 1}`;
            return (
              <div
                key={a._id || addressLine(a) || i}
                className="aq-addr-item"
                data-undeliverable={issues.length > 0}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={!!on}
                  className="aq-option aq-addr-card"
                  onClick={() => {
                    onPick({ ...a }, a._id ?? null);
                    // Can't deliver here yet: open it to fix what's missing.
                    if (issues.length && onEdit) openForm(a, i);
                    else closeForm();
                  }}
                >
                  <span className="aq-addr-mark" aria-hidden="true">
                    {on ? (
                      <Check size={13} strokeWidth={3} />
                    ) : (
                      <MapPin size={13} />
                    )}
                  </span>
                  <span className="aq-addr-body">
                    <span className="aq-addr-title">
                      {a.label || a.city || `Address ${i + 1}`}
                      {isDefault && (
                        <span className="aq-addr-tag">Default</span>
                      )}
                    </span>
                    <span className="aq-addr-line">
                      {addressLine(a) || "No address details yet"}
                    </span>
                    <Issue issues={issues} />
                  </span>
                </button>

                {deleting === i ? (
                  <div className="aq-addr-confirm" role="alert">
                    <span>Delete this address from your account?</span>
                    <div className="aq-addr-tools">
                      <button
                        type="button"
                        className="aq-addr-tool"
                        disabled={rowBusy}
                        onClick={() => setDeleting(null)}
                      >
                        Keep it
                      </button>
                      <button
                        type="button"
                        className="aq-addr-tool"
                        data-danger="true"
                        disabled={rowBusy}
                        aria-busy={rowBusy}
                        onClick={() => void remove(i)}
                      >
                        <Trash2 size={13} aria-hidden="true" />
                        {rowBusy ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                    {rowError && (
                      <span className="aq-addr-error">{rowError}</span>
                    )}
                  </div>
                ) : (
                  (onEdit || onRemove) && (
                    <div className="aq-addr-corner">
                      {onEdit && (
                        <button
                          type="button"
                          className="aq-addr-icon"
                          aria-label={`Edit ${label}`}
                          title={issues.length ? "Fix address" : "Edit"}
                          onClick={() => {
                            onPick({ ...a }, a._id ?? null);
                            openForm(a, i);
                          }}
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                      )}
                      {onRemove && (
                        <button
                          type="button"
                          className="aq-addr-icon"
                          data-danger="true"
                          aria-label={`Delete ${label}`}
                          title="Delete"
                          onClick={() => {
                            setRowError("");
                            setDeleting(i);
                          }}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            );
          })}
          {oneOff && (
            <div
              className="aq-addr-item"
              data-undeliverable={deliveryIssues(address).length > 0}
            >
              <button
                type="button"
                role="radio"
                aria-checked={!adding}
                className="aq-option aq-addr-card"
                onClick={closeForm}
              >
                <span className="aq-addr-mark" aria-hidden="true">
                  {!adding ? (
                    <Check size={13} strokeWidth={3} />
                  ) : (
                    <MapPin size={13} />
                  )}
                </span>
                <span className="aq-addr-body">
                  <span className="aq-addr-title">
                    {address.city || "New address"}
                    <span className="aq-addr-tag">This order only</span>
                  </span>
                  <span className="aq-addr-line">{addressLine(address)}</span>
                  <Issue issues={deliveryIssues(address)} />
                </span>
              </button>
              {editing !== "draft" && (
                <div className="aq-addr-corner">
                  <button
                    type="button"
                    className="aq-addr-icon"
                    aria-label="Edit this order's address"
                    title="Edit"
                    onClick={() => openForm(address, "draft")}
                  >
                    <Pencil size={14} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {adding ? (
        <form
          className="aq-addr-form"
          onSubmit={(e) => {
            e.preventDefault();
            void confirm();
          }}
          aria-label={
            editing === null ? "New delivery address" : "Edit delivery address"
          }
        >
          {editing !== null && (
            <span className="aq-addr-ask">
              {editing === "draft"
                ? "Edit this order's address"
                : "Edit saved address"}
            </span>
          )}
          <AddressFields
            value={form}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            autoFocus={saved.length > 0}
          />
          {onSave && editing === null && (
            <label className="aq-pf-check">
              <input
                type="checkbox"
                checked={keep}
                onChange={(e) => setKeep(e.target.checked)}
              />
              Save to my addresses for next time
            </label>
          )}
          {missing.length > 0 && (
            <span className="aq-addr-error" role="alert">
              {editing === null
                ? `Add ${missing.join(", ")}.`
                : deliveryReason(formIssues)}
            </span>
          )}
          {error && (
            <span className="aq-addr-error" role="alert">
              {error} You can still use it for this order.
            </span>
          )}
          <div className="aq-addr-actions">
            {(saved.length > 0 || editing !== null) && (
              <button
                type="button"
                className="aq-btn aq-btn-ghost"
                disabled={busy}
                onClick={closeForm}
              >
                Cancel
              </button>
            )}
            {error && (
              <button
                type="button"
                className="aq-btn aq-btn-glass"
                disabled={busy}
                onClick={pickOnce}
              >
                Use for this order only
              </button>
            )}
            <button
              type="submit"
              className="aq-btn aq-btn-primary"
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? (
                <>
                  <span className="aq-loadbtn-spin" aria-hidden="true" />{" "}
                  Saving…
                </>
              ) : (
                <>
                  <Check size={15} />{" "}
                  {editingSaved && onEdit ? "Save and use" : "Use this address"}
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="aq-option aq-addr-add"
          onClick={startAdding}
        >
          <Plus size={16} aria-hidden="true" />
          <span>
            <b>Add a new address</b>
            <span className="aq-addr-line">
              {onSave
                ? "Saved to your account, used for this order"
                : "Used for this order"}
            </span>
          </span>
        </button>
      )}
    </fieldset>
  );
}
