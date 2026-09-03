import AquaUserGreet from "./greet";
import AquaUserDashboardHeader from "./header";
import AquaCartAddressDialog from "@/components/common/commonDialogs/cartAddress";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";

const ROUTE_COPY = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Your Aquakart snapshot at a glance.",
  },
  "/dashboard/profile": {
    title: "Profile",
    subtitle: "Review and update your personal details.",
  },
  "/dashboard/settings": {
    title: "Settings",
    subtitle: "Fine-tune how you experience Aquakart.",
  },
  "/dashboard/orders": {
    title: "Orders",
    subtitle: "Track every purchase and its delivery status.",
  },
  "/dashboard/cart": {
    title: "Cart",
    subtitle: "Quick access to items waiting for checkout.",
  },
  "/dashboard/fav": {
    title: "Favourites",
    subtitle: "All the products you've saved for later.",
  },
};

const AquaUserDashbordLayout = ({ children, title, subtitle }) => {
  const { userData } = useSelector((state) => ({ ...state }));
  const router = useRouter();
  const routeMeta = ROUTE_COPY[router.pathname] || ROUTE_COPY["/dashboard"];
  const resolvedTitle = title || routeMeta.title;
  const resolvedSubtitle = subtitle || routeMeta.subtitle;

  const getFirstLettersFromEmail = (email) => {
    if (!email || typeof email !== "string") return "there";
    return email.split("@")[0] || "there";
  };

  return (
    <div
      data-dashboard-shell
      className="relative h-screen overflow-hidden bg-slate-50"
    >
      <AquaCartAddressDialog />
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1320px] items-stretch gap-4 px-3 py-3 sm:px-5 sm:py-4 lg:gap-5">
        <AquaUserDashboardHeader />

        <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col pb-[5.5rem] lg:pb-0">
          <AquaUserGreet
            userName={getFirstLettersFromEmail(userData?.user?.email)}
          />

          <section className="mx-auto mt-3 flex min-h-0 w-full max-w-5xl flex-1 sm:mt-4">
            <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 lg:p-7">
              <header className="mb-6 flex shrink-0 items-end justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h1 className="text-xl font-black text-slate-950 sm:text-2xl">
                    {resolvedTitle}
                  </h1>
                  {resolvedSubtitle && (
                    <p className="mt-1 text-sm text-slate-500">
                      {resolvedSubtitle}
                    </p>
                  )}
                </div>
              </header>
              <div
                key={router.pathname}
                data-dashboard-scroll-region
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 animate-[dashboard-tab-in_180ms_cubic-bezier(0.22,1,0.36,1)] sm:pr-2"
              >
                {children}
              </div>
            </div>
          </section>
        </main>
      </div>
      <style jsx global>{`
        [data-dashboard-shell] {
          height: 100vh;
          overflow: hidden;
        }
        [data-dashboard-scroll-region] {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
          scrollbar-gutter: stable;
          touch-action: pan-y;
        }
        @supports (height: 100dvh) {
          [data-dashboard-shell] {
            height: 100dvh;
          }
        }
        @keyframes dashboard-tab-in {
          from {
            opacity: 0;
            transform: translateY(5px);
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
