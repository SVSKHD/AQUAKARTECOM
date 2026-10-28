import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/user", () => ({
  default: { UserUpdateDetails: vi.fn() },
}));

vi.mock("@/services/order", () => ({
  default: {
    getOrdersByUserId: vi.fn(async () => ({
      success: true,
      data: [
        {
          _id: "o1",
          orderId: "AQOD-1",
          createdAt: "2026-10-01T10:00:00.000Z",
          items: [
            {
              productId: "p1",
              name: "Kent Automatic 8L",
              quantity: 1,
              price: 31500,
            },
          ],
          totalAmount: 31500,
          paymentMethod: "Gateway",
          paymentStatus: "Failed",
          orderStatus: "Processing",
          shippingAddress: {
            street: "Plot 12",
            city: "Hyderabad",
            postalCode: "500075",
          },
        },
        {
          _id: "o2",
          orderId: "AQOD-2",
          createdAt: "2026-10-20T10:00:00.000Z",
          items: [
            { name: "Kent Bathroom Softener", quantity: 1, price: 14500 },
          ],
          totalAmount: 14500,
          paymentMethod: "Cash On Delivery",
          paymentStatus: "Pending",
          orderStatus: "Processing",
        },
      ],
    })),
  },
}));

const users = (await import("@/services/user")).default as unknown as {
  UserUpdateDetails: ReturnType<typeof vi.fn>;
};
const { default: ProfileDialog } = await import("./ProfileDialog");
type Product = import("./types").Product;

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
      cart={[{ id: "p8", title: "Kent Automatic 8L", price: 31500, qty: 2 }]}
      favs={[]}
      canView
      canCheckout
      onQty={vi.fn()}
      onRemoveCart={vi.fn()}
      onRemoveFav={vi.fn()}
      onAddToCart={vi.fn()}
      onView={vi.fn()}
      onCheckout={vi.fn()}
      products={[
        {
          id: "p8",
          title: "Kent Automatic 8L",
          price: 31500,
          photos: [],
        } as unknown as Product,
      ]}
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
    // The glass date picker's trigger shows the date (and the age beside it).
    expect(screen.getByLabelText("Birthday")).toHaveTextContent("21 Aug 1994");
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

  it("lists purchases; each opens a quick view of its products and invoice", async () => {
    const u = userEvent.setup();
    const onView = vi.fn();
    setup({ onView });
    await u.click(screen.getByRole("tab", { name: /purchases/i }));
    const row = screen.getByRole("button", { name: /kent automatic 8l/i });
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(row).toHaveAttribute("aria-expanded", "false");

    await u.click(row);
    expect(row).toHaveAttribute("aria-expanded", "true");
    // The item is matched to the catalogue and opens as a product.
    await u.click(
      screen.getByRole("button", { name: "View Kent Automatic 8L" }),
    );
    expect(onView).toHaveBeenCalledWith("p8");
    expect(
      screen.getByRole("link", { name: /open full invoice/i }),
    ).toHaveAttribute("href", "/invoice/inv1");
  });

  it("has Cart and Favourites tabs beside Purchases", async () => {
    const u = userEvent.setup();
    const onQty = vi.fn();
    setup({ onQty });
    const tabs = screen.getAllByRole("tab").map((t) => t.textContent);
    expect(tabs.join("|")).toMatch(/Purchases.*\|Cart.*\|Favourites/);

    await u.click(screen.getByRole("tab", { name: /cart/i }));
    await u.click(
      screen.getByRole("button", {
        name: "Increase quantity of Kent Automatic 8L",
      }),
    );
    expect(onQty).toHaveBeenCalledWith("p8", 3);
    expect(screen.getByRole("button", { name: /checkout/i })).toBeEnabled();

    await u.click(screen.getByRole("tab", { name: /favourites/i }));
    expect(screen.getByText("No favourites yet")).toBeInTheDocument();
  });

  it("keeps Sign out in the footer on every tab", async () => {
    const u = userEvent.setup();
    const onSignOut = vi.fn();
    setup({ onSignOut });
    await u.click(screen.getByRole("tab", { name: /addresses/i }));
    await u.click(screen.getByRole("button", { name: /sign out/i }));
    expect(onSignOut).toHaveBeenCalled();
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

  it("lists checkout orders with their payment status in the Orders tab", async () => {
    const u = userEvent.setup();
    setup();
    await u.click(screen.getByRole("tab", { name: /orders/i }));
    const cod = await screen.findByRole("button", {
      name: /Kent Bathroom Softener/,
    });
    expect(cod).toHaveTextContent("AQOD-2");
    expect(cod).toHaveTextContent("Pay on delivery");
    const failed = screen.getByRole("button", { name: /Kent Automatic 8L/ });
    expect(failed).toHaveTextContent("Payment failed");
    // Newest first.
    const rows = screen.getAllByRole("button", { name: /AQOD-/ });
    expect(rows[0]).toHaveTextContent("AQOD-2");
    await u.click(failed);
    expect(failed).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("link", { name: /get help on whatsapp/i }),
    ).toHaveAttribute("href", expect.stringContaining("AQOD-1"));
  });
});
