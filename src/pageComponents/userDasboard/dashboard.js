import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Heart,
  ShoppingCart,
  PackageCheck,
  Clock3,
  CalendarCheck,
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

  const firstName = useMemo(() => {
    const fullName =
      userData?.user?.name || userData?.user?.firstName || "there";
    return `${fullName}`.split(" ")[0];
  }, [userData?.user]);

  const featuredCart = useMemo(() => safeCart.slice(0, 4), [safeCart]);
  const featuredFav = useMemo(() => safeFav.slice(0, 4), [safeFav]);

  return (
    <AquaUserDashbordLayout>
      <div className="space-y-10">
        <section className="glass-tint-emerald rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-600">
                Welcome back
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                Hi {firstName}, your water essentials are ready.
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-600">
                Track your orders, manage saved products, and keep your profile
                up to date for lightning-fast deliveries.
              </p>
            </div>
            <Link
              href="/dashboard/profile"
              className="btn-glass btn-glass-primary self-start"
            >
              <CalendarCheck className="h-4 w-4" />
              Update profile
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {highlightCards.map(
            ({ title, value, icon: Icon, iconTone, cardClass }) => (
              <div
                key={title}
                className={`flex items-center gap-3 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${cardClass}`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconTone}`}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm text-slate-500">{title}</p>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                </div>
              </div>
            ),
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Quick cart picks
              </h2>
              <p className="text-sm text-slate-500">
                Review items currently waiting in your cart.
              </p>
            </div>
            <Link
              href="/dashboard/cart"
              className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-500"
            >
              View cart
            </Link>
          </div>

          {featuredCart.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {featuredCart.map((item) => (
                <DashboardProductCard
                  key={item?._id}
                  product={item}
                  variant="cart"
                />
              ))}
            </div>
          ) : (
            <div className="glass-subtle rounded-2xl border border-dashed border-white/40 p-10 text-center text-sm text-slate-500">
              Your cart is currently empty. Browse products to add them here.
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Saved favourites
              </h2>
              <p className="text-sm text-slate-500">
                Keep an eye on the products you love.
              </p>
            </div>
            <Link
              href="/dashboard/fav"
              className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-500"
            >
              View favourites
            </Link>
          </div>

          {featuredFav.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {featuredFav.map((item) => (
                <DashboardProductCard
                  key={item?._id}
                  product={item}
                  variant="fav"
                />
              ))}
            </div>
          ) : (
            <div className="glass-subtle rounded-2xl border border-dashed border-white/40 p-10 text-center text-sm text-slate-500">
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
