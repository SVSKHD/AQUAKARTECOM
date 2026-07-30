import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  loginWithGoogle,
  logoutBackendUser,
  logoutGoogleUser,
} from "@/services/googleAuth";

const AuthContext = createContext(null);

const safeReturnPath = (value) =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/";

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const session = useSelector((state) => state.userData);
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    const returnPath = safeReturnPath(
      router.query.returnUrl ||
        window.sessionStorage.getItem("aquakart_auth_return_to") ||
        router.asPath,
    );

    try {
      const result = await loginWithGoogle();
      dispatch({ type: "LOGGED_IN_USER", payload: result });
      dispatch({ type: "SET_AUTH_DIALOG_VISIBLE", payload: false });
      window.sessionStorage.removeItem("aquakart_auth_return_to");
      toast.success(result.message);

      if (returnPath !== router.asPath) {
        await router.replace(returnPath);
      }

      return result;
    } catch (error) {
      toast.error(error.message || "Unable to continue with Google");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [dispatch, router]);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await logoutBackendUser(session?.token);
    } finally {
      await logoutGoogleUser().catch(() => {});
      dispatch({ type: "LOGOUT", payload: null });
      setLoading(false);
      await router.push("/");
    }
  }, [dispatch, router, session?.token]);

  const value = useMemo(
    () => ({
      authenticated: Boolean(session?.token),
      loading,
      session,
      signInWithGoogle,
      signOut,
    }),
    [loading, session, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
};
