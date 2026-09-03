import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Heart,
  Home,
  ShoppingBag,
  ShoppingCart,
  Store,
  User,
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

const NavigationItem = ({ item, pathname, mobile = false }) => {
  const active = isCurrentRoute(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      prefetch
      scroll={false}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={`group relative grid h-11 w-11 place-items-center rounded-[14px] transition-[background-color,color,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
        active
          ? "bg-emerald-500 text-slate-950"
          : "text-slate-400 hover:-translate-y-0.5 hover:bg-white/10 hover:text-emerald-300"
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
      {!mobile && (
        <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
          {item.label}
        </span>
      )}
      {active && mobile && (
        <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-slate-950" />
      )}
    </Link>
  );
};

const AquaUserDashboardHeader = () => {
  const { pathname } = useRouter();

  return (
    <>
      <aside
        data-dashboard-sidebar
        className="sticky top-0 hidden h-full w-[72px] shrink-0 flex-col items-center rounded-[26px] border border-slate-800 bg-slate-950 px-3 py-3 lg:flex"
      >
        <Link
          href="/"
          aria-label="Open Aquakart shop"
          className="grid h-11 w-11 place-items-center rounded-[14px] bg-white/10 ring-1 ring-white/10 transition-colors duration-200 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <Image
            src="/aquakart-logo-white.png"
            alt="Aquakart"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
            priority
          />
        </Link>

        <nav
          className="my-auto flex flex-col items-center gap-2"
          aria-label="User dashboard tabs"
        >
          {navItems.map((item) => (
            <NavigationItem key={item.id} item={item} pathname={pathname} />
          ))}
        </nav>

        <Link
          href="/shop"
          aria-label="Open Aquakart shop"
          className="group relative grid h-11 w-11 place-items-center rounded-[14px] text-slate-400 transition-colors duration-200 hover:bg-white/10 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <Store className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
            Back to shop
          </span>
        </Link>
      </aside>

      <nav
        className="fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-[20px] border border-white/10 bg-slate-950/95 px-2 py-2 shadow-[0_18px_50px_rgba(15,23,42,0.28)] backdrop-blur lg:hidden"
        aria-label="User dashboard tabs"
      >
        {navItems.map((item) => (
          <NavigationItem
            key={item.id}
            item={item}
            pathname={pathname}
            mobile
          />
        ))}
        <span
          className="mx-0.5 h-7 w-px shrink-0 bg-white/15"
          aria-hidden="true"
        />
        <Link
          href="/"
          prefetch
          aria-label="Return to Aquakart home"
          className="group relative grid h-11 w-11 place-items-center rounded-[14px] text-slate-300 transition-[background-color,color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/10 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <Store className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          <span className="sr-only">Aquakart home</span>
        </Link>
      </nav>
    </>
  );
};

export default AquaUserDashboardHeader;
