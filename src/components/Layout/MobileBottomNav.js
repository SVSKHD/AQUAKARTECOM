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
      {/* iOS-style frosted glass bar */}
      <div
        className="border-t border-white/40"
        style={{
          background:
            "linear-gradient(180deg, rgba(246,250,249,0.76) 0%, rgba(238,246,244,0.9) 100%)",
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          boxShadow:
            "0 -1px 0 rgba(255,255,255,0.5), 0 -8px 32px rgba(0,0,0,0.08)",
        }}
      >
        {/* Safe area padding for notch devices */}
        <div className="flex items-center justify-around px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          {navItems.map((item) => {
            const active = item.isLink && isActive(item.href);
            const Icon = active ? item.activeIcon : item.icon;

            const content = (
              <div className="relative flex flex-col items-center gap-0.5 py-1">
                <div
                  className={`relative flex h-8 w-8 items-center justify-center rounded-2xl transition-all duration-200 ${
                    active
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                      : "text-slate-500"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[9px] font-bold text-white ring-2 ring-white shadow-sm">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold leading-none transition-colors ${
                    active ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );

            if (item.isLink) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex-1 flex justify-center active:scale-90 transition-transform"
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="flex-1 flex justify-center active:scale-90 transition-transform"
                aria-label={item.label}
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
