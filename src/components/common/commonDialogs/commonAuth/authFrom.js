import UserServiceOperations from "@/services/user";
import useDialog from "@/utils/dialog";
import { useState, useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import AquaToast from "@/components/reusables/react-toastify";
import debounce from "lodash.debounce";
import { Send, Loader2 } from "lucide-react";

const AquaAuthEmailForm = ({ signup }) => {
  const [email, setEmail] = useState("");
  const [otpShow, setOtpShow] = useState(false);
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const { closeAuthDialog } = useDialog();
  const dispatch = useDispatch();
  const inputRefs = useRef([]);
  const [verifying, setVerifying] = useState(false);

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const requestOtp = useCallback(
    debounce((emailToSend) => {
      if (!isValidEmail(emailToSend)) {
        AquaToast({ message: "Invalid email address!", type: "error" });
        return;
      }
      setLoading(true);
      AquaToast({ message: "Sending OTP...", type: "info" });

      UserServiceOperations.UserEmailOtp({ email: emailToSend })
        .then((res) => {
          setOtpDigits(Array(6).fill(""));
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
        })
        .finally(() => setLoading(false));
    }, 300),
    [dispatch],
  );

  const handleSendClick = () => {
    if (!email || !isValidEmail(email) || loading) return;
    setOtpShow(false);
    setOtpDigits(Array(6).fill(""));
    requestOtp(email);
  };

  useEffect(() => {
    if (!email) requestOtp.cancel();
  }, [email, requestOtp]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const otpValue = otpDigits.join("");
    if (!otpShow || otpValue.length !== 6) return;
    setVerifying(true);

    const otpPromise = UserServiceOperations.UserEmailVerify({
      email,
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
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Email input */}
      <div>
        <label
          htmlFor="email-address"
          className="block text-xs font-semibold text-slate-600 mb-1.5"
        >
          Email Address
        </label>
        <input
          id="email-address"
          name="email-address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="block w-full rounded-xl border border-white/50 bg-white/40 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 backdrop-blur-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all"
          disabled={loading}
          autoComplete="email"
        />
      </div>

      {/* Send OTP button */}
      {isValidEmail(email) && !otpShow && (
        <button
          type="button"
          onClick={handleSendClick}
          className="btn-glass btn-glass-primary w-full flex items-center justify-center gap-2 py-3"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Send Verification Code
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
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              Sent to {email}
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
                autoComplete="one-time-code"
                maxLength={1}
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
            onClick={handleSendClick}
            disabled={loading}
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

export default AquaAuthEmailForm;
