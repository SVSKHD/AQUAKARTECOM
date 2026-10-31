import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import EmailSignIn from "./EmailSignIn";

const dispatch = vi.fn();
vi.mock("react-redux", () => ({ useDispatch: () => dispatch }));
const api = vi.hoisted(() => ({
  UserEmailOtp: vi.fn(),
  UserEmailVerify: vi.fn(),
}));
vi.mock("@/services/user", () => ({ default: api }));
vi.mock("@/services/googleAuth", () => ({
  completeGoogleRedirectLogin: vi.fn(() => Promise.resolve(null)),
  loginWithGoogle: vi.fn(),
  loginWithGoogleIdToken: vi.fn(),
  logoutBackendUser: vi.fn(),
  logoutGoogleUser: vi.fn(),
}));
vi.mock("@/services/googleOneTap", () => ({
  cancelGoogleOneTap: vi.fn(),
  disableGoogleAutoSelect: vi.fn(),
  promptGoogleOneTap: vi.fn(() => Promise.resolve(null)),
}));

const { useAquaAuth } = await import("./useAquaAuth");

describe("EmailSignIn", () => {
  const setup = (over = {}) => {
    const props = {
      sendEmailCode: vi.fn(() => Promise.resolve({ newUser: false })),
      verifyEmailCode: vi.fn(() => Promise.resolve()),
      onGoogle: vi.fn(),
      defaultEmail: "asha@example.com",
      ...over,
    };
    render(<EmailSignIn {...props} />);
    return props;
  };

  it("sends a code to the invoice email, then signs in with it", async () => {
    const p = setup();
    const user = userEvent.setup();
    expect(screen.getByLabelText("Email for sign-in")).toHaveValue(
      "asha@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Email me a code" }));
    expect(p.sendEmailCode).toHaveBeenCalledWith("asha@example.com");
    expect(screen.getByText(/we sent a 6-digit code to/i)).toHaveTextContent(
      "asha@example.com",
    );
    expect(
      screen.getByRole("button", { name: /resend code in 30s/i }),
    ).toBeDisabled();
    // A full code verifies on its own.
    await user.type(screen.getByLabelText("6-digit code"), "123456");
    expect(p.verifyEmailCode).toHaveBeenCalledWith(
      "asha@example.com",
      "123456",
    );
  });

  it("explains a bad email or a wrong code, and offers Google", async () => {
    const p = setup({
      defaultEmail: "nope",
      verifyEmailCode: vi.fn(() =>
        Promise.reject(
          new Error("That code didn't match. Check it and try again."),
        ),
      ),
    });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Email me a code" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/valid email/i);
    expect(p.sendEmailCode).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Email for sign-in"));
    await user.type(screen.getByLabelText("Email for sign-in"), "a@b.co");
    await user.click(screen.getByRole("button", { name: "Email me a code" }));
    await user.type(screen.getByLabelText("6-digit code"), "999999");
    expect(await screen.findByRole("alert")).toHaveTextContent(/didn't match/);
    await user.click(screen.getByRole("button", { name: /change/i }));
    expect(screen.getByLabelText("Email for sign-in")).toHaveValue("a@b.co");

    await user.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    expect(p.onGoogle).toHaveBeenCalled();
  });
});

describe("useAquaAuth email sign-in", () => {
  it("stores the session like a Google sign-in", async () => {
    api.UserEmailOtp.mockResolvedValue({ data: { userExist: false } });
    api.UserEmailVerify.mockResolvedValue({
      data: {
        success: true,
        token: "t1",
        user: { _id: "u1", email: "a@b.co" },
      },
    });
    const { result } = renderHook(() => useAquaAuth("tok"));
    await expect(result.current.sendEmailCode("a@b.co")).resolves.toEqual({
      newUser: true,
    });
    expect(api.UserEmailOtp).toHaveBeenCalledWith({ email: "a@b.co" });
    await act(() => result.current.verifyEmailCode("a@b.co", "012345"));
    expect(api.UserEmailVerify).toHaveBeenCalledWith({
      email: "a@b.co",
      otp: 12345,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: "LOGGED_IN_USER",
      payload: { token: "t1", user: { _id: "u1", email: "a@b.co" } },
    });
  });

  it("turns failures into messages a shopper can act on", async () => {
    api.UserEmailOtp.mockRejectedValue(new Error("500"));
    api.UserEmailVerify.mockRejectedValue(new Error("400"));
    const { result } = renderHook(() => useAquaAuth("tok"));
    await expect(result.current.sendEmailCode("a@b.co")).rejects.toThrow(
      /couldn't send the code/i,
    );
    await expect(
      result.current.verifyEmailCode("a@b.co", "111111"),
    ).rejects.toThrow(/didn't match/i);
  });
});
