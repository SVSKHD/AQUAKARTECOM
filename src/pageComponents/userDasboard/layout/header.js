import { useRouter } from "next/router";
import Link from "next/link";
import {
  Home,
  User,
  ShoppingCart,
  Heart,
  ShoppingBag,
  Store,
  Droplets,
} from "lucide-react";

const navItems = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: Home },
  {
    id: "orders",
    label: "Orders",
    href: "/dashboard/orders",
    icon: ShoppingBag,
  },
  { id: "cart", label: "Cart", href: "/dashboard/cart", icon: ShoppingCart },
  {
    id: "favourites",
    label: "Favourites",
    href: "/dashboard/fav",
    icon: Heart,
  },
  { id: "profile", label: "Profile", href: "/dashboard/profile", icon: User },
];

const isCurrentRoute = (pathname, href) =>
  href === "/dashboard" ? pathname === href : pathname.startsWith(href);

const NavigationItem = ({ item, pathname, compact = false }) => {
  const active = isCurrentRoute(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center rounded-2xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        compact
          ? "min-w-[64px] flex-col justify-center gap-1 px-2 py-2 text-[11px]"
          : "gap-3 px-3 py-3 text-sm xl:px-4"
      } ${
        active
          ? "bg-emerald-600 text-white shadow-sm"
          : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.3 : 1.8} />
      <span className={compact ? "leading-none" : "hidden xl:block"}>
        {item.label}
      </span>
    </Link>
  );
};

const AquaUserDashboardHeader = () => {
  const { pathname } = useRouter();

  return (
    <>
      <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-20 shrink-0 flex-col rounded-[28px] border border-slate-200/80 bg-white p-3 shadow-[0_16px_45px_rgba(15,23,42,0.06)] lg:flex xl:w-60 xl:p-4">
        <Link
          href="/"
          aria-label="Open Aquakart shop"
          className="mb-5 flex items-center justify-center gap-3 rounded-2xl bg-slate-950 px-3 py-3 text-white xl:justify-start"
        >
          <Droplets className="h-6 w-6 text-emerald-400" />
          <span className="hidden text-base font-black xl:block">Aquakart</span>
        </Link>

        <p className="mb-2 hidden px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 xl:block">
          Your account
        </p>
        <nav className="space-y-2" aria-label="User dashboard">
          {navItems.map((item) => (
            <NavigationItem key={item.id} item={item} pathname={pathname} />
          ))}
        </nav>

        <Link
          href="/"
          className="mt-auto flex items-center justify-center gap-3 rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 xl:justify-start xl:px-4"
        >
          <Store className="h-5 w-5" />
          <span className="hidden xl:block">Back to shop</span>
        </Link>
      </aside>

      <nav
        className="fixed inset-x-3 bottom-3 z-50 flex items-center justify-around rounded-[22px] border border-slate-200/80 bg-white/95 px-1 py-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur lg:hidden"
        aria-label="User dashboard"
      >
        {navItems.map((item) => (
          <NavigationItem
            key={item.id}
            item={item}
            pathname={pathname}
            compact
          />
        ))}
      </nav>
    </>
  );
};

export default AquaUserDashboardHeader;
