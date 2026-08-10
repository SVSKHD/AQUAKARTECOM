// The backend returns `firstName`/`lastName` for Google logins and `name` for
// the legacy OTP logins, so every surface has to read both.
export const getUserDisplayName = (user, fallback = "") => {
  if (!user) return fallback;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return (
    fullName.trim() ||
    (user.name || "").trim() ||
    (user.email || "").split("@")[0] ||
    fallback
  );
};

export const getUserInitials = (user, fallback = "A") => {
  const name = getUserDisplayName(user);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || fallback;
};

// A session created through Firebase — the only kind Firebase can invalidate.
export const isGoogleSession = (session) =>
  Boolean(session?.user?.firebaseUid) ||
  session?.user?.authProvider === "google.com" ||
  Boolean(session?.user?.isGoogleLogin);
