import { useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import AquaReuseDrawer from "../../reusables/drawer";
import useDrawer from "@/utils/drawer";
import useCurrency from "@/utils/currency";
import useProduct from "@/utils/product";
import AquaImage from "@/components/images/AquaImage";
import Link from "next/link";

const AquafavDrawer = () => {
  const { closeFavDrawer } = useDrawer();
  const favDrawer = useSelector((state) => state.favDrawer);
  const favData = useSelector((state) => state.favData);
  const cartData = useSelector((state) => state.cartData);
  const { formatCurrencyINR } = useCurrency;
  const { AddAndRemoveCartFromFavourites, removeFavProduct } = useProduct();

  const cartIdSet = useMemo(
    () => new Set(cartData.map((item) => item._id || item.id)),
    [cartData],
  );

  const isProductInCart = useCallback(
    (productId) => cartIdSet.has(productId),
    [cartIdSet],
  );

  const handleMoveToCart = useCallback(
    (product) => AddAndRemoveCartFromFavourites(product),
    [AddAndRemoveCartFromFavourites],
  );

  return (
    <AquaReuseDrawer
      open={favDrawer}
      close={closeFavDrawer}
      title="Saved products"
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-white/20 px-4 py-4 text-sm font-medium text-slate-600">
          {favData.length} item{favData.length === 1 ? "" : "s"} curated
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {favData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50/60 backdrop-blur-sm">
                <span className="text-2xl">❤️</span>
              </div>
              <p className="text-lg font-semibold text-slate-900">
                Nothing saved yet
              </p>
              <p className="text-sm text-slate-500">
                Tap the heart on any Aquakart product to collect it here.
              </p>
              <Link
                href="/shop"
                className="btn-glass btn-glass-primary"
                onClick={closeFavDrawer}
              >
                Discover products
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {favData.map((product) => {
                const id = product?._id || product?.id;
                const slug = product?.slug || product?.name;
                const image = product?.photos?.[0]?.secure_url;
                const productUrl =
                  product?.href || (id ? `/product/${slug}` : "#");
                const inCart = isProductInCart(id);

                return (
                  <li
                    key={id}
                    className="glass-card group flex flex-col gap-3 rounded-2xl p-3 transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] sm:flex-row sm:p-4"
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-24">
                      <div className="aspect-square sm:aspect-auto sm:h-full sm:w-full">
                        {image ? (
                          <AquaImage
                            src={image}
                            alt={product?.title || "Favourite product"}
                            customClass="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-400">
                            No image
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <Link
                            href={productUrl}
                            className="text-sm font-semibold text-slate-900 hover:text-emerald-600 transition-colors"
                            onClick={closeFavDrawer}
                          >
                            {product?.title || "Untitled product"}
                          </Link>
                          <p className="text-sm font-bold text-emerald-600">
                            {formatCurrencyINR(product?.price || 0)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFavProduct(id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100/60 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 active:scale-90"
                          aria-label="Remove from favourites"
                        >
                          <span className="text-sm leading-none">×</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => handleMoveToCart(product)}
                          disabled={inCart}
                          className={`btn-glass rounded-full px-4 py-2 text-xs font-bold ${
                            inCart
                              ? "cursor-not-allowed bg-slate-100/60 text-slate-400"
                              : "btn-glass-primary"
                          }`}
                        >
                          {inCart ? "In cart" : "Move to cart"}
                        </button>
                        <Link
                          href={productUrl}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
                          onClick={closeFavDrawer}
                        >
                          View details →
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </AquaReuseDrawer>
  );
};

export default AquafavDrawer;
