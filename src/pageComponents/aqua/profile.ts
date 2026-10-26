// Profile dialog helpers: prefill from the signed-in user, validate, and build
// the `newDetails` body for POST /user/update-details/:id.
import type { Address } from "./types";

export type ProfileUser = {
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | number;
  dob?: string;
  photoURL?: string;
  addresses?: Address[];
  selectedAddress?: Address;
};

export type ProfileForm = {
  firstName: string;
  lastName: string;
  phone: string;
  dob: string; // YYYY-MM-DD, or "" when not given
};

// "2026-03-04T00:00:00.000Z" (or a Date-parsable string) → "2026-03-04".
export const toDateInput = (v?: string | null) => {
  if (!v) return "";
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v));
  if (m) return m[1];
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

export function profileForm(u: ProfileUser | null | undefined): ProfileForm {
  // Google accounts often carry only `name`: split it when the parts are missing.
  const parts = String(u?.name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return {
    firstName: (u?.firstName || parts[0] || "").trim(),
    lastName: (
      u?.lastName || (u?.firstName ? "" : parts.slice(1).join(" "))
    ).trim(),
    phone: String(u?.phone ?? "")
      .replace(/\D/g, "")
      .slice(-10),
    dob: toDateInput(u?.dob),
  };
}

export function validateProfile(f: ProfileForm, today = new Date()) {
  const errors: Partial<Record<keyof ProfileForm, string>> = {};
  if (!f.firstName.trim()) errors.firstName = "Add your first name";
  if (f.phone && !/^[6-9]\d{9}$/.test(f.phone))
    errors.phone = "Use a 10-digit mobile number";
  if (f.dob) {
    const d = new Date(`${f.dob}T00:00:00Z`);
    const year = Number(f.dob.slice(0, 4));
    if (Number.isNaN(d.getTime()) || year < 1900)
      errors.dob = "Pick a real date";
    else if (f.dob > today.toISOString().slice(0, 10))
      errors.dob = "Your birthday can't be in the future";
  }
  return errors;
}

// Only what the form edits; untouched fields are left out of the update.
export function profileDetails(f: ProfileForm) {
  const out: Record<string, unknown> = {
    firstName: f.firstName.trim(),
    lastName: f.lastName.trim(),
  };
  if (f.phone) out.phone = Number(f.phone);
  if (f.dob) out.dob = f.dob;
  return out;
}

// ---------- addresses ----------
export const emptyAddress = (): Address => ({
  street: "",
  city: "",
  state: "",
  postalCode: "",
});

export const sameAddress = (a?: Address | null, b?: Address | null) =>
  !!a &&
  !!b &&
  (a._id && b._id
    ? a._id === b._id
    : [a.street, a.city, a.state, a.postalCode].join("|").toLowerCase() ===
      [b.street, b.city, b.state, b.postalCode].join("|").toLowerCase());

export function validateAddress(a: Address) {
  const missing: string[] = [];
  if (!a.street.trim()) missing.push("house and street");
  if (!a.city.trim()) missing.push("city");
  if (!(a.state || "").trim()) missing.push("state");
  if (!/^\d{6}$/.test(a.postalCode)) missing.push("a 6-digit PIN code");
  return missing;
}

const clean = (a: Address): Address => ({
  ...(a._id ? { _id: a._id } : {}),
  street: a.street.trim(),
  city: a.city.trim(),
  state: (a.state || "").trim(),
  postalCode: a.postalCode.trim(),
});

// The address book after one change, plus which one is the default (the one
// checkout picks first). Removing the default moves it to the first left.
export function editAddresses(
  list: Address[],
  current: Address | null | undefined,
  change:
    | {
        kind: "save";
        index: number | null;
        address: Address;
        makeDefault?: boolean;
      }
    | { kind: "remove"; index: number }
    | { kind: "default"; index: number },
): { addresses: Address[]; selectedAddress: Address | null } {
  const addresses = list.map(clean);
  let selected =
    addresses.find((x) => sameAddress(x, current)) || addresses[0] || null;
  if (change.kind === "save") {
    const next = clean(change.address);
    const wasDefault =
      change.index !== null && sameAddress(addresses[change.index], selected);
    if (change.index === null) addresses.push(next);
    else addresses[change.index] = next;
    if (change.makeDefault || wasDefault || !selected) selected = next;
  } else if (change.kind === "remove") {
    const [gone] = addresses.splice(change.index, 1);
    if (sameAddress(gone, selected)) selected = addresses[0] || null;
  } else {
    selected = addresses[change.index] || selected;
  }
  return { addresses, selectedAddress: selected };
}

export const addressLine = (a?: Address | null) =>
  a ? [a.street, a.city, a.state, a.postalCode].filter(Boolean).join(", ") : "";
