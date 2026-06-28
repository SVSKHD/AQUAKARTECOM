import UserServiceOperations from "@/services/user";
import useDialog from "@/utils/dialog";
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import AquaToast from "@/components/reusables/react-toastify";
import { Loader2, MessageCircle } from "lucide-react";

const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.otpMessage ||
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const AquaAuthMobileForm = ({ signup }) => {
  const [phone, setPhone] = useState("");
  const [otpShow, setOtpShow] = useState(false);
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const { closeAuthDialog } = useDialog();
  const dispatch = useDispatch();
  const inputRefs = useRef([]);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const isValidPhone = (val) => /^\d{10}$/.test(val);

  const handlePhoneChange = (e) => {
    const newPhone = e.target.value.replace(/\D/g, "");
    if (newPhone.length <= 10) {
      setPhone(newPhone);
      setOtpShow(false);
      setOtpDigits(Array(6).fill(""));
    }
  };

  const handleSendOtp = () => {
    if (!isValidPhone(phone) || isSendingOtp) return;

    setIsSendingOtp(true);

    UserServiceOperations.UserMobileOtp({ phone })
      .then((res) => {
        setOtpShow(true);
        setOtpDigits(Array(6).fill(""));
        AquaToast({
          message: res?.data?.otpMessage || "OTP sent successfully",
          type: "success",
        });
        dispatch({
          type: "SET_AUTH_STATUS_VISIBLE",
          payload: !res.data.userExist,
        });
        setTimeout(() => inputRefs.current?.[0]?.focus(), 100);
      })
      .catch((error) => {
        setOtpShow(false);
        AquaToast({
          message: getApiErrorMessage(error, "Failed to send OTP"),
          type: "error",
        });
        dispatch({ type: "SET_AUTH_STATUS_VISIBLE", payload: false });
      })
      .finally(() => setIsSendingOtp(false));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const otpValue = otpDigits.join("");
    if (otpValue.length !== 6 || verifying) return;

    setVerifying(true);

    const otpPromise = UserServiceOperations.UserMobileVerify({
      phone,
      otp: otpValue,
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), 15000),
    );

    Promise.race([otpPromise, timeoutPromise])
      .then((res) => {
        AquaToast({ message: "Verification successful", type: "success" });
        dispatch({ type: "LOGGED_IN_USER", payload: res.data });
        closeAuthDialog();
      })
      .catch((err) => {
        AquaToast({
          message:
            err.message === "Request timed out"
              ? "Server is taking too long. Please try again."
              : getApiErrorMessage(err, "Verification failed"),
          type: "error",
        });
      })
      .finally(() => setVerifying(false));
  };

  const handleOtpChange = (index, value) => {
    const sanitized = value.replace(/\D/g, "");
    if (sanitized.length > 1) {
      const updated = [...otpDigits];
      let cur = index;
      sanitized.split("").forEach((c) => {
        if (cur < 6) {
          updated[cur] = c;
          cur++;
        }
      });
      setOtpDigits(updated);
      inputRefs.current[Math.min(cur, 5)]?.focus();
      return;
    }

    const updated = [...otpDigits];
    if (!sanitized) {
      updated[index] = "";
      setOtpDigits(updated);
      return;
    }

    updated[index] = sanitized.charAt(sanitized.length - 1);
    setOtpDigits(updated);
    if (index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const updated = [...otpDigits];
      if (updated[index]) {
        updated[index] = "";
        setOtpDigits(updated);
      } else if (index > 0) {
        updated[index - 1] = "";
        setOtpDigits(updated);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    setOtpDigits(
      Array(6)
        .fill("")
        .map((_, i) => pasted[i] || ""),
    );
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const canSubmit = otpShow && otpDigits.every((d) => d !== "");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="phone-number"
          className="block text-xs font-semibold text-slate-600 mb-1.5"
        >
          Phone Number
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <span className="text-xs font-semibold text-slate-500">+91</span>
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
            className="block w-full rounded-xl border border-white/50 bg-white/40 pl-11 pr-3.5 py-3 text-base text-slate-900 placeholder:text-slate-400 backdrop-blur-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all"
            autoComplete="tel"
          />
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <MessageCircle className="h-3.5 w-3.5 text-green-600" />
          <p className="text-[11px] text-slate-400">
            WhatsApp OTP verification
          </p>
        </div>
      </div>

      {isValidPhone(phone) && !otpShow && (
        <button
          type="button"
          onClick={handleSendOtp}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-green-600/20 transition-all hover:bg-green-500 active:scale-[0.97] disabled:opacity-50"
          disabled={isSendingOtp}
        >
          {isSendingOtp ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending...
            </>
          ) : (
            <>
              <MessageCircle className="h-4 w-4" /> Send OTP via WhatsApp
            </>
          )}
        </button>
      )}

      {otpShow && (
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-700">
              Enter 6-digit code
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Sent to +91 {phone}
            </p>
          </div>
          <div className="flex gap-1.5 justify-center">
            {otpDigits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={i === 0 ? handleOtpPaste : undefined}
                placeholder="·"
                className="w-10 h-11 rounded-lg border border-white/50 bg-white/40 text-center text-lg font-bold text-slate-900 placeholder:text-slate-300 backdrop-blur-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={isSendingOtp}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSendingOtp ? "Sending..." : "Resend code"}
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit || verifying}
        className={`w-full flex items-center justify-center rounded-xl py-3 text-sm font-bold transition-all ${
          canSubmit && !verifying
            ? "btn-glass-primary shadow-lg"
            : "bg-slate-100/60 text-slate-400 cursor-not-allowed"
        }`}
      >
        {verifying ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
          </span>
        ) : signup ? (
          "Create Account"
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
};

export default AquaAuthMobileForm;
