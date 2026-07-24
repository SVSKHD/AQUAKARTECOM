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
    <div className="relative min-h-screen flex flex-col items-center justify-start bg-slate-50">
      <AquaUserDashboardHeader />
      <AquaCartAddressDialog />
      {!focused && (
        <div className="w-full max-w-5xl px-4">
          <AquaUserGreet
            userName={getFirstLettersFromEmail(userData?.user?.email)}
          />
        </div>
      )}
      <div
        className={`w-full px-4 py-6 sm:py-8 ${
          focused ? "max-w-6xl" : "max-w-5xl"
        }`}
      >
        <div
          className={
            focused ? "w-full" : "glass-card w-full rounded-3xl p-5 sm:p-8"
          }
        >
          <div className="mb-6 border-b border-white/30 pb-4">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              {resolvedTitle}
            </h1>
            {resolvedSubtitle && (
              <p className="mt-1 text-sm text-slate-500">{resolvedSubtitle}</p>
            )}
          </div>
          <div className={focused ? "" : "min-h-[60vh]"}>{children}</div>
        </div>
      </div>
      <div className="w-full mt-auto">
        <AquaFooter categories={categories} subcategories={subcategories} />
      </div>
    </div>
  );
};

export default AquaUserDashbordLayout;
