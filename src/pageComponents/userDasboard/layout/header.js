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
  ShoppingBagIcon,
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
    // {
    //   id: "settings",
    //   label: "Settings",
    //   href: "/dashboard/settings",
    //   icon: Settings,
    // },
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
    <div className="mx-auto mt-6 w-full">
      <div className="hidden justify-center px-4 sm:flex">
        <div className="flex items-center gap-1.5 rounded-full border border-white/50 bg-white/50 backdrop-blur-2xl px-3 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.id} href={item.href} className="relative">
                <motion.span
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                      : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.4 : 1.6}
                    className={isActive ? "text-white" : "text-slate-400"}
                  />
                  {item.label}
                </motion.span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="px-4 sm:hidden">
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-white/50 bg-white/50 backdrop-blur-xl px-3 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20"
                    : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.4 : 1.6} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AquaUserDashboardHeader;
