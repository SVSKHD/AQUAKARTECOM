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
  friendlyGoogleAuthError,
  loginWithGoogle,
  logoutBackendUser,
  logoutGoogleUser,
  observeGoogleAuthState,
  restoreExistingGoogleLogin,
} from "@/services/googleAuth";
import { isGoogleSession } from "@/utils/user";

const AuthContext = createContext(null);
const AUTH_RESTORE_TIMEOUT_MS = 12_000;
const RETURN_PATH_KEY = "aquakart_auth_return_to";

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
  const signedOutRef = useRef(false);
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const applyLoginResult = useCallback(
    async (result, requestedReturnPath, showSuccess = true) => {
      if (!result || result.redirecting) return result;
      signedOutRef.current = false;
      dispatch({ type: "LOGGED_IN_USER", payload: result });
      dispatch({ type: "SET_AUTH_DIALOG_VISIBLE", payload: false });
      const storedReturnPath =
        typeof window === "undefined"
          ? ""
          : window.sessionStorage.getItem(RETURN_PATH_KEY);
      const returnPath = safeReturnPath(
        requestedReturnPath || storedReturnPath || router.asPath,
      );
      window.sessionStorage.removeItem(RETURN_PATH_KEY);
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
        // A sign-out that landed while the restore was in flight must win,
        // otherwise the resolved session logs the user straight back in.
        if (!active || !result || signedOutRef.current) return null;
        return applyLoginResult(result, undefined, false);
      })
      .catch((error) => {
        if (active) {
          toast.error(friendlyGoogleAuthError(error));
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
        window.sessionStorage.getItem(RETURN_PATH_KEY) ||
        router.asPath,
    );
    window.sessionStorage.setItem(RETURN_PATH_KEY, returnPath);

    try {
      const result = await loginWithGoogle();
      return applyLoginResult(result, returnPath);
    } catch (error) {
      toast.error(friendlyGoogleAuthError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [applyLoginResult, router]);

  const adoptGoogleSession = useCallback(
    (result) => applyLoginResult(result, router.asPath, false),
    [applyLoginResult, router.asPath],
  );

  const signOut = useCallback(
    async ({ redirectTo = "/", notify = true } = {}) => {
      const token = sessionRef.current?.token;
      signedOutRef.current = true;
      setLoading(true);

      // Clear Firebase first: while its session lives, the restore on the next
      // page load re-exchanges the ID token and signs the user back in.
      await logoutGoogleUser().catch((error) => {
        console.error("Firebase sign-out failed", error);
      });
      await logoutBackendUser(token).catch((error) => {
        console.error("Backend sign-out failed", error);
      });

      dispatch({ type: "LOGOUT", payload: null });
      dispatch({ type: "SET_AUTH_DIALOG_VISIBLE", payload: false });
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(RETURN_PATH_KEY);
      }

      setLoading(false);
      if (notify) toast.success("Signed out successfully");
      if (redirectTo) await router.push(redirectTo);
    },
    [dispatch, router],
  );

  // Firebase is the source of truth for Google sessions. If it drops the user
  // (other tab, revoked credentials, cleared storage), drop the Redux session
  // too so the UI can never show a signed-in state Firebase disagrees with.
  useEffect(() => {
    return observeGoogleAuthState((firebaseUser) => {
      if (firebaseUser) {
        signedOutRef.current = false;
        return;
      }
      // Not signedOutRef: an in-flight redirect login must still be allowed to
      // land. Firebase reports no user until getRedirectResult resolves.
      if (isGoogleSession(sessionRef.current)) {
        dispatch({ type: "LOGOUT", payload: null });
      }
    });
  }, [dispatch]);

  const value = useMemo(
    () => ({
      authenticated: Boolean(session?.token),
      authReady,
      loading: loading || !authReady,
      session,
      user: session?.user ?? null,
      signInWithGoogle,
      switchGoogleAccount: signInWithGoogle,
      adoptGoogleSession,
      signOut,
    }),
    [
      adoptGoogleSession,
      authReady,
      loading,
      session,
      signInWithGoogle,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
};
