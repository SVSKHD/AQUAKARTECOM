import AquaUserGreet from "./greet";
import AquaUserDashboardHeader from "./header";
import AquaCartAddressDialog from "@/components/common/commonDialogs/cartAddress";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";

const ROUTE_COPY = {
  "/dashboard": { title: "Dashboard", subtitle: "Your Aquakart snapshot at a glance." },
  "/dashboard/profile": { title: "Profile", subtitle: "Review and update your personal details." },
  "/dashboard/settings": { title: "Settings", subtitle: "Fine-tune how you experience Aquakart." },
  "/dashboard/orders": { title: "Orders", subtitle: "Track every purchase and its delivery status." },
  "/dashboard/cart": { title: "Cart", subtitle: "Quick access to items waiting for checkout." },
  "/dashboard/fav": { title: "Favourites", subtitle: "All the products you've saved for later." },
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
    <div className="relative min-h-screen bg-slate-50">
      <AquaCartAddressDialog />
      <div className="mx-auto flex w-full max-w-[1320px] items-start gap-4 px-3 py-4 sm:px-5 lg:h-screen lg:items-stretch lg:gap-5 lg:overflow-hidden">
        <AquaUserDashboardHeader />

        <main className="min-h-[calc(100vh-2rem)] min-w-0 flex-1 pb-24 lg:flex lg:h-[calc(100vh-2rem)] lg:min-h-0 lg:flex-col lg:overflow-hidden lg:pb-0">
          <AquaUserGreet userName={getFirstLettersFromEmail(userData?.user?.email)} />

          <section className="mx-auto mt-4 w-full max-w-5xl lg:min-h-0 lg:flex-1">
            <div className="min-h-[calc(100vh-14rem)] w-full rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_16px_45px_rgba(15,23,42,0.05)] sm:p-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden lg:p-7">
              <header className="mb-6 flex shrink-0 items-end justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h1 className="text-xl font-black text-slate-950 sm:text-2xl">{resolvedTitle}</h1>
                  {resolvedSubtitle && <p className="mt-1 text-sm text-slate-500">{resolvedSubtitle}</p>}
                </div>
              </header>
              <div
                key={router.pathname}
                className="animate-[dashboard-tab-in_180ms_cubic-bezier(0.22,1,0.36,1)] lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-2"
              >
                {children}
              </div>
            </div>
          </section>
        </main>
      </div>
      <style jsx global>{`
        @keyframes dashboard-tab-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="dashboard-tab-in"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default AquaUserDashbordLayout;
