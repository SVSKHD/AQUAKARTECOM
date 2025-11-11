import UserServiceOperations from "@/services/user";
import useDialog from "@/utils/dialog";
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import AquaToast from "@/components/reusables/react-toastify";

const AquaAuthMobileForm = ({ signup }) => {
  const [phone, setPhone] = useState("");
  const [otpShow, setOtpShow] = useState(false);
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const { closeAuthDialog } = useDialog();
  const dispatch = useDispatch();
  const inputRefs = useRef([]);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const phoneFormat = Number(phone);
    const otpValue = otpDigits.join("");
    if (otpValue.length !== 6) {
      return;
    }
    const otpFormat = Number(otpValue);
    const data = { phone: phoneFormat, otp: otpFormat };
    UserServiceOperations.UserMobileVerify(data)
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

  const isValidPhone = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const handlePhoneChange = (e) => {
    const newPhone = e.target.value.replace(/\D/g, "");
    if (newPhone.length <= 10) {
      setPhone(newPhone);
      setOtpShow(false);
      setOtpDigits(Array(6).fill(""));
    }
  };

  const handleSendOtp = () => {
    if (!isValidPhone(phone) || isSendingOtp) {
      return;
    }

    setIsSendingOtp(true);
    AquaToast({
      message: "Sending WhatsApp OTP...",
      type: "info",
    });

    UserServiceOperations.UserMobileOtp({ phone })
      .then((res) => {
        setOtpShow(true);
        setIsSendingOtp(false);
        AquaToast({
          message: "OTP sent successfully",
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
        setIsSendingOtp(false);
        AquaToast({
          message: "Failed to send OTP",
          type: "error",
        });

        dispatch({
          type: "SET_AUTH_STATUS_VISIBLE",
          payload: false,
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="phone-number"
            className="block text-sm font-semibold text-gray-900 mb-2"
          >
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <span className="text-gray-500 text-sm">+91</span>
            </div>
            <input
              id="phone-number"
              name="phone-number"
              maxLength="10"
              type="text"
              inputMode="numeric"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="9876543210"
              className="block w-full rounded-xl border-0 bg-gray-50 pl-12 pr-4 py-3.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 focus:bg-white transition-all duration-200 sm:text-sm sm:leading-6"
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-shrink-0">
              <svg
                className="w-4 h-4 text-green-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
            <p className="text-xs text-gray-600">WhatsApp OTP verification</p>
          </div>

          {isValidPhone(phone) && !otpShow && (
            <button
              type="button"
              onClick={handleSendOtp}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 active:scale-98 transition-all duration-200 disabled:cursor-not-allowed disabled:bg-green-300 disabled:scale-100"
              disabled={isSendingOtp}
            >
              {isSendingOtp ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  <span>Send OTP via WhatsApp</span>
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
                  Enter the 6-digit code sent to +91 {phone}
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
                    pattern="[0-9]*"
                    maxLength="1"
                    placeholder="0"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="h-12 w-12 rounded-xl border-2 border-gray-300 bg-white text-center text-lg font-bold text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-200"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                disabled={isSendingOtp}
              >
                Resend code
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          className={`w-full flex items-center justify-center rounded-xl px-8 py-3.5 text-base font-semibold transition-all duration-200 ${
            canSubmit
              ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-98 shadow-sm"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
