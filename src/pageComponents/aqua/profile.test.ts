import { describe, expect, it } from "vitest";
import {
  editAddresses,
  profileDetails,
  profileForm,
  toDateInput,
  validateAddress,
  validateProfile,
} from "./profile";

const home = {
  _id: "a1",
  street: "Plot 12, Narsingi",
  city: "Hyderabad",
  state: "Telangana",
  postalCode: "500075",
};
const office = {
  _id: "a2",
  street: "Hitech City",
  city: "Hyderabad",
  state: "Telangana",
  postalCode: "500081",
};

describe("profile helpers", () => {
  it("prefills from the account, splitting a Google name when needed", () => {
    expect(
      profileForm({
        name: "Asha Rani Reddy",
        phone: 919876543210,
        dob: "1994-08-21T00:00:00.000Z",
      }),
    ).toEqual({
      firstName: "Asha",
      lastName: "Rani Reddy",
      phone: "9876543210",
      dob: "1994-08-21",
    });
    expect(profileForm({ name: "Asha R", firstName: "Asha" })).toMatchObject({
      firstName: "Asha",
      lastName: "",
    });
    expect(profileForm(null)).toEqual({
      firstName: "",
      lastName: "",
      phone: "",
      dob: "",
    });
  });

  it("reads dates as the calendar day", () => {
    expect(toDateInput("2001-01-31")).toBe("2001-01-31");
    expect(toDateInput("nonsense")).toBe("");
    expect(toDateInput(undefined)).toBe("");
  });

  it("validates name, phone and birthday", () => {
    const today = new Date("2026-10-25T10:00:00Z");
    const ok = { firstName: "Asha", lastName: "", phone: "", dob: "" };
    expect(validateProfile(ok, today)).toEqual({});
    expect(
      validateProfile(
        { firstName: " ", lastName: "", phone: "12345", dob: "2027-01-01" },
        today,
      ),
    ).toEqual({
      firstName: expect.any(String),
      phone: expect.any(String),
      dob: "Your birthday can't be in the future",
    });
    expect(validateProfile({ ...ok, dob: "1800-01-01" }, today).dob).toBe(
      "Pick a real date",
    );
  });

  it("sends only the edited fields", () => {
    expect(
      profileDetails({
        firstName: " Asha ",
        lastName: "Reddy",
        phone: "",
        dob: "",
      }),
    ).toEqual({ firstName: "Asha", lastName: "Reddy" });
    expect(
      profileDetails({
        firstName: "Asha",
        lastName: "",
        phone: "9876543210",
        dob: "1994-08-21",
      }),
    ).toMatchObject({ phone: 9876543210, dob: "1994-08-21" });
  });

  it("needs a full address with a PIN", () => {
    expect(validateAddress(home)).toEqual([]);
    expect(
      validateAddress({
        street: "",
        city: "Hyd",
        state: "",
        postalCode: "5000",
      }),
    ).toEqual(["house and street", "state", "a 6-digit PIN code"]);
  });

  it("adds, edits, removes and picks the default address", () => {
    const added = editAddresses([], null, {
      kind: "save",
      index: null,
      address: { ...home, _id: undefined },
    });
    // The first address becomes the default.
    expect(added.selectedAddress?.street).toBe(home.street);

    const two = editAddresses([home], home, {
      kind: "save",
      index: null,
      address: office,
      makeDefault: true,
    });
    expect(two.addresses).toHaveLength(2);
    expect(two.selectedAddress?._id).toBe("a2");

    // Editing the default keeps it the default.
    const edited = editAddresses([home, office], office, {
      kind: "save",
      index: 1,
      address: { ...office, street: "Raidurg" },
    });
    expect(edited.selectedAddress?.street).toBe("Raidurg");

    // Removing the default falls back to the first one left.
    const removed = editAddresses([home, office], office, {
      kind: "remove",
      index: 1,
    });
    expect(removed.addresses.map((a) => a._id)).toEqual(["a1"]);
    expect(removed.selectedAddress?._id).toBe("a1");

    expect(
      editAddresses([home, office], home, { kind: "default", index: 1 })
        .selectedAddress?._id,
    ).toBe("a2");
  });
});
