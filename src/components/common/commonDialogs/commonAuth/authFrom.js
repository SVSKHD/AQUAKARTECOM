import UserServiceOperations from "@/services/user";
import useDialog from "@/utils/dialog";
import { useState, useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import AquaToast from "@/components/reusables/react-toastify";
import Image from "next/image";
import debounce from "lodash.debounce";
import { showToast } from "@/store/reducers/toastReducer";
import { Send, Loader2 } from "lucide-react";

const AquaAuthMobileForm = ({ signup }) => {
  const [email, setEmail] = useState("");
  const [otpShow, setOtpShow] = useState(false);
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false); // Track loading state
  const { closeAuthDialog } = useDialog();
  const dispatch = useDispatch();
  const inputRefs = useRef([]);

  const handleKeyDown = (event) => {
    if (event.key === "Backspace") {
      // console.log("Backspace pressed");
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Debounced OTP request function
  const requestOtp = useCallback(
    debounce((emailToSend) => {
      if (isValidEmail(emailToSend)) {
        setLoading(true);

        dispatch(showToast("First message", "success"));
        AquaToast({
          message: "OTP in Air. Please wait...",
          type: "info",
        });

        UserServiceOperations.UserEmailOtp({ email: emailToSend })
          .then((res) => {
            setOtpDigits(Array(6).fill(""));
            setOtpShow(true);
            AquaToast({
              message: "Successfully sent OTP",
              type: "success",
            });
            dispatch({
              type: "SET_AUTH_STATUS_VISIBLE",
              payload: !res.data.userExist,
            });
            setTimeout(() => inputRefs.current?.[0]?.focus(), 0);
          })
          .catch(() => {
            setOtpShow(false);
            AquaToast({
              message: "Failed to send OTP",
              type: "error",
            });
            dispatch({
              type: "SET_AUTH_STATUS_VISIBLE",
              payload: false,
            });
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setOtpShow(false);
        AquaToast({
          message: "Invalid email address!",
          type: "error",
        });
      }
    }, 300),
    [dispatch],
  );

  // Function to trigger OTP request only on button click
  const handleSendClick = () => {
    if (!email || !isValidEmail(email)) {
      AquaToast({
        message: "Enter a valid email before sending OTP!",
        type: "error",
      });
      return;
    }
    if (loading) {
      return;
    }
    setOtpShow(false);
    setOtpDigits(Array(6).fill(""));
    requestOtp(email);
  };

  useEffect(() => {
    if (!email) {
      requestOtp.cancel();
    }
  }, [email, requestOtp]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const otpValue = otpDigits.join("");
    if (!otpShow || otpValue.length !== 6) {
      return;
    }
    const data = { email, otp: Number(otpValue) };
    UserServiceOperations.UserEmailVerify(data)
      .then((res) => {
        AquaToast({
          message: "Verification successful",
          type: "success",
        });
        dispatch({
          type: "LOGGED_IN_USER",
          payload: res.data,
        });
        closeAuthDialog();
      })
      .catch((err) => {
        AquaToast({
          message: "Verification failed",
          type: "error",
        });
      });
  };

  const handleOtpChange = (index, value) => {
    const sanitized = value.replace(/\D/g, "");
    const updatedDigits = [...otpDigits];

    if (!sanitized) {
      updatedDigits[index] = "";
      setOtpDigits(updatedDigits);
      return;
    }

    updatedDigits[index] = sanitized.charAt(sanitized.length - 1);
    setOtpDigits(updatedDigits);

    if (index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const updatedDigits = [...otpDigits];
      if (updatedDigits[index]) {
        updatedDigits[index] = "";
        setOtpDigits(updatedDigits);
      } else if (index > 0) {
        updatedDigits[index - 1] = "";
        setOtpDigits(updatedDigits);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) {
      return;
    }

    const updatedDigits = Array(6)
      .fill("")
      .map((_, idx) => pasted[idx] || "");
    setOtpDigits(updatedDigits);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const isOtpComplete = otpDigits.every((digit) => digit !== "");
  const canSubmit = otpShow && isOtpComplete;

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Send className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {signup ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="text-sm text-gray-600">
          {signup
            ? "Enter your email to get started"
            : "Sign in to your account"}
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="email-address"
            className="block text-sm font-semibold text-gray-900 mb-2"
          >
            Email Address
          </label>
          <div className="relative">
            <input
              id="email-address"
              name="email-address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="you@example.com"
              className="block w-full rounded-xl border-0 bg-gray-50 px-4 py-3.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 focus:bg-white transition-all duration-200 sm:text-sm sm:leading-6"
              disabled={loading}
            />
          </div>

          {isValidEmail(email) && !otpShow && (
            <button
              type="button"
              onClick={handleSendClick}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-98 transition-all duration-200 disabled:cursor-not-allowed disabled:bg-blue-300 disabled:scale-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Send Verification Code</span>
                </>
              )}
            </button>
          )}

          {otpShow && (
            <div className="mt-6 space-y-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Verification Code
                </p>
                <p className="text-xs text-gray-600">
                  Enter the 6-digit code sent to {email}
                </p>
              </div>
              <div className="flex justify-center gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    maxLength={1}
                    value={digit}
                    onChange={(event) =>
                      handleOtpChange(index, event.target.value)
                    }
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="h-12 w-12 rounded-xl border-2 border-gray-300 bg-white text-center text-lg font-bold text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-200"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleSendClick}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Resend code
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          className={`w-full flex items-center justify-center rounded-xl px-8 py-3.5 text-base font-semibold transition-all duration-200 ${
            !canSubmit
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-98 shadow-sm"
          }`}
          disabled={!canSubmit}
        >
          {signup ? "Create Account" : "Sign In"}
        </button>
      </form>
    </div>
  );
};

export default AquaAuthMobileForm;
