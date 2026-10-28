import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CheckoutAddress from "./CheckoutAddress";
import type { Address } from "./types";

const home: Address = {
  _id: "a1",
  street: "Plot 12, Narsingi",
  city: "Hyderabad",
  state: "Telangana",
  postalCode: "500075",
};
const office: Address = {
  _id: "a2",
  street: "Tower B, Hitech City",
  city: "Hyderabad",
  state: "Telangana",
  postalCode: "500081",
};
const empty: Address = { street: "", city: "", state: "", postalCode: "" };

function setup(over: Partial<Parameters<typeof CheckoutAddress>[0]> = {}) {
  const props = {
    address: home,
    savedAddressId: "a1",
    saved: [home, office],
    defaultAddress: home,
    signedIn: true,
    onPick: vi.fn(),
    onChange: vi.fn(),
    onSave: vi.fn(async (a: Address) => ({ ...a, _id: "a3" })),
    onAddingChange: vi.fn(),
    ...over,
  };
  render(<CheckoutAddress {...props} />);
  return props;
}

const fillNew = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(
    screen.getByLabelText("House, street, area"),
    "  Flat 4, Kondapur ",
  );
  await user.type(screen.getByLabelText("City"), "Hyderabad");
  await user.type(screen.getByLabelText("State"), "Telangana");
  await user.type(screen.getByLabelText("PIN code"), "500084");
};

describe("CheckoutAddress", () => {
  it("asks to select a saved address and picks one", async () => {
    const user = userEvent.setup();
    const p = setup();
    expect(screen.getByText("Select a delivery address")).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[0]).toHaveTextContent("Default");
    await user.click(radios[1]);
    expect(p.onPick).toHaveBeenCalledWith(office, "a2");
  });

  it("adds a new address on the fly, saves it to the account and uses it", async () => {
    const user = userEvent.setup();
    const p = setup();
    await user.click(
      screen.getByRole("button", { name: /add a new address/i }),
    );
    expect(p.onAddingChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByLabelText(/save to my addresses/i)).toBeChecked();
    // Incomplete: says what's missing, saves nothing.
    await user.click(screen.getByRole("button", { name: /use this address/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/house and street/);
    expect(p.onSave).not.toHaveBeenCalled();
    await fillNew(user);
    await user.click(screen.getByRole("button", { name: /use this address/i }));
    const sent = {
      street: "Flat 4, Kondapur",
      city: "Hyderabad",
      state: "Telangana",
      postalCode: "500084",
    };
    expect(p.onSave).toHaveBeenCalledWith(sent);
    expect(p.onPick).toHaveBeenCalledWith({ ...sent, _id: "a3" }, "a3");
    expect(p.onAddingChange).toHaveBeenLastCalledWith(false);
  });

  it("still lets the address be used for this order when saving fails", async () => {
    const user = userEvent.setup();
    const p = setup({
      onSave: vi.fn(async () => {
        throw new Error("Couldn't save the address just now.");
      }),
    });
    await user.click(
      screen.getByRole("button", { name: /add a new address/i }),
    );
    await fillNew(user);
    await user.click(screen.getByRole("button", { name: /use this address/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /couldn't save the address just now\. you can still use it/i,
    );
    await user.click(
      screen.getByRole("button", { name: /use for this order only/i }),
    );
    expect(p.onPick).toHaveBeenCalledWith(
      expect.objectContaining({ street: "Flat 4, Kondapur" }),
      null,
    );
  });

  it("uses an unsaved address for this order only when saving is unticked", async () => {
    const user = userEvent.setup();
    const p = setup();
    await user.click(
      screen.getByRole("button", { name: /add a new address/i }),
    );
    await fillNew(user);
    await user.click(screen.getByLabelText(/save to my addresses/i));
    await user.click(screen.getByRole("button", { name: /use this address/i }));
    expect(p.onSave).not.toHaveBeenCalled();
    expect(p.onPick).toHaveBeenCalledWith(
      expect.objectContaining({ postalCode: "500084" }),
      null,
    );
  });

  it("opens the form straight away for a signed-in customer with no addresses", () => {
    setup({ saved: [], address: empty, savedAddressId: null });
    expect(
      screen.getByText("Add the address we deliver and install at"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("House, street, area")).toBeInTheDocument();
  });

  it("lets a guest type the address directly", async () => {
    const user = userEvent.setup();
    const p = setup({ signedIn: false, saved: [], address: empty });
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("City"), "H");
    expect(p.onChange).toHaveBeenCalledWith({ city: "H" });
  });
});
