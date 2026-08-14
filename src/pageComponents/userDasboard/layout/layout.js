import AquaUserGreet from "./greet";
import AquaUserDashboardHeader from "./header";
import AquaCartAddressDialog from "@/components/common/commonDialogs/cartAddress";
import { useSelector } from "react-redux";
import AquaFooter from "@/components/Layout/Footer";
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

const AquaUserDashbordLayout = ({
  children,
  title,
  subtitle,
  focused = false,
}) => {
  const { userData, dynamicData } = useSelector((state) => ({ ...state }));
  const categories = dynamicData?.categories || [];
  const subcategories = dynamicData?.subcategories || [];
  const router = useRouter();

  const routeMeta = ROUTE_COPY[router.pathname] || ROUTE_COPY["/dashboard"];
  const resolvedTitle = title || routeMeta.title;
  const resolvedSubtitle = subtitle || routeMeta.subtitle;

  const getFirstLettersFromEmail = (email) => {
    if (!email || typeof email !== "string") {
      return "there";
    }

    const [username] = email.split("@");
    if (!username) {
      return "there";
    }

    return username;
  };
  return (
    <div className="relative min-h-screen bg-slate-50">
      <AquaCartAddressDialog />
      <div className="mx-auto flex w-full max-w-[1440px] items-start gap-5 px-3 py-4 sm:px-5 sm:py-6 lg:gap-7">
        <AquaUserDashboardHeader />

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          {!focused && (
            <AquaUserGreet
              userName={getFirstLettersFromEmail(userData?.user?.email)}
            />
          )}

          <section
            className={`mx-auto mt-4 w-full ${
              focused ? "max-w-6xl" : "max-w-5xl"
            }`}
          >
            <div
              className={
                focused
                  ? "w-full"
                  : "w-full rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_16px_45px_rgba(15,23,42,0.05)] sm:p-6 lg:p-7"
              }
            >
              <header className="mb-6 flex items-end justify-between gap-4 border-b border-slate-100 pb-4">
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
              <div className={focused ? "" : "min-h-[55vh]"}>{children}</div>
            </div>
          </section>
        </main>
      </div>

      <div className="w-full lg:pl-20 xl:pl-60">
        <div className="mx-auto max-w-6xl">
          <AquaFooter categories={categories} subcategories={subcategories} />
        </div>
      </div>
    </div>
  );
};

export default AquaUserDashbordLayout;
