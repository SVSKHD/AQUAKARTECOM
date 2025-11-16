import { useSelector } from "react-redux";
import AquaReuseDrawer from "../../reusables/drawer";
import useDrawer from "@/utils/drawer";
import useCurrency from "@/utils/currency";
import useProduct from "@/utils/product";
import AquaImage from "@/components/images/AquaImage";
import Link from "next/link";

const AquafavDrawer = () => {
  const { closeFavDrawer } = useDrawer();
  const { favDrawer, favData, cartData } = useSelector((state) => ({
    favDrawer: state.favDrawer,
    favData: state.favData,
    cartData: state.cartData,
  }));
  const { formatCurrencyINR } = useCurrency;
  const { AddAndRemoveCartFromFavourites, removeFavProduct } = useProduct();

  const isProductInCart = (productId) =>
    cartData.some((item) => item._id === productId || item.id === productId);

  const renderEmptyState = () => (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
        ⭐
      </div>
      <p className="text-lg font-semibold text-slate-900">Nothing saved yet</p>
      <p className="text-sm text-slate-500">
        Tap the heart on any Aquakart product to collect it here for quick
        comparisons.
      </p>
      <Link
        href="/shop"
        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-400"
        onClick={closeFavDrawer}
      >
        Discover products
      </Link>
    </div>
  );

  const handleMoveToCart = (product) => {
    AddAndRemoveCartFromFavourites(product);
  };

  return (
    <AquaReuseDrawer
      open={favDrawer}
      close={closeFavDrawer}
      title="Saved products"
    >
      <div className="flex h-full flex-col">
        <div className="flex justify-end px-4 pt-3">
          <button
            type="button"
            onClick={closeFavDrawer}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="Close favourites drawer"
          >
            ×
          </button>
        </div>
        <div className="border-b border-slate-100 px-4 py-4 text-sm text-slate-600">
          {favData.length} item{favData.length === 1 ? "" : "s"} curated
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {favData.length === 0 ? (
            renderEmptyState()
          ) : (
            <ul className="space-y-4">
              {favData.map((product) => {
                const id = product?._id || product?.id;
                const image = product?.photos?.[0]?.secure_url;
                const productUrl =
                  product?.href || (id ? `/product/${id}` : "#");
                const inCart = isProductInCart(id);

                return (
                  <li
                    key={id}
                    className="group flex gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-emerald-200"
                  >
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-slate-100">
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

                    <div className="flex flex-1 flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <Link
                            href={productUrl}
                            className="text-sm font-medium text-slate-900 hover:text-emerald-600"
                          >
                            {product?.title || "Untitled product"}
                          </Link>
                          <p className="text-sm font-semibold text-emerald-600">
                            {formatCurrencyINR(product?.price || 0)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFavProduct(id)}
                          className="rounded-full p-2 text-xs text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                          aria-label="Remove from favourites"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
                          Popular choice
                        </span>
                      
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleMoveToCart(product)}
                          disabled={inCart}
                          className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow transition ${
                            inCart
                              ? "cursor-not-allowed bg-slate-200 text-slate-500"
                              : "bg-emerald-500 text-white hover:bg-emerald-400"
                          }`}
                        >
                          {inCart ? "Already in cart" : "Move to cart"}
                        </button>
                        <Link
                          href={productUrl}
                          className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
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
