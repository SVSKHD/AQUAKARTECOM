import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  LayoutGrid,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Store,
  User,
} from "lucide-react";

export const navItems = [
  {
    id: "dashboard",
    label: "Overview",
    short: "Home",
    href: "/dashboard",
    icon: LayoutGrid,
  },
  {
    id: "orders",
    label: "Orders",
    short: "Orders",
    href: "/dashboard/orders",
    icon: Package,
  },
  {
    id: "cart",
    label: "Cart",
    short: "Cart",
    href: "/dashboard/cart",
    icon: ShoppingCart,
    badge: "cart",
  },
  {
    id: "favourites",
    label: "Saved items",
    short: "Saved",
    href: "/dashboard/fav",
    icon: Heart,
    badge: "fav",
  },
  {
    id: "profile",
    label: "Profile",
    short: "Account",
    href: "/dashboard/profile",
    icon: User,
  },
];

export const isCurrentRoute = (pathname, href) =>
  href === "/dashboard" ? pathname === href : pathname.startsWith(href);

export const getInitials = (user) => {
  const first = user?.firstName?.trim?.()?.[0];
  const last = user?.lastName?.trim?.()?.[0];
  if (first) return `${first}${last || ""}`.toUpperCase();
  return (user?.email?.[0] || "A").toUpperCase();
};

export const getDisplayName = (user) => {
  const name = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (name) return name;
  return user?.email?.split("@")[0] || "Aquakart member";
};

const Badge = ({ value, inverted = false }) =>
  value > 0 ? (
    <span
      className={`ml-auto inline-flex min-w-[1.4rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
        inverted ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
      }`}
    >
      {value > 99 ? "99+" : value}
    </span>
  ) : null;

/** Desktop sidebar: brand, member card, labelled navigation and account actions. */
export const DashboardSidebar = ({ pathname, user, counts, onSignOut }) => (
  <aside
    data-dashboard-sidebar
    className="sticky top-4 hidden h-[calc(100dvh-2rem)] w-64 shrink-0 flex-col rounded-3xl border border-slate-200 bg-white p-4 lg:flex"
  >
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-2xl px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950">
        <Image
          src="/aquakart-logo-white.png"
          alt=""
          width={22}
          height={22}
          className="h-5 w-5 object-contain"
          priority
        />
      </span>
      <span className="text-base font-black tracking-tight text-slate-950">
        Aquakart
      </span>
    </Link>

    <div className="mt-5 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-sky-50 p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-600 text-sm font-bold text-white">
        {getInitials(user)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">
          {getDisplayName(user)}
        </p>
        <p className="truncate text-xs text-slate-500">{user?.email}</p>
      </div>
    </div>

    <nav className="mt-5 flex flex-col gap-1" aria-label="Account sections">
      {navItems.map((item) => {
        const active = isCurrentRoute(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              active
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            {item.label}
            {item.badge && (
              <Badge value={counts[item.badge]} inverted={active} />
            )}
          </Link>
        );
      })}
    </nav>

    <div className="mt-auto flex flex-col gap-1 border-t border-slate-100 pt-3">
      <Link
        href="/dashboard/settings"
        aria-current={pathname === "/dashboard/settings" ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
          pathname === "/dashboard/settings"
            ? "bg-slate-950 text-white"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
        }`}
      >
        <Settings className="h-[18px] w-[18px]" aria-hidden="true" />
        Settings
      </Link>
      <Link
        href="/shop"
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
      >
        <Store className="h-[18px] w-[18px]" aria-hidden="true" />
        Back to shop
      </Link>
      <button
        type="button"
        onClick={onSignOut}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
      >
        <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
        Sign out
      </button>
    </div>
  </aside>
);

/** Mobile chrome: compact top bar plus a labelled bottom tab bar. */
export const DashboardMobileNav = ({ pathname, user, counts, title }) => (
  <>
    <header className="sticky top-0 z-40 -mx-4 mb-4 flex items-center gap-3 border-b border-slate-200/70 bg-slate-50/90 px-4 py-3 backdrop-blur lg:hidden">
      <Link
        href="/"
        aria-label="Aquakart home"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-950"
      >
        <Image
          src="/aquakart-logo-white.png"
          alt=""
          width={20}
          height={20}
          className="h-5 w-5 object-contain"
          priority
        />
      </Link>
      <p className="min-w-0 flex-1 truncate text-base font-black text-slate-950">
        {title}
      </p>
      <Link
        href="/dashboard/settings"
        aria-label="Settings"
        className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
      >
        <Settings className="h-5 w-5" aria-hidden="true" />
      </Link>
      <Link
        href="/dashboard/profile"
        aria-label="Your profile"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white"
      >
        {getInitials(user)}
      </Link>
    </header>

    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      aria-label="Account sections"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {navItems.map((item) => {
          const active = isCurrentRoute(pathname, item.href);
          const Icon = item.icon;
          const count = item.badge ? counts[item.badge] : 0;
          return (
            <Link
              key={item.id}
              href={item.href}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                active ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              {active && (
                <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-emerald-600" />
              )}
              <span className="relative">
                <Icon className="h-5 w-5" aria-hidden="true" />
                {count > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 min-w-[1.1rem] rounded-full bg-emerald-600 px-1 text-center text-[10px] font-bold leading-[1.1rem] text-white">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </span>
              {item.short}
            </Link>
          );
        })}
      </div>
    </nav>
  </>
);
