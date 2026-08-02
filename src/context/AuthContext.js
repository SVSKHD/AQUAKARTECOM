import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  completeGoogleRedirectLogin,
  loginWithGoogle,
  logoutBackendUser,
  logoutGoogleUser,
  restoreExistingGoogleLogin,
} from "@/services/googleAuth";

const AuthContext = createContext(null);
const AUTH_RESTORE_TIMEOUT_MS = 12_000;

const restoreGoogleLogin = () =>
  Promise.race([
    completeGoogleRedirectLogin().then(
      (redirectResult) => redirectResult || restoreExistingGoogleLogin(),
    ),
    new Promise((resolve) =>
      setTimeout(() => resolve(null), AUTH_RESTORE_TIMEOUT_MS),
    ),
  ]);

const safeReturnPath = (value) =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/";

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const session = useSelector((state) => state.userData);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const redirectChecked = useRef(false);

  const applyLoginResult = useCallback(
    async (result, requestedReturnPath, showSuccess = true) => {
      if (!result || result.redirecting) return result;
      dispatch({ type: "LOGGED_IN_USER", payload: result });
      dispatch({ type: "SET_AUTH_DIALOG_VISIBLE", payload: false });
      const storedReturnPath =
        typeof window === "undefined"
          ? ""
          : window.sessionStorage.getItem("aquakart_auth_return_to");
      const returnPath = safeReturnPath(
        requestedReturnPath || storedReturnPath || router.asPath,
      );
      window.sessionStorage.removeItem("aquakart_auth_return_to");
      if (showSuccess) toast.success(result.message);

      if (returnPath !== router.asPath) {
        await router.replace(returnPath);
      }
      return result;
    },
    [dispatch, router],
  );

  useEffect(() => {
    if (redirectChecked.current) return undefined;
    redirectChecked.current = true;
    let active = true;
    restoreGoogleLogin()
      .then((result) => {
        if (!active || !result) return null;
        return applyLoginResult(result, undefined, false);
      })
      .catch((error) => {
        if (active) {
          toast.error(error.message || "Unable to complete Google login");
        }
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => {
      active = false;
    };
  }, [applyLoginResult]);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    const returnPath = safeReturnPath(
      router.query.returnUrl ||
        window.sessionStorage.getItem("aquakart_auth_return_to") ||
        router.asPath,
    );
    window.sessionStorage.setItem("aquakart_auth_return_to", returnPath);

    try {
      const result = await loginWithGoogle();
      return applyLoginResult(result, returnPath);
    } catch (error) {
      toast.error(error.message || "Unable to continue with Google");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [applyLoginResult, router]);

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
      authReady,
      loading: loading || !authReady,
      session,
      signInWithGoogle,
      switchGoogleAccount: signInWithGoogle,
      signOut,
    }),
    [authReady, loading, session, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
};
