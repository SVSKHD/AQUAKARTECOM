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
      <div className="w-full max-w-sm mx-auto">
        {/* Minimal Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative h-10 w-10 mb-2">
            <Image
              src={AquaLogo}
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {userSignupStatus ? "Welcome Back" : "Join Aquakart"}
          </h2>
          <p className="text-xs text-slate-500">
            Secure access to your water solutions
          </p>
        </div>

        {/* Sleek Toggle Switch */}
        <div className="mb-6 rounded-lg bg-slate-100 p-1 flex relative">
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-md shadow-sm transition-all duration-300 ease-out left-1 ${authMethod === "phone" ? "translate-x-full" : ""}`}
          />
          <button
            onClick={() => setAuthMethod("email")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              authMethod === "email"
                ? "text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Mail size={14} /> Email
          </button>
          <button
            onClick={() => setAuthMethod("phone")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              authMethod === "phone"
                ? "text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Smartphone size={14} /> Phone
          </button>
        </div>

        {/* Content Area */}
        <div className="grid min-h-[280px] relative">
          <div
            className={`row-start-1 col-start-1 transition-all duration-300 ${
              authMethod === "email"
                ? "opacity-100 scale-100 relative z-10"
                : "opacity-0 scale-95 pointer-events-none absolute inset-0 z-0 invisible"
            }`}
          >
            <AquaAuthEmailForm signup={userSignupStatus} />
          </div>
          <div
            className={`row-start-1 col-start-1 transition-all duration-300 ${
              authMethod === "phone"
                ? "opacity-100 scale-100 relative z-10"
                : "opacity-0 scale-95 pointer-events-none absolute inset-0 z-0 invisible"
            }`}
          >
            <AquaAuthPhoneForm signup={userSignupStatus} />
          </div>
        </div>

        {/* Footer Toggle */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            {userSignupStatus ? "No account yet?" : "Already have an account?"}{" "}
            <button
              onClick={() =>
                dispatch({
                  type: "SET_AUTH_STATUS_VISIBLE",
                  payload: !userSignupStatus,
                })
              }
              className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors ml-1"
            >
              {userSignupStatus ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </AquaResponsiveDialog>
  );
};

export default AquaUserAuthDialog;
