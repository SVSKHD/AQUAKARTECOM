import { useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import AquaReuseDrawer from "../../reusables/drawer";
import useDrawer from "@/utils/drawer";
import useCurrency from "@/utils/currency";
import useCart from "@/utils/cart";
import useProduct from "@/utils/product";
import AquaImage from "@/components/images/AquaImage";
import Link from "next/link";

const MAX_QTY = 5;

const AquaCartDrawer = () => {
  const cartDrawer = useSelector((state) => state.cartDrawer);
  const cartData = useSelector((state) => state.cartData);
  const { closeCartDrawer } = useDrawer();
  const { formatCurrencyINR } = useCurrency;
  const { getTotalPrice, changeItemQuantity } = useCart();
  const { EmptyCart, removeFromCart } = useProduct();

  const subtotal = useMemo(() => getTotalPrice(), [getTotalPrice]);
  const totalItems = useMemo(
    () => cartData.reduce((acc, item) => acc + (item.quantity || 1), 0),
    [cartData],
  );
  const qualifiesForFreeShipping = subtotal >= 10000;

  const handleQuantityChange = useCallback(
    (id, quantity) => {
      if (!id) return;
      changeItemQuantity(id, quantity);
    },
    [changeItemQuantity],
  );

  return (
    <AquaReuseDrawer
      open={cartDrawer}
      close={closeCartDrawer}
      title="Your cart"
    >
      <div className="flex h-full flex-col">
        {/* Header info */}
        <div className="space-y-2 border-b border-white/20 px-4 py-4 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {totalItems} item{totalItems === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={EmptyCart}
              className="btn-glass rounded-full bg-rose-50/80 px-3 py-1.5 text-xs font-medium text-rose-600 backdrop-blur-sm hover:bg-rose-100 active:scale-95"
              disabled={!cartData.length}
            >
              Clear cart
            </button>
          </div>
          {cartData.length > 0 && (
            <div
              className={`rounded-2xl border px-3 py-2.5 text-xs font-medium backdrop-blur-sm ${
                qualifiesForFreeShipping
                  ? "border-emerald-200/50 bg-emerald-50/60 text-emerald-700"
                  : "border-slate-200/50 bg-slate-50/60 text-slate-500"
              }`}
            >
              {qualifiesForFreeShipping
                ? "Great! You qualify for free installation support."
                : `Add products worth ${formatCurrencyINR(10000 - subtotal)} more for complimentary installation.`}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {cartData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100/60 backdrop-blur-sm">
                <span className="text-2xl">🛒</span>
              </div>
              <p className="text-lg font-semibold text-slate-900">
                Your cart is empty
              </p>
              <p className="text-sm text-slate-500">
                Add products to compare specs or book an installation slot.
              </p>
              <Link
                href="/shop"
                className="btn-glass btn-glass-primary"
                onClick={closeCartDrawer}
              >
                Browse catalog
              </Link>
            </div>
          ) : (
            <ul className="space-y-3 pr-1">
              {cartData.map((product) => {
                const slug = product.slug || product.id;
                const image = product?.photos?.[0]?.secure_url;
                const productUrl = slug ? `/product/${slug}` : "#";
                const quantity = product.quantity || 1;
                const listPrice = Number(product?.price) || 0;
                const discountedPrice = Number(product?.discountPrice) || 0;
                const hasDiscount =
                  product?.discountPriceStatus &&
                  discountedPrice > 0 &&
                  discountedPrice < listPrice;
                const effectiveUnitPrice = hasDiscount
                  ? discountedPrice
                  : listPrice || discountedPrice;
                const lineTotal = effectiveUnitPrice * quantity;

                return (
                  <li
                    key={slug}
                    className="glass-card group flex flex-col gap-3 rounded-2xl p-3 transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] sm:flex-row sm:p-4"
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-24">
                      <div className="aspect-square sm:aspect-auto sm:h-full sm:w-full">
                        <Link href={productUrl} onClick={closeCartDrawer}>
                          {image ? (
                            <AquaImage
                              src={image}
                              alt={product?.title || "Aquakart product"}
                              customClass="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-slate-400">
                              No image
                            </div>
                          )}
                        </Link>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-between gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <Link
                            href={productUrl}
                            onClick={closeCartDrawer}
                            className="text-sm font-semibold text-slate-900 hover:text-emerald-600 transition-colors"
                          >
                            {product?.title || "Unnamed product"}
                          </Link>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-emerald-600">
                              {formatCurrencyINR(effectiveUnitPrice || 0)}
                            </p>
                            {hasDiscount && (
                              <span className="text-xs text-slate-400 line-through">
                                {formatCurrencyINR(listPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(product._id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100/60 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 active:scale-90"
                          aria-label="Remove item"
                        >
                          <span className="text-sm leading-none">×</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-full border border-white/50 bg-white/40 backdrop-blur-sm text-xs shadow-sm">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityChange(product._id, quantity - 1)
                            }
                            className="h-8 w-8 rounded-l-full text-slate-500 transition hover:bg-white/80 active:scale-90"
                            aria-label="Decrease quantity"
                            disabled={quantity <= 1}
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-slate-800">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityChange(product._id, quantity + 1)
                            }
                            className="h-8 w-8 rounded-r-full text-slate-500 transition hover:bg-white/80 active:scale-90"
                            aria-label="Increase quantity"
                            disabled={quantity >= MAX_QTY}
                          >
                            +
                          </button>
                        </div>

                        <span className="text-sm font-semibold text-slate-700">
                          {formatCurrencyINR(lineTotal || 0)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cartData.length > 0 && (
          <div className="space-y-4 border-t border-white/20 px-4 py-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Subtotal</span>
              <span className="text-lg font-bold text-slate-900">
                {formatCurrencyINR(subtotal)}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Taxes and installation calculated at checkout.
            </p>
            <Link
              href="/checkout"
              className="btn-glass btn-glass-primary flex w-full items-center justify-center py-3.5"
              onClick={closeCartDrawer}
            >
              Proceed to checkout
            </Link>
          </div>
        )}
      </div>
    </AquaReuseDrawer>
  );
};

export default AquaCartDrawer;
