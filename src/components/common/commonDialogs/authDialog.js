import { useState } from "react";
import AquaResponsiveDialog from "@/components/reusables/dialog";
import { useSelector, useDispatch } from "react-redux";
import { Mail, Smartphone } from "lucide-react";
import AquaAuthEmailForm from "./commonAuth/authFrom";
import AquaAuthPhoneForm from "./commonAuth/mobileOtp";

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

        {authMethod === "email" ? (
          <AquaAuthEmailForm signup={userSignupStatus} />
        ) : (
          <AquaAuthPhoneForm signup={userSignupStatus} />
        )}

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
