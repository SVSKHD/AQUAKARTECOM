// Address hardening: prod crashed with "Cannot read properties of undefined
// (reading 'trim')" when a signed-in user touched the delivery address. The
// backend's address schema requires no field, so a stored address can miss
// street / city / state / postalCode, hold null, or carry a number. These tests
// throw every malformed shape we can think of at each address entry point;
// none of them may throw.
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/utils/aquaCommerce", () => ({ quote: vi.fn() }));

import CheckoutAddress from "./CheckoutAddress";
import { validate } from "./InlineCheckout";
import {
  addressLine,
  cleanAddress,
  editAddresses,
  hasAddress,
  sameAddress,
  toAddress,
  toAddresses,
  validateAddress,
} from "./profile";
import type { Address, CheckoutDraft } from "./types";

afterEach(cleanup);

const FIELDS = ["street", "city", "state", "postalCode"] as const;

// Every kind of value a field could hold after JSON, Mongo or a bad merge.
const VALUES: unknown[] = [
  undefined,
  null,
  "",
  "   ",
  "Hyderabad",
  "  500075 ",
  0,
  500075,
  Number.NaN,
  Number.POSITIVE_INFINITY,
  true,
  false,
  {},
  [],
  ["Hyderabad"],
  () => "x",
];

// Whole-object shapes: not an object at all, empty, or partially filled.
const SHAPES: unknown[] = [
  undefined,
  null,
  "",
  "Plot 12, Narsingi",
  500075,
  true,
  [],
  {},
  { _id: "a9" },
  // Exactly what Mongo returns when only some fields were ever saved.
  { _id: "a9", city: "Hyderabad", state: "Telangana" },
  { _id: "a9", street: "Plot 12" },
  { street: null, city: null, state: null, postalCode: null },
  { street: undefined, city: undefined },
  { postalCode: 500075 },
  { street: 12, city: {}, state: [], postalCode: Number.NaN },
  { _id: { $oid: "a9" }, label: 7, street: "Plot 12", city: "Hyderabad" },
  Object.create(null),
];

const isStringAddress = (a: Address) =>
  FIELDS.every((f) => typeof a[f] === "string");

// All 16^4 = 65,536 field combinations, generated lazily.
function* everyCombination(): Generator<Record<string, unknown>> {
  const n = VALUES.length;
  for (let i = 0; i < n ** FIELDS.length; i++) {
    let k = i;
    const out: Record<string, unknown> = {};
    for (const f of FIELDS) {
      out[f] = VALUES[k % n];
      k = Math.floor(k / n);
    }
    yield out;
  }
}

const good: Address = {
  _id: "a1",
  street: "Plot 12, Narsingi",
  city: "Hyderabad",
  state: "Telangana",
  postalCode: "500075",
};

describe("toAddress", () => {
  it.each(SHAPES.map((s) => [s]))("normalises %o to four strings", (raw) => {
    const a = toAddress(raw);
    expect(isStringAddress(a)).toBe(true);
  });

  it("returns strings for every one of 65,536 field combinations", () => {
    let count = 0;
    for (const raw of everyCombination()) {
      const a = toAddress(raw);
      if (!isStringAddress(a)) throw new Error(`not strings: ${String(raw)}`);
      count++;
    }
    expect(count).toBe(VALUES.length ** FIELDS.length);
  });

  it("keeps real values, turns finite numbers into text and drops the rest", () => {
    expect(
      toAddress({
        _id: "a1",
        label: "Home",
        street: "Plot 12",
        city: null,
        state: undefined,
        postalCode: 500075,
      }),
    ).toEqual({
      _id: "a1",
      label: "Home",
      street: "Plot 12",
      city: "",
      state: "",
      postalCode: "500075",
    });
    expect(toAddress({ postalCode: Number.NaN }).postalCode).toBe("");
    expect(toAddress({ city: {} }).city).toBe("");
    expect(toAddress({ _id: { $oid: "x" } })).not.toHaveProperty("_id");
  });

  it("toAddresses drops non-objects and survives a non-array", () => {
    expect(toAddresses(undefined)).toEqual([]);
    expect(toAddresses(null)).toEqual([]);
    expect(toAddresses("x")).toEqual([]);
    expect(toAddresses({ 0: good })).toEqual([]);
    const list = toAddresses([null, "x", 5, undefined, {}, good, [1]]);
    // {} and [] are objects: kept as blank addresses, never as raw junk.
    expect(list.every(isStringAddress)).toBe(true);
    expect(list).toContainEqual(good);
  });
});

describe("address helpers never throw", () => {
  it("on every field combination", () => {
    for (const raw of everyCombination()) {
      const a = raw as unknown as Address;
      validateAddress(a);
      cleanAddress(a);
      hasAddress(a);
      addressLine(a);
      sameAddress(a, good);
      sameAddress(good, a);
      sameAddress(a, a);
    }
  });

  it.each(SHAPES.map((s) => [s]))("on whole shape %o", (raw) => {
    const a = raw as Address;
    expect(() => validateAddress(a)).not.toThrow();
    expect(() => cleanAddress(a)).not.toThrow();
    expect(() => hasAddress(a)).not.toThrow();
    expect(() => addressLine(a)).not.toThrow();
    expect(() => sameAddress(a, good)).not.toThrow();
    expect(isStringAddress(cleanAddress(a))).toBe(true);
    expect(typeof addressLine(a)).toBe("string");
  });

  it("validateAddress names every missing part of a partial address", () => {
    expect(validateAddress({ city: "Hyderabad" } as Address)).toEqual([
      "house and street",
      "state",
      "a 6-digit PIN code",
    ]);
    expect(validateAddress(undefined)).toHaveLength(4);
    expect(validateAddress(null)).toHaveLength(4);
    // A PIN stored as a number (or padded) is still a valid PIN.
    expect(
      validateAddress({ ...good, postalCode: 500075 as unknown as string }),
    ).toEqual([]);
    expect(validateAddress({ ...good, postalCode: " 500075 " })).toEqual([]);
  });

  it("addressLine skips blank and missing parts", () => {
    expect(addressLine({ city: " Hyderabad ", street: null } as never)).toBe(
      "Hyderabad",
    );
    expect(addressLine(null)).toBe("");
  });

  it("sameAddress matches by id, else by trimmed text, and rejects null", () => {
    expect(sameAddress(null, good)).toBe(false);
    expect(sameAddress(good, undefined)).toBe(false);
    expect(
      sameAddress({ ...good, _id: undefined }, { ...good, _id: "zz" }),
    ).toBe(true);
    expect(
      sameAddress(
        { street: " Plot 12, Narsingi", city: "hyderabad" } as Address,
        { street: "Plot 12, Narsingi ", city: "Hyderabad" } as Address,
      ),
    ).toBe(true);
  });

  it("editAddresses cleans a corrupt book and never throws", () => {
    const junk = [null, { city: "Hyderabad" }, "x", good, { postalCode: 1 }];
    for (const current of SHAPES) {
      const res = editAddresses(junk as Address[], current as Address, {
        kind: "save",
        index: null,
        address: { street: " Hitech City " } as Address,
      });
      expect(res.addresses.every(isStringAddress)).toBe(true);
      expect(res.addresses.at(-1)?.street).toBe("Hitech City");
      expect(() =>
        editAddresses(junk as Address[], current as Address, {
          kind: "remove",
          index: 0,
        }),
      ).not.toThrow();
      expect(() =>
        editAddresses(junk as Address[], current as Address, {
          kind: "default",
          index: 99,
        }),
      ).not.toThrow();
    }
    expect(() =>
      editAddresses(undefined as never, undefined, {
        kind: "default",
        index: 0,
      }),
    ).not.toThrow();
  });
});

describe("checkout validate never throws", () => {
  const draft = (over: Record<string, unknown>) =>
    ({
      name: "Asha",
      phone: "9876543210",
      email: "",
      address: good,
      slotDay: "2099-11-05",
      slotTime: "12 pm – 3 pm",
      ...over,
    }) as unknown as CheckoutDraft;

  it.each(SHAPES.map((s) => [s]))("with address %o", (address) => {
    expect(() => validate(draft({ address }))).not.toThrow();
  });

  it("with missing name, phone and email", () => {
    const missing = validate(
      draft({ name: undefined, phone: undefined, email: null, address: {} }),
    );
    expect(missing).toEqual(
      expect.arrayContaining([
        "your name",
        "a 10-digit mobile number",
        "your address",
        "your state",
        "a 6-digit PIN code",
      ]),
    );
  });

  it("passes a complete address whose PIN is stored as a number", () => {
    expect(
      validate(draft({ address: { ...good, postalCode: 500075 } })),
    ).toEqual([]);
  });

  it("on every field combination", () => {
    for (const address of everyCombination()) validate(draft({ address }));
  });
});

describe("CheckoutAddress with partial account addresses", () => {
  const setup = (over: Record<string, unknown> = {}) => {
    const props = {
      address: good,
      savedAddressId: null,
      saved: [good],
      defaultAddress: good,
      signedIn: true,
      onPick: vi.fn(),
      onChange: vi.fn(),
      onSave: vi.fn(async (a: Address) => ({ ...a, _id: "a3" })),
      onAddingChange: vi.fn(),
      ...over,
    } as unknown as Parameters<typeof CheckoutAddress>[0];
    render(<CheckoutAddress {...props} />);
    return props as unknown as {
      onPick: ReturnType<typeof vi.fn>;
      onSave: ReturnType<typeof vi.fn>;
      onChange: ReturnType<typeof vi.fn>;
    };
  };

  it("reproduces the prod crash: a saved address with no street", async () => {
    const partial = { _id: "a9", city: "Hyderabad", state: "Telangana" };
    const u = userEvent.setup();
    const { onPick } = setup({
      address: partial,
      saved: [partial],
      defaultAddress: partial,
      savedAddressId: "a9",
    });
    const card = screen.getByRole("radio", { name: /hyderabad/i });
    await u.click(card);
    const [picked] = onPick.mock.calls[0];
    expect(isStringAddress(picked)).toBe(true);
    expect(picked).toMatchObject({ _id: "a9", street: "", postalCode: "" });
  });

  it.each(SHAPES.map((s) => [s]))(
    "renders signed in with %o everywhere",
    (s) => {
      expect(() =>
        setup({ address: s, saved: [s, good, s], defaultAddress: s }),
      ).not.toThrow();
    },
  );

  it.each(SHAPES.map((s) => [s]))("renders for a guest with %o", (s) => {
    expect(() => setup({ address: s, signedIn: false })).not.toThrow();
    for (const input of screen.getAllByRole("textbox"))
      expect(typeof (input as HTMLInputElement).value).toBe("string");
  });

  it("survives a saved list that is not an array", () => {
    for (const saved of [undefined, null, "x", {}, 5])
      expect(() => {
        setup({ saved, address: undefined, defaultAddress: undefined });
        cleanup();
      }).not.toThrow();
  });

  it("opens, rejects and then saves a new address after a partial one", async () => {
    const u = userEvent.setup();
    const { onSave, onPick } = setup({
      address: { city: "Hyderabad" },
      saved: [{ _id: "a9", postalCode: 500075 }],
      defaultAddress: null,
    });
    await u.click(screen.getByRole("button", { name: /add a new address/i }));
    await u.click(screen.getByRole("button", { name: /use this address/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/house and street/);
    expect(onSave).not.toHaveBeenCalled();
    await u.type(
      screen.getByLabelText("House, street, area"),
      "  Hitech City ",
    );
    await u.type(screen.getByLabelText("City"), "Hyderabad");
    await u.type(screen.getByLabelText("State"), "Telangana");
    await u.type(screen.getByLabelText("PIN code"), "500081");
    await u.click(screen.getByRole("button", { name: /use this address/i }));
    await vi.waitFor(() => expect(onPick).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith({
      street: "Hitech City",
      city: "Hyderabad",
      state: "Telangana",
      postalCode: "500081",
    });
  }, 15_000);

  it("renders a sample of malformed field combinations", () => {
    // Every value in every field once (the full 65k grid runs on the helpers).
    for (const v of VALUES) {
      const raw = { _id: "a9", street: v, city: v, state: v, postalCode: v };
      expect(() =>
        setup({ address: raw, saved: [raw], defaultAddress: raw }),
      ).not.toThrow();
      cleanup();
    }
  });
});
