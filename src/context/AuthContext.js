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
  checkBackendSession,
  completeGoogleRedirectLogin,
  loginWithGoogle,
  observeGoogleAuthState,
  renewGoogleSession,
  restoreExistingGoogleLogin,
  signOutEverywhere,
} from "@/services/googleAuth";
import { isGoogleSession } from "@/utils/user";

const AuthContext = createContext(null);
const AUTH_RESTORE_TIMEOUT_MS = 12_000;
// redux-persist rehydrates after mount; the restore waits for the stored
// session this long at most (storage blocked or slow).
const STORED_SESSION_WAIT_MS = 1_500;
const RETURN_PATH_KEY = "aquakart_auth_return_to";

const restoreGoogleLogin = (storedSession) =>
  Promise.race([
    completeGoogleRedirectLogin().then(
      (redirectResult) =>
        redirectResult || restoreExistingGoogleLogin(storedSession),
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
  const rehydrated = useSelector((state) => state._persist?.rehydrated);
  const [storageWaitOver, setStorageWaitOver] = useState(false);
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
    const timer = setTimeout(
      () => setStorageWaitOver(true),
      STORED_SESSION_WAIT_MS,
    );
    return () => clearTimeout(timer);
  }, []);

  // The stored session was reused: confirm it in the background (the page is
  // already usable). Refused (expired or signed out elsewhere) → renew it from
  // the Google sign-in, or end it; offline → keep it.
  const confirmStoredSession = useCallback(
    async (token) => {
      const check = await checkBackendSession(token);
      if (signedOutRef.current || sessionRef.current?.token !== token) return;
      if (check.state === "ok") {
        if (check.user)
          dispatch({ type: "UPDATE_USER_DETAILS", payload: check.user });
        return;
      }
      if (check.state !== "invalid") return;
      const renewed = await renewGoogleSession().catch(() => null);
      if (signedOutRef.current) return;
      if (renewed) dispatch({ type: "LOGGED_IN_USER", payload: renewed });
      else dispatch({ type: "LOGOUT", payload: null });
    },
    [dispatch],
  );

  // Runs once the stored session is back from storage (or the wait is over),
  // so a still-valid session is reused instead of signing in again.
  useEffect(() => {
    if (redirectChecked.current || !(rehydrated || storageWaitOver))
      return undefined;
    redirectChecked.current = true;
    let active = true;
    const stored = sessionRef.current;
    restoreGoogleLogin(stored)
      .then((result) => {
        // A sign-out that landed while the restore was in flight must win,
        // otherwise the resolved session logs the user straight back in.
        if (!active || !result || signedOutRef.current) return null;
        if (result.reused) {
          signedOutRef.current = false;
          void confirmStoredSession(stored.token);
          return null;
        }
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
  }, [applyLoginResult, confirmStoredSession, rehydrated, storageWaitOver]);

  // A new Aquakart session from the Google sign-in Firebase still holds, when
  // the backend refused the current one (a page saw a 401). Null when Firebase
  // is signed out too: the shopper has to sign in again.
  const refreshSession = useCallback(async () => {
    const renewed = await renewGoogleSession().catch(() => null);
    if (!renewed || signedOutRef.current) return null;
    dispatch({ type: "LOGGED_IN_USER", payload: renewed });
    return renewed;
  }, [dispatch]);

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
      toast.error(error.message || "Unable to continue with Google");
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

      // Google auto sign-in off, Firebase cleared (or the next page load signs
      // the user back in), the backend token cancelled, this tab's data gone.
      await signOutEverywhere(token);

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
      refreshSession,
      signOut,
    }),
    [
      adoptGoogleSession,
      refreshSession,
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
