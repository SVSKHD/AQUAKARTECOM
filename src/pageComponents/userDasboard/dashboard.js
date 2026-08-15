import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Heart,
  ShoppingCart,
  PackageCheck,
  Clock3,
  ArrowUpRight,
} from "lucide-react";
import AquaUserDashbordLayout from "./layout/layout";
import DashboardProductCard from "./layout/cards/cartCard";

const AquaUserDashbordPageComponent = () => {
  const router = useRouter();
  const { userData, cartData, favData, ordersData } = useSelector((state) => ({
    ...state,
  }));

  useEffect(() => {
    if (!userData?.user) {
      router.push("/");
    }
  }, [userData, router]);

  const safeCart = useMemo(
    () => (Array.isArray(cartData) ? cartData : []),
    [cartData],
  );
  const safeFav = useMemo(
    () => (Array.isArray(favData) ? favData : []),
    [favData],
  );
  const recentOrders = useMemo(
    () => (Array.isArray(ordersData) ? ordersData : []),
    [ordersData],
  );

  const highlightCards = useMemo(() => {
    const delivered = recentOrders.filter(
      (order) => order?.status === "Delivered",
    ).length;
    const pending = recentOrders.filter(
      (order) => order?.status && order.status !== "Delivered",
    ).length;

    return [
      {
        title: "Items in cart",
        value: safeCart.length,
        icon: ShoppingCart,
        iconTone: "bg-indigo-100 text-indigo-700",
        cardClass: "glass-tint-indigo",
      },
      {
        title: "Saved favourites",
        value: safeFav.length,
        icon: Heart,
        iconTone: "bg-rose-100 text-rose-700",
        cardClass: "glass-tint-rose",
      },
      {
        title: "Delivered orders",
        value: delivered,
        icon: PackageCheck,
        iconTone: "bg-emerald-100 text-emerald-700",
        cardClass: "glass-tint-emerald",
      },
      {
        title: "Active orders",
        value: pending,
        icon: Clock3,
        iconTone: "bg-amber-100 text-amber-700",
        cardClass: "glass-tint-amber",
      },
    ];
  }, [safeCart.length, safeFav.length, recentOrders]);

  const featuredCart = useMemo(() => safeCart.slice(0, 3), [safeCart]);
  const featuredFav = useMemo(() => safeFav.slice(0, 3), [safeFav]);

  return (
    <AquaUserDashbordLayout>
      <div className="space-y-6 sm:space-y-8">
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {highlightCards.map(
            ({ title, value, icon: Icon, iconTone, cardClass }) => (
              <div
                key={title}
                className={`flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 p-3 sm:p-4 ${cardClass}`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${iconTone}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-500 sm:text-sm">
                    {title}
                  </p>
                  <p className="text-xl font-black text-slate-950 sm:text-2xl">
                    {value}
                  </p>
                </div>
              </div>
            ),
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                Quick cart picks
              </h2>
              <p className="text-xs leading-5 text-slate-500 sm:text-sm">
                Review items currently waiting in your cart.
              </p>
            </div>
            <Link
              href="/dashboard/cart"
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-bold text-emerald-700 transition hover:text-emerald-600 sm:text-sm"
            >
              View cart <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredCart.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {featuredCart.map((item) => (
                <DashboardProductCard
                  key={item?._id}
                  product={item}
                  variant="cart"
                  compact
                />
              ))}
            </div>
          ) : (
            <div className="glass-subtle rounded-2xl border border-dashed border-white/40 p-6 text-center text-xs leading-5 text-slate-500 sm:p-10 sm:text-sm">
              Your cart is currently empty. Browse products to add them here.
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                Saved favourites
              </h2>
              <p className="text-xs leading-5 text-slate-500 sm:text-sm">
                Keep an eye on the products you love.
              </p>
            </div>
            <Link
              href="/dashboard/fav"
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-bold text-emerald-700 transition hover:text-emerald-600 sm:text-sm"
            >
              View favourites <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredFav.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {featuredFav.map((item) => (
                <DashboardProductCard
                  key={item?._id}
                  product={item}
                  variant="fav"
                  compact
                />
              ))}
            </div>
          ) : (
            <div className="glass-subtle rounded-2xl border border-dashed border-white/40 p-6 text-center text-xs leading-5 text-slate-500 sm:p-10 sm:text-sm">
              You have no saved favourites yet. Tap the heart icon on a product
              to keep it here.
            </div>
          )}
        </section>
      </div>
    </AquaUserDashbordLayout>
  );
};

export default AquaUserDashbordPageComponent;
