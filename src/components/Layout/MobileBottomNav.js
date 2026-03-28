import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import {
  HomeIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  HeartIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  HeartIcon as HeartIconSolid,
  UserIcon as UserIconSolid,
} from "@heroicons/react/24/solid";
import useDrawer from "@/utils/drawer";
import useDialog from "@/utils/dialog";

const MobileBottomNav = () => {
  const router = useRouter();
  const { openCartDrawer, openFavDrawer } = useDrawer();
  const { openAuthDialog } = useDialog();

  const cartData = useSelector((state) => state.cartData);
  const favData = useSelector((state) => state.favData);
  const userData = useSelector((state) => state.userData);

  const cartCount = Array.isArray(cartData) ? cartData.length : 0;
  const favCount = Array.isArray(favData) ? favData.length : 0;

  const isActive = useCallback(
    (path) => router.pathname === path,
    [router.pathname],
  );

  const handleUserClick = useCallback(() => {
    if (userData) {
      router.push("/dashboard");
    } else {
      openAuthDialog();
    }
  }, [userData, router, openAuthDialog]);

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
      isLink: true,
    },
    {
      label: "Shop",
      href: "/shop",
      icon: MagnifyingGlassIcon,
      activeIcon: MagnifyingGlassIconSolid,
      isLink: true,
    },
    {
      label: "Cart",
      icon: ShoppingCartIcon,
      activeIcon: ShoppingCartIconSolid,
      onClick: openCartDrawer,
      badge: cartCount,
    },
    {
      label: "Saved",
      icon: HeartIcon,
      activeIcon: HeartIconSolid,
      onClick: openFavDrawer,
      badge: favCount,
    },
    {
      label: userData ? "Account" : "Sign in",
      icon: UserIcon,
      activeIcon: UserIconSolid,
      onClick: handleUserClick,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 sm:hidden"
      aria-label="Mobile navigation"
    >
      {/* Glass bar */}
      <div className="mx-2 mb-2 flex items-center justify-around rounded-2xl border border-white/50 bg-white/60 backdrop-blur-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.06)] px-1 py-1">
        {navItems.map((item) => {
          const active = item.isLink && isActive(item.href);
          const Icon = active ? item.activeIcon : item.icon;

          const content = (
            <div
              className={`relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-all duration-200 ${
                active
                  ? "bg-emerald-50/80 text-emerald-600"
                  : "text-slate-400 hover:text-slate-600 active:scale-90"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white shadow-sm">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold leading-none">
                {item.label}
              </span>
            </div>
          );

          if (item.isLink) {
            return (
              <Link key={item.label} href={item.href} className="flex-1">
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="flex-1"
              aria-label={item.label}
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
