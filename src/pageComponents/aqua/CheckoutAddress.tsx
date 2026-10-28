"use client";

import { useEffect, useId, useState } from "react";
import { Check, MapPin, Plus } from "lucide-react";
import {
  addressLine,
  emptyAddress,
  sameAddress,
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
  // The new-address form is open (checkout waits for it to be confirmed).
  onAddingChange: (adding: boolean) => void;
};

const filled = (a: Address) => !!(a.street.trim() || a.city.trim());
const trimmed = (a: Address): Address => ({
  street: a.street.trim(),
  city: a.city.trim(),
  state: (a.state || "").trim(),
  postalCode: a.postalCode.trim(),
});

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

// Checkout's delivery address. Signed in: pick one of the saved addresses
// (a radio list with the default tagged), or add a new one on the spot and
// save it to the account. Guests type the address in directly.
export default function CheckoutAddress({
  address,
  savedAddressId,
  saved,
  defaultAddress,
  signedIn,
  onPick,
  onChange,
  onSave,
  onAddingChange,
}: Props) {
  const legendId = useId();
  const [adding, setAdding] = useState(
    () => signedIn && saved.length === 0 && !filled(address),
  );
  const [form, setForm] = useState<Address>(emptyAddress);
  const [keep, setKeep] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  useEffect(() => onAddingChange(adding), [adding, onAddingChange]);

  if (!signedIn)
    return (
      <>
        <AddressFields value={address} onChange={onChange} />
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

  const startAdding = () => {
    setForm(emptyAddress());
    setKeep(true);
    setError("");
    setTouched(false);
    setAdding(true);
  };
  const useOnce = () => {
    onPick(trimmed(form), null);
    setAdding(false);
  };
  const confirm = async () => {
    setTouched(true);
    if (validateAddress(form).length) return;
    if (!keep || !onSave) return useOnce();
    setBusy(true);
    setError("");
    try {
      const stored = await onSave(trimmed(form));
      onPick(stored, stored._id ?? null);
      setAdding(false);
    } catch (e) {
      setError(
        (e as Error)?.message ||
          "Couldn't save the address just now. Check your connection.",
      );
    } finally {
      setBusy(false);
    }
  };

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
            return (
              <button
                key={a._id || addressLine(a)}
                type="button"
                role="radio"
                aria-checked={!!on}
                className="aq-option aq-addr-card"
                onClick={() => {
                  onPick({ ...a }, a._id ?? null);
                  setAdding(false);
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
                    {isDefault && <span className="aq-addr-tag">Default</span>}
                  </span>
                  <span className="aq-addr-line">{addressLine(a)}</span>
                </span>
              </button>
            );
          })}
          {oneOff && (
            <button
              type="button"
              role="radio"
              aria-checked={!adding}
              className="aq-option aq-addr-card"
              onClick={() => setAdding(false)}
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
              </span>
            </button>
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
          aria-label="New delivery address"
        >
          <AddressFields
            value={form}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            autoFocus={saved.length > 0}
          />
          {onSave && (
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
              Add {missing.join(", ")}.
            </span>
          )}
          {error && (
            <span className="aq-addr-error" role="alert">
              {error} You can still use it for this order.
            </span>
          )}
          <div className="aq-addr-actions">
            {saved.length > 0 && (
              <button
                type="button"
                className="aq-btn aq-btn-ghost"
                disabled={busy}
                onClick={() => setAdding(false)}
              >
                Cancel
              </button>
            )}
            {error && (
              <button
                type="button"
                className="aq-btn aq-btn-glass"
                disabled={busy}
                onClick={useOnce}
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
                  <Check size={15} /> Use this address
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
