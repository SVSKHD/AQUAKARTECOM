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
      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-3 shadow-lg backdrop-blur-lg">
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
                    ? "bg-white/25 text-white shadow"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.4 : 1.6}
                  className={isActive ? "text-white" : "text-white/60"}
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
