import UserServiceOperations from "@/services/user";
import useDialog from "@/utils/dialog";
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import Image from "next/image";
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
          {signup ? "Sign up with phone" : "Sign in with phone"}
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="phone-number"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Phone No:
            </label>
            <div className="relative mt-2 rounded-md shadow-sm">
              <input
                id="phone-number"
                name="phone-number"
                maxLength="10"
                type="text"
                inputMode="numeric"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Enter 10-digit phone number"
                className="block w-full rounded-md border-0 bg-white p-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
            <span className="mt-2 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
              WhatsApp OTP only (SMS coming soon)
            </span>
            {isValidPhone(phone) && !otpShow && (
              <button
                type="button"
                onClick={handleSendOtp}
                className="mt-4 flex w-full items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                disabled={isSendingOtp}
              >
                {isSendingOtp ? "Sending..." : "Send WhatsApp OTP"}
              </button>
            )}
            {otpShow && (
              <div className="mt-6 flex justify-center gap-3">
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
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="h-12 w-12 rounded-md border border-gray-300 text-center text-lg font-semibold text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ))}
              </div>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Please ensure your phone number is associated with WhatsApp.
            </p>
          </div>

          <div>
            <button
              type="submit"
              className={`mt-2 flex w-full items-center justify-center rounded-md border border-transparent px-8 py-3 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                canSubmit
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-gray-400 cursor-not-allowed"
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
