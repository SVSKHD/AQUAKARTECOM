import { useState } from "react";
import Image from "next/image";
import AquaResponsiveDialog from "@/components/reusables/dialog";
import { useSelector, useDispatch } from "react-redux";
import { Mail, Smartphone } from "lucide-react";
import AquaAuthEmailForm from "./commonAuth/authFrom";
import AquaAuthPhoneForm from "./commonAuth/mobileOtp";
import AquaLogo from "@/assests/logo.png";

const AquaUserAuthDialog = () => {
  const [authMethod, setAuthMethod] = useState("email");
  const dispatch = useDispatch();
  const { authDialog, userSignupStatus } = useSelector((state) => ({
    ...state,
  }));

  const closeDialog = () => {
    dispatch({
      type: "SET_AUTH_DIALOG_VISIBLE",
      payload: false,
    });
  };

  return (
    <AquaResponsiveDialog open={authDialog} close={closeDialog}>
      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col items-center text-center mt-3 mb-6">
          <div className="relative w-20 h-20 rounded-3xl bg-blue-50 ring-4 ring-blue-100 shadow-inner flex items-center justify-center">
            <Image
              src={AquaLogo}
              alt="AquaKart logo"
              fill
              sizes="80px"
              className="object-contain p-2"
              priority
            />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-gray-900">AquaKart</h2>
          <p className="mt-1 text-sm text-gray-600 max-w-sm">
            Choose your preferred verification method to keep your account
            secure.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
            {authMethod === "email" ? (
              <>
                <Mail className="w-3.5 h-3.5" />
                Email verification
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                Phone verification
              </>
            )}
          </span>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center gap-3 p-1.5 bg-gray-100 rounded-xl">
            <button
              onClick={() => setAuthMethod("email")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                authMethod === "email"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </button>
            <button
              onClick={() => setAuthMethod("phone")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                authMethod === "phone"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Phone</span>
            </button>
          </div>
        </div>

        <div className="grid">
          <div
            className={`row-start-1 col-start-1 transition-opacity duration-300 ${
              authMethod === "email"
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={authMethod !== "email"}
            {...(authMethod === "email" ? {} : { inert: "true" })}
          >
            <AquaAuthEmailForm signup={userSignupStatus} />
          </div>
          <div
            className={`row-start-1 col-start-1 transition-opacity duration-300 ${
              authMethod === "phone"
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={authMethod !== "phone"}
            {...(authMethod === "phone" ? {} : { inert: "true" })}
          >
            <AquaAuthPhoneForm signup={userSignupStatus} />
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            {userSignupStatus ? (
              <>
                Already have an account?{" "}
                <button
                  onClick={() =>
                    dispatch({
                      type: "SET_AUTH_STATUS_VISIBLE",
                      payload: false,
                    })
                  }
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() =>
                    dispatch({
                      type: "SET_AUTH_STATUS_VISIBLE",
                      payload: true,
                    })
                  }
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign up
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </AquaResponsiveDialog>
  );
};

export default AquaUserAuthDialog;
