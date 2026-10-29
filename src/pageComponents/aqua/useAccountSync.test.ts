import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUser = vi.fn();
const dispatch = vi.fn();
vi.mock("@/services/googleAuth", () => ({ getCurrentUser }));
vi.mock("react-redux", () => ({ useDispatch: () => dispatch }));

const { accountPatch, useAccountSync } = await import("./useAccountSync");

const home = {
  _id: "a1",
  street: "Plot 12",
  city: "Hyderabad",
  state: "Telangana",
  postalCode: "500075",
};

describe("useAccountSync", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    dispatch.mockReset();
  });

  it("keeps only the account fields the assistant shows", () => {
    expect(
      accountPatch({
        addresses: [home],
        selectedAddress: home,
        role: 1,
        token: "x",
      }),
    ).toEqual({ addresses: [home], selectedAddress: home });
    expect(accountPatch(null)).toEqual({});
  });

  it("pulls the saved address book from the server when signed in", async () => {
    getCurrentUser.mockResolvedValue({
      user: { addresses: [home], selectedAddress: home },
    });
    const { result } = renderHook(() => useAccountSync("tok"));
    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith({
        type: "UPDATE_USER_DETAILS",
        payload: { addresses: [home], selectedAddress: home },
      }),
    );
    expect(getCurrentUser).toHaveBeenCalledWith("tok");
    // Opening the profile or checkout asks again.
    await act(() => result.current());
    expect(getCurrentUser).toHaveBeenCalledTimes(2);
  });

  it("does nothing signed out, and keeps the stored account when offline", async () => {
    renderHook(() => useAccountSync(null));
    expect(getCurrentUser).not.toHaveBeenCalled();
    getCurrentUser.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useAccountSync("tok"));
    await act(() => result.current());
    expect(dispatch).not.toHaveBeenCalled();
  });
});
