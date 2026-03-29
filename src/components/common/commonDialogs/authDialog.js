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
    authDialog: state.authDialog,
    userSignupStatus: state.userSignupStatus,
  }));

  const closeDialog = () => {
    dispatch({ type: "SET_AUTH_DIALOG_VISIBLE", payload: false });
  };

  return (
    <AquaResponsiveDialog open={authDialog} close={closeDialog}>
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative h-9 w-9 flex-shrink-0 rounded-xl bg-white/60 p-1.5 shadow-sm">
            <Image
              src={AquaLogo}
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              {userSignupStatus ? "Welcome back" : "Join Aquakart"}
            </h2>
            <p className="text-[11px] text-slate-400">
              Secure access to your water solutions
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div className="mb-4 rounded-xl glass-subtle p-1 flex relative">
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow-sm transition-all duration-300 ease-out left-1 ${
              authMethod === "phone" ? "translate-x-full" : ""
            } bg-gradient-to-r from-emerald-500 to-teal-500`}
          />
          <button
            type="button"
            onClick={() => setAuthMethod("email")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-colors ${
              authMethod === "email" ? "text-white" : "text-slate-500"
            }`}
          >
            <Mail size={14} /> Email
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod("phone")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-colors ${
              authMethod === "phone" ? "text-white" : "text-slate-500"
            }`}
          >
            <Smartphone size={14} /> Phone
          </button>
        </div>

        {/* Forms */}
        <div className="relative min-h-[220px]">
          <div
            className={`transition-all duration-300 ${
              authMethod === "email"
                ? "opacity-100 relative z-10"
                : "opacity-0 pointer-events-none absolute inset-0 z-0 invisible"
            }`}
          >
            <AquaAuthEmailForm signup={userSignupStatus} />
          </div>
          <div
            className={`transition-all duration-300 ${
              authMethod === "phone"
                ? "opacity-100 relative z-10"
                : "opacity-0 pointer-events-none absolute inset-0 z-0 invisible"
            }`}
          >
            <AquaAuthPhoneForm signup={userSignupStatus} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100/60 text-center">
          <p className="text-xs text-slate-400">
            {userSignupStatus ? "No account yet?" : "Already have an account?"}
            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: "SET_AUTH_STATUS_VISIBLE",
                  payload: !userSignupStatus,
                })
              }
              className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors ml-1"
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
