import { useMemo } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { Heart } from "lucide-react";
import AquaUserDashbordLayout from "./layout/layout";
import DashboardProductCard from "./layout/cards/cartCard";
import DashboardPagination, {
  useDashboardPagination,
} from "@/components/dashboard/DashboardPagination";

const AquaUserFavPageComponent = () => {
  const favData = useSelector((state) => state.favData);
  const fav = useMemo(() => (Array.isArray(favData) ? favData : []), [favData]);
  const pagination = useDashboardPagination(fav);

  if (fav.length === 0) {
    return (
      <AquaUserDashbordLayout>
        <div className="flex flex-col items-center rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-3xl bg-rose-50 text-rose-500">
            <Heart className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-black text-slate-950">
            Nothing saved yet
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Tap the heart on any product to keep it here while you compare
            options.
          </p>
          <Link
            href="/shop"
            className="mt-6 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
          >
            Browse products
          </Link>
        </div>
      </AquaUserDashbordLayout>
    );
  }

  return (
    <AquaUserDashbordLayout>
      <p className="mb-3 text-sm font-semibold text-slate-500">
        {fav.length} saved {fav.length === 1 ? "item" : "items"}
      </p>
      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-3">
        {pagination.pageItems.map((item, index) => (
          <DashboardProductCard
            key={item?._id || `${pagination.page}-${index}`}
            product={item}
          />
        ))}
      </div>
      <DashboardPagination {...pagination} />
    </AquaUserDashbordLayout>
  );
};

export default AquaUserFavPageComponent;
