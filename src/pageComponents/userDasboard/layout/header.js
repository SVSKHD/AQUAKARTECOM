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
    <div className="mx-auto mt-8 flex w-full justify-center px-4">
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-lg">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.id} href={item.href} className="relative">
              <motion.span
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-slate-900 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.4 : 1.6}
                  className={isActive ? "text-white" : "text-slate-500"}
                />
                {item.label}
              </motion.span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AquaUserDashboardHeader;
