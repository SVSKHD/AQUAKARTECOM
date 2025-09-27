import AquaUserGreet from "./greet";
import AquaUserDashboardHeader from "./header";
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
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50">
      <AquaUserDashboardHeader />
      <div className="w-full max-w-4xl px-4">
        <AquaUserGreet
          userName={getFirstLettersFromEmail(userData?.user?.email)}
        />
      </div>
      <div className="w-full max-w-4xl px-4 py-8">
        <div className="w-full bg-white rounded-2xl shadow-lg p-6">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              {resolvedTitle}
            </h1>
            {resolvedSubtitle && (
              <p className="mt-1 text-sm text-gray-500">
                {resolvedSubtitle}
              </p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AquaUserDashbordLayout;
