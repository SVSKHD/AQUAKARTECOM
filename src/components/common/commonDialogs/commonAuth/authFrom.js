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
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <Image
          alt="Aquakart"
          src="https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png"
          className="mx-auto h-20 w-auto"
          width={100}
          height={100}
        />
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {signup ? "Sign up with email" : "Sign in with email"}
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email-address"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Email Address:
            </label>
            <div className="relative mt-2 rounded-md shadow-sm">
              <div className="relative w-full">
                <input
                  id="email-address"
                  name="email-address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} // Only updates state
                  onKeyDown={handleKeyDown}
                  placeholder="example@example.com"
                  className="block w-full rounded-md border-0 bg-white p-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  disabled={loading} // Disable input when loading
                />
              </div>
            </div>

            {isValidEmail(email) && !otpShow && (
              <button
                type="button"
                onClick={handleSendClick}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Email OTP</span>
                  </>
                )}
              </button>
            )}

            {otpShow && (
              <>
                <h4 className="mt-4 text-sm font-medium text-gray-900">
                  Enter the OTP sent to your email
                </h4>
                <div className="relative mt-4 grid grid-cols-6 gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      placeholder="_"
                      maxLength={1}
                      value={digit}
                      onChange={(event) =>
                        handleOtpChange(index, event.target.value)
                      }
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      className="h-12 w-12 rounded-md border-2 border-gray-300 bg-white text-center text-lg font-medium text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              className={`mt-6 flex w-full items-center justify-center rounded-md border border-transparent px-8 py-3 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                !canSubmit
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
              disabled={!canSubmit}
            >
              {signup ? "Sign Up" : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AquaAuthMobileForm;
