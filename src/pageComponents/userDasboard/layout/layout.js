import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { LockKeyhole } from "lucide-react";
import AquaCartAddressDialog from "@/components/common/commonDialogs/cartAddress";
import AquaUserAuthDialog from "@/components/common/commonDialogs/authDialog";
import { useAuth } from "@/context/AuthContext";
import useDialog from "@/utils/dialog";
import { DashboardMobileNav, DashboardSidebar } from "./header";

const ROUTE_COPY = {
  "/dashboard": {
    title: "Overview",
    subtitle: "Your orders, cart and saved products in one place.",
  },
  "/dashboard/profile": {
    title: "Profile",
    subtitle: "Review and update your personal details.",
  },
  "/dashboard/settings": {
    title: "Settings",
    subtitle: "Manage your account and get help.",
  },
  "/dashboard/orders": {
    title: "Orders",
    subtitle: "Track every purchase and its delivery status.",
  },
  "/dashboard/cart": {
    title: "Cart",
    subtitle: "Review your items and check out when you're ready.",
  },
  "/dashboard/fav": {
    title: "Saved items",
    subtitle: "Products you've saved for later.",
  },
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const ContentSkeleton = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading your account">
    <div className="aqua-shimmer-block h-28 rounded-3xl" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="aqua-shimmer-block h-24 rounded-2xl" />
      ))}
    </div>
    <div className="aqua-shimmer-block h-64 rounded-3xl" />
  </div>
);

const SignInPrompt = ({ onSignIn }) => (
  <div className="mx-auto mt-10 max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center">
    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
      <LockKeyhole className="h-6 w-6" aria-hidden="true" />
    </span>
    <h2 className="mt-5 text-xl font-black text-slate-950">
      Sign in to view your account
    </h2>
    <p className="mt-2 text-sm leading-6 text-slate-500">
      Track orders, manage your cart and keep your saved products in sync across
      devices.
    </p>
    <button
      type="button"
      onClick={onSignIn}
      className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
    >
      Sign in
    </button>
  </div>
);

const AquaUserDashbordLayout = ({ children, title, subtitle, actions }) => {
  const router = useRouter();
  const userData = useSelector((state) => state.userData);
  const cartData = useSelector((state) => state.cartData);
  const favData = useSelector((state) => state.favData);
  // redux-persist restores the saved session after mount; until then the user
  // is unknown, not signed out.
  const rehydrated = useSelector((state) =>
    Boolean(state._persist?.rehydrated),
  );
  const { signOut } = useAuth();
  const { openAuthDialog } = useDialog();

  const routeMeta = ROUTE_COPY[router.pathname] || ROUTE_COPY["/dashboard"];
  const resolvedTitle = title || routeMeta.title;
  const resolvedSubtitle = subtitle || routeMeta.subtitle;
  const user = userData?.user;
  const counts = {
    cart: ensureArray(cartData).reduce(
      (units, item) => units + (item?.quantity || 1),
      0,
    ),
    fav: ensureArray(favData).length,
  };

  let content;
  if (!rehydrated) content = <ContentSkeleton />;
  else if (!user) content = <SignInPrompt onSignIn={openAuthDialog} />;
  else content = children;

  return (
    <div data-dashboard-shell className="min-h-screen bg-slate-50">
      <AquaCartAddressDialog />
      <AquaUserAuthDialog />
      <div className="mx-auto flex w-full max-w-[1320px] gap-6 px-4 pb-28 sm:px-6 lg:py-4 lg:pb-10">
        {user && (
          <DashboardSidebar
            pathname={router.pathname}
            user={user}
            counts={counts}
            onSignOut={() => signOut()}
          />
        )}

        <main className="min-w-0 flex-1">
          {user && (
            <DashboardMobileNav
              pathname={router.pathname}
              user={user}
              counts={counts}
              title={resolvedTitle}
            />
          )}

          {user && (
            <header className="mb-5 hidden items-end justify-between gap-4 lg:mt-3 lg:flex">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950">
                  {resolvedTitle}
                </h1>
                {resolvedSubtitle && (
                  <p className="mt-1 text-sm text-slate-500">
                    {resolvedSubtitle}
                  </p>
                )}
              </div>
              {actions}
            </header>
          )}
          {user && actions && <div className="mb-4 lg:hidden">{actions}</div>}

          <div
            key={router.pathname}
            className="animate-[dashboard-tab-in_180ms_cubic-bezier(0.22,1,0.36,1)]"
          >
            {content}
          </div>
        </main>
      </div>
      <style jsx global>{`
        @keyframes dashboard-tab-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="dashboard-tab-in"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AquaUserDashbordLayout;
