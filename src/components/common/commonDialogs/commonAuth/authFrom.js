import UserServiceOperations from "@/services/user";
import useDialog from "@/utils/dialog";
import { useState, useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import AquaToast from "@/components/reusables/react-toastify";
import Image from "next/image";
import debounce from "lodash.debounce";
import { showToast } from "@/store/reducers/toastReducer";

const AquaAuthMobileForm = ({ signup }) => {
  const [email, setEmail] = useState("");
  const [otpShow, setOtpShow] = useState(false);
  const [otp, setOtp] = useState("");
  const { closeAuthDialog } = useDialog();
  const dispatch = useDispatch();

  const handleKeyDown = (event) => {
    if (event.key === "Backspace") {
      console.log("Backspace pressed");
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Debounced request for OTP
  const requestOtp = useCallback(
    debounce((newEmail) => {
      if (isValidEmail(newEmail)) {
        dispatch(showToast("First message", "success"));
        AquaToast({
          message: "OTP in Air. Please wait...",
          type: "info",
        });
        UserServiceOperations.UserEmailOtp({ email: newEmail })
          .then((res) => {
            setOtpShow(true);
            AquaToast({
              message: "Successfully sent OTP",
              type: "success",
            });
            dispatch({
              type: "SET_AUTH_STATUS_VISIBLE",
              payload: !res.data.userExist,
            });
          })
          .catch((err) => {
            setOtpShow(false);
            AquaToast({
              message: "Failed to send OTP",
              type: "error",
            });
            dispatch({
              type: "SET_AUTH_STATUS_VISIBLE",
              payload: false,
            });
          });
      } else {
        setOtpShow(false);
      }
    }, 300),
    [],
  );

  const handleEmailChange = (e) => {
    const newEmail = e.target.value.trim(); // Trim any leading/trailing spaces
    setEmail(newEmail);

    if (newEmail === "" || !isValidEmail(newEmail)) {
      setOtpShow(false); // Hide OTP input if email is invalid or empty
      return;
    }

    requestOtp(newEmail); // Initiate OTP only for valid and non-empty email
  };

  // Cancel any pending debounced OTP requests when email is cleared
  useEffect(() => {
    if (!email) {
      requestOtp.cancel();
    }
  }, [email, requestOtp]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = { email, otp: Number(otp) };
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email-address"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Email Address
            </label>
            <div className="relative mt-2 rounded-md shadow-sm">
              <input
                id="email-address"
                name="email-address"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onKeyDown={handleKeyDown}
                placeholder="example@example.com"
                className="block w-full p-4 rounded-md border-0 py-1.5 pr-10 text-gray-900 bg-white text-gray-700 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
            {otpShow && (
              <>
                <h4 className="mt-4 text-sm font-medium text-gray-900">
                  Enter the OTP sent to your email
                </h4>
                <div className="relative mt-4 grid grid-cols-6 gap-2">
                  {[...Array(6)].map((_, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="_"
                      maxLength={1}
                      value={otp[idx] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, ""); // Only allow digits
                        if (val.length <= 1) {
                          const newOtp = otp.split("");
                          newOtp[idx] = val;
                          setOtp(newOtp.join(""));
                          if (val && idx < 5) {
                            document.getElementById(`otp-${idx + 1}`).focus();
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otp[idx] && idx > 0) {
                          document.getElementById(`otp-${idx - 1}`).focus();
                        }
                      }}
                      className="w-12 h-12 text-center text-lg font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
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
                !otpShow
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
              disabled={!otpShow}
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
