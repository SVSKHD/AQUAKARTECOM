import Image from "next/image";
import AquaResponsiveDialog from "@/components/reusables/dialog";
import { useSelector, useDispatch } from "react-redux";
import AquaLogo from "@/assests/logo.png";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

const AquaUserAuthDialog = () => {
  const dispatch = useDispatch();
  const authDialog = useSelector((state) => state.authDialog);

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
              Welcome to Aquakart
            </h2>
            <p className="text-[11px] text-slate-400">
              Secure access to your water solutions
            </p>
          </div>
        </div>

        <div className="py-4">
          <GoogleSignInButton />
          <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
            Google securely verifies your identity. Aquakart manages your
            profile, orders, and account access.
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100/60 text-center">
          <p className="text-xs text-slate-400">
            Phone number is collected only when you checkout.
          </p>
        </div>
      </div>
    </AquaResponsiveDialog>
  );
};

export default AquaUserAuthDialog;
