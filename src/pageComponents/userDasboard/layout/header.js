import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Home,
  User,
  Settings,
  ShoppingCart,
  Heart,
  ShoppingBag,
  ShoppingBagIcon
} from "lucide-react";

const AquaUserDashboardHeader = () => {
  const router = useRouter();

  const navItems = [
    {
      id: "home",
      label: "Shop",
      href: "/",
      icon: ShoppingBagIcon,
    },
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      id: "profile",
      label: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
    {
      id: "orders",
      label: "Orders",
      href: "/dashboard/orders",
      icon: ShoppingBag,
    },
    {
      id: "settings",
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
    {
      id: "cart",
      label: "Cart",
      href: "/dashboard/cart",
      icon: ShoppingCart,
    },
    {
      id: "favourites",
      label: "Favourites",
      href: "/dashboard/fav",
      icon: Heart,
    },
  ];

  return (
    <div className="mt-6 mx-auto w-fit bg-white rounded-full shadow-lg px-3 py-2">
      <div className="flex gap-2 justify-center items-center">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.id} href={item.href}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  fill={isActive ? "white" : "none"}
                />
                {item.label}
              </motion.button>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AquaUserDashboardHeader;
