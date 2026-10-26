import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/user", () => ({
  default: { UserUpdateDetails: vi.fn() },
}));

const users = (await import("@/services/user")).default as unknown as {
  UserUpdateDetails: ReturnType<typeof vi.fn>;
};
const { default: ProfileDialog } = await import("./ProfileDialog");

const user = {
  _id: "u1",
  name: "Asha Reddy",
  email: "asha@example.com",
  phone: 9876543210,
  dob: "1994-08-21T00:00:00.000Z",
  addresses: [
    {
      _id: "a1",
      street: "Plot 12, Narsingi",
      city: "Hyderabad",
      state: "Telangana",
      postalCode: "500075",
    },
  ],
  selectedAddress: {
    _id: "a1",
    street: "Plot 12, Narsingi",
    city: "Hyderabad",
    state: "Telangana",
    postalCode: "500075",
  },
};

const setup = (over: Partial<Parameters<typeof ProfileDialog>[0]> = {}) => {
  const onSaved = vi.fn();
  render(
    <ProfileDialog
      user={user}
      token="tok"
      purchases={[
        {
          id: "inv1",
          invoiceNo: "AQ-101",
          date: "2026-09-01",
          paidStatus: "Paid",
          itemCount: 1,
          total_price: 24999,
          items: ["Kent Automatic 8L"],
        },
      ]}
      locked={false}
      onClose={vi.fn()}
      onSaved={onSaved}
      onSignOut={vi.fn()}
      {...over}
    />,
  );
  return { onSaved };
};

describe("ProfileDialog", () => {
  beforeEach(() => users.UserUpdateDetails.mockReset());

  it("opens prefilled with the account's details", () => {
    setup();
    expect(
      screen.getByRole("dialog", { name: "Asha Reddy" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("First name")).toHaveValue("Asha");
    expect(screen.getByLabelText("Last name")).toHaveValue("Reddy");
    expect(screen.getByLabelText("Mobile number")).toHaveValue("9876543210");
    expect(screen.getByLabelText("Birthday")).toHaveValue("1994-08-21");
    expect(screen.getByLabelText("Email")).toBeDisabled();
    // Nothing changed yet, so nothing to save.
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("saves the edited profile and hands back only those fields", async () => {
    const u = userEvent.setup();
    users.UserUpdateDetails.mockResolvedValueOnce({
      data: { ...user, firstName: "Asha", lastName: "R", password: "hash" },
    });
    const { onSaved } = setup();
    await u.clear(screen.getByLabelText("Last name"));
    await u.type(screen.getByLabelText("Last name"), "R");
    await u.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(users.UserUpdateDetails).toHaveBeenCalledWith(
      "u1",
      {
        newDetails: {
          firstName: "Asha",
          lastName: "R",
          phone: 9876543210,
          dob: "1994-08-21",
        },
      },
      "tok",
    );
    const [patch, message] = onSaved.mock.calls[0];
    expect(patch).toEqual({
      firstName: "Asha",
      lastName: "R",
      phone: 9876543210,
      dob: "1994-08-21T00:00:00.000Z",
      name: "Asha R",
    });
    expect(patch).not.toHaveProperty("password");
    expect(message).toBe("Profile saved");
  });

  it("adds an address and keeps the book on the account", async () => {
    const u = userEvent.setup();
    users.UserUpdateDetails.mockResolvedValueOnce({ data: {} });
    const { onSaved } = setup({ initialTab: "addresses" });
    expect(screen.getByText("Default")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /add an address/i }));
    await u.type(screen.getByLabelText("House, street, area"), "Hitech City");
    await u.type(screen.getByLabelText("City"), "Hyderabad");
    await u.type(screen.getByLabelText("State"), "Telangana");
    await u.type(screen.getByLabelText("PIN code"), "500081");
    await u.click(screen.getByRole("button", { name: /save address/i }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const sent = users.UserUpdateDetails.mock.calls[0][1].newDetails;
    expect(sent.addresses).toHaveLength(2);
    expect(sent.selectedAddress._id).toBe("a1");
  });

  it("lists purchases with a link to each invoice", async () => {
    const u = userEvent.setup();
    setup();
    await u.click(screen.getByRole("tab", { name: /purchases/i }));
    const link = screen.getByRole("link", { name: /kent automatic 8l/i });
    expect(link).toHaveAttribute("href", "/invoice/inv1");
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("explains a failed save and keeps the form", async () => {
    const u = userEvent.setup();
    users.UserUpdateDetails.mockRejectedValueOnce({
      response: { data: { message: "E11000 duplicate key phone" } },
    });
    const { onSaved } = setup();
    await u.clear(screen.getByLabelText("Mobile number"));
    await u.type(screen.getByLabelText("Mobile number"), "9123456789");
    await u.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /already on another aquakart account/i,
    );
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Mobile number")).toHaveValue("9123456789");
  });
});
