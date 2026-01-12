import { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  ShoppingCart,
  Heart,
  PackageCheck,
  PackageX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AquaUserDashbordLayout from "./layout/layout";
import DashboardProductCard from "./layout/cards/cartCard";
import useEmblaCarousel from "embla-carousel-react";

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

  const { totalItems, inStockItems, outOfStockItems, favouritesCount } =
    useMemo(() => {
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
    }, [safeCart, safeFav]);

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
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            <div className="relative">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xl font-bold text-slate-900">
                  Cart Items ({totalItems})
                </h3>
              </div>
              <CartCarousel products={safeCart} />
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

const CartCarousel = ({ products }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    dragFree: true,
  });

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  return (
    <div className="group relative">
      <div className="overflow-hidden p-1 -m-1" ref={emblaRef}>
        <div className="flex gap-4">
          {products.map((item, index) => (
            <div
              key={item._id || index}
              className="flex-[0_0_50%] min-w-0 sm:flex-[0_0_33.33%] lg:flex-[0_0_25%] xl:flex-[0_0_20%]"
            >
              <DashboardProductCard product={item} variant="cart" />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={scrollPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-0"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-0"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};
export default AquaUserCartPageComponent;
