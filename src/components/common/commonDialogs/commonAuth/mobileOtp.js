import UserServiceOperations from "@/services/user";
import useDialog from "@/utils/dialog";
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import AquaToast from "@/components/reusables/react-toastify";
import { Loader2 } from "lucide-react";

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
    AquaToast({ message: "Sending WhatsApp OTP...", type: "info" });

    UserServiceOperations.UserMobileOtp({ phone })
      .then((res) => {
        setOtpShow(true);
        AquaToast({ message: "OTP sent successfully", type: "success" });
        dispatch({
          type: "SET_AUTH_STATUS_VISIBLE",
          payload: !res.data.userExist,
        });
        setTimeout(() => inputRefs.current?.[0]?.focus(), 100);
      })
      .catch(() => {
        setOtpShow(false);
        AquaToast({ message: "Failed to send OTP", type: "error" });
        dispatch({ type: "SET_AUTH_STATUS_VISIBLE", payload: false });
      })
      .finally(() => setIsSendingOtp(false));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const otpValue = otpDigits.join("");
    if (otpValue.length !== 6) return;
    setVerifying(true);

    const otpPromise = UserServiceOperations.UserMobileVerify({
      phone: Number(phone),
      otp: Number(otpValue),
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
              : "Verification failed",
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
      {/* Phone input */}
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
            className="block w-full rounded-xl border border-white/50 bg-white/40 pl-11 pr-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 backdrop-blur-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all"
            autoComplete="tel"
          />
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 text-green-600 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          <p className="text-[11px] text-slate-400">
            WhatsApp OTP verification
          </p>
        </div>
      </div>

      {/* Send OTP button */}
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
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Send OTP via WhatsApp
            </>
          )}
        </button>
      )}

      {/* OTP section */}
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
            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
          >
            Resend code
          </button>
        </div>
      )}

      {/* Submit */}
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
