import { useMemo } from "react";
import AquaUserDashbordLayout from "./layout/layout";
import { useSelector } from "react-redux";
import { Heart, ShoppingCart, PackageCheck, Eye } from "lucide-react";
import DashboardProductCard from "./layout/cards/cartCard";

const AquaUserFavPageComponent = () => {
  const { favData, cartData } = useSelector((state) => ({ ...state }));

  const safeFav = useMemo(
    () => (Array.isArray(favData) ? favData : []),
    [favData],
  );
  const safeCart = useMemo(
    () => (Array.isArray(cartData) ? cartData : []),
    [cartData],
  );

  const { favouritesCount, inStockCount, inCartCount, viewedCount } = useMemo(
    () => {
      const inStock = safeFav.filter((item) =>
        item?.inStock === false ? false : true,
      ).length;
      const inCart = safeFav.filter((fav) =>
        safeCart.some((cartItem) => cartItem._id === fav._id || cartItem.id === fav.id),
      ).length;
      const viewed = safeFav.reduce((acc, item) => {
        if (typeof item.views === "number") {
          return acc + item.views;
        }
        return acc;
      }, 0);

      return {
        favouritesCount: safeFav.length,
        inStockCount: inStock,
        inCartCount: inCart,
        viewedCount: viewed,
      };
    },
    [safeFav, safeCart],
  );

  const summaryCards = [
    {
      label: "Saved items",
      value: favouritesCount,
      icon: Heart,
      accent: "bg-rose-100 text-rose-700",
    },
    {
      label: "In stock",
      value: inStockCount,
      icon: PackageCheck,
      accent: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Also in cart",
      value: inCartCount,
      icon: ShoppingCart,
      accent: "bg-indigo-100 text-indigo-700",
    },
    {
      label: "Total views",
      value: viewedCount,
      icon: Eye,
      accent: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <AquaUserDashbordLayout>
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ label, value, icon: Icon, accent }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/70 p-4 shadow-sm"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full ${accent}`}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-lg font-semibold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {favouritesCount > 0 ? (
          <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {safeFav.map((item, index) => (
              <DashboardProductCard key={item._id || index} product={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              No favourites yet
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Save products you love and they’ll appear here for quick access.
            </p>
          </div>
        )}
      </div>
    </AquaUserDashbordLayout>
  );
};

export default AquaUserFavPageComponent;
