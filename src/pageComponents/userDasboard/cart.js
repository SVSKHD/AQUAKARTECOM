import { useMemo } from "react";
import { useSelector } from "react-redux";
import { ShoppingCart, Heart, PackageCheck, PackageX } from "lucide-react";
import AquaUserDashbordLayout from "./layout/layout";
import DashboardProductCard from "./layout/cards/cartCard";

const AquaUserCartPageComponent = () => {
  const { cartData, favData } = useSelector((state) => ({ ...state }));

  const safeCart = useMemo(
    () => (Array.isArray(cartData) ? cartData : []),
    [cartData],
  );
  const safeFav = useMemo(
    () => (Array.isArray(favData) ? favData : []),
    [favData],
  );

  const { totalItems, inStockItems, outOfStockItems, favouritesCount } = useMemo(
    () => {
      const inStock = safeCart.filter((item) =>
        item?.inStock === false ? false : true,
      ).length;
      const outOfStock = safeCart.length - inStock;

      return {
        totalItems: safeCart.length,
        inStockItems: inStock,
        outOfStockItems: outOfStock,
        favouritesCount: safeFav.length,
      };
    },
    [safeCart, safeFav],
  );

  const summaryCards = [
    {
      label: "Items in cart",
      value: totalItems,
      icon: ShoppingCart,
      accent: "bg-indigo-100 text-indigo-700",
    },
    {
      label: "In stock",
      value: inStockItems,
      icon: PackageCheck,
      accent: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Out of stock",
      value: outOfStockItems,
      icon: PackageX,
      accent: "bg-amber-100 text-amber-700",
    },
    {
      label: "Saved to favourites",
      value: favouritesCount,
      icon: Heart,
      accent: "bg-rose-100 text-rose-700",
    },
  ];

  return (
    <>
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

          {totalItems > 0 ? (
            <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {safeCart.map((item, index) => (
                <DashboardProductCard
                  key={item._id || index}
                  product={item}
                  variant="cart"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Your cart is empty
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Add products to your cart to see them listed here.
              </p>
            </div>
          )}
        </div>
      </AquaUserDashbordLayout>
    </>
  );
};
export default AquaUserCartPageComponent;
