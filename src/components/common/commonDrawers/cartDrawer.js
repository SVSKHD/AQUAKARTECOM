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
  const { cartDrawer, cartData } = useSelector((state) => ({ ...state }));
  const { closeCartDrawer } = useDrawer();
  const { formatCurrencyINR } = useCurrency;
  const { getTotalPrice, changeItemQuantity } = useCart();
  const { EmptyCart, removeFromCart } = useProduct();

  const subtotal = getTotalPrice(cartData);
  const totalItems = cartData.reduce(
    (acc, item) => acc + (item.quantity || 0),
    0,
  );
  const qualifiesForFreeShipping = subtotal >= 10000;

  const handleQuantityChange = (id, quantity) => {
    if (!id) return;
    const clamped = Math.min(Math.max(quantity, 1), MAX_QTY);
    changeItemQuantity(id, clamped);
  };

  const renderEmptyState = () => (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-emerald-500">
        🛒
      </div>
      <p className="text-lg font-semibold text-slate-900">Your cart is empty</p>
      <p className="text-sm text-slate-500">
        Add products to compare specs or book an installation slot.
      </p>
      <Link
        href="/shop"
        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-400"
        onClick={closeCartDrawer}
      >
        Browse catalog
      </Link>
    </div>
  );

  return (
    <AquaReuseDrawer
      open={cartDrawer}
      close={closeCartDrawer}
      title="Your cart"
    >
      <div className="flex h-full flex-col">
        <div className="flex justify-end px-4 pt-3">
          <button
            type="button"
            onClick={closeCartDrawer}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="Close cart drawer"
          >
            ×
          </button>
        </div>
        <div className="space-y-2 border-b border-slate-100 px-4 py-4 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>
              {totalItems} item{totalItems === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={EmptyCart}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600"
              disabled={!cartData.length}
            >
              Clear cart
            </button>
          </div>
          {cartData.length > 0 && (
            <div
              className={`rounded-2xl border px-3 py-2 text-xs ${
                qualifiesForFreeShipping
                  ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              {qualifiesForFreeShipping
                ? "Great! You qualify for free installation support."
                : `Add products worth ${formatCurrencyINR(10000 - subtotal)} more for complimentary installation.`}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {cartData.length === 0 ? (
            renderEmptyState()
          ) : (
            <ul className="space-y-4">
              {cartData.map((product) => {
                console.log(product);
                const slug = product.slug || product.id;
                const image = product?.photos?.[0]?.secure_url;
                const productUrl = slug ? `/product/${slug}` : "#";
                const quantity = product.quantity || 1;
                const listPrice = Number(product?.price) || 0;
                const discountedPrice = Number(product?.discountPrice) || 0;
                const hasDiscount = Boolean(
                  product?.discountPriceStatus &&
                  discountedPrice > 0 &&
                  listPrice > 0 &&
                  discountedPrice < listPrice,
                );
                const effectiveUnitPrice =
                  hasDiscount && discountedPrice > 0
                    ? discountedPrice
                    : listPrice || discountedPrice;
                const strikeUnitPrice =
                  hasDiscount && listPrice ? listPrice : null;
                const lineTotal = effectiveUnitPrice * quantity;
                const strikeLineTotal =
                  strikeUnitPrice && quantity
                    ? strikeUnitPrice * quantity
                    : null;

                return (
                  <li
                    key={slug}
                    className="group flex gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-emerald-200"
                  >
                    <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-slate-100">
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
                    </div>

                    <div className="flex flex-1 flex-col justify-between gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <Link
                            href={productUrl}
                            className="text-sm font-medium text-slate-900 hover:text-emerald-600"
                          >
                            {product?.title || "Unnamed product"}
                          </Link>
                          {product?.sub_title && (
                            <p className="text-xs text-slate-500">
                              {product.sub_title}
                            </p>
                          )}
                          <div className="flex flex-col text-emerald-600">
                            {strikeUnitPrice ? (
                              <span className="text-xs text-slate-400 line-through">
                                {formatCurrencyINR(strikeUnitPrice)}
                              </span>
                            ) : null}
                            <p className="text-sm font-semibold">
                              {formatCurrencyINR(effectiveUnitPrice || 0)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(id)}
                          className="rounded-full p-2 text-xs text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                          aria-label="Remove item"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 text-xs">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityChange(id, quantity - 1)
                            }
                            className="h-8 w-8 rounded-l-full text-slate-500 transition hover:bg-slate-100"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-10 text-center text-sm font-semibold text-slate-700">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityChange(id, quantity + 1)
                            }
                            className="h-8 w-8 rounded-r-full text-slate-500 transition hover:bg-slate-100"
                            aria-label="Increase quantity"
                            disabled={quantity >= MAX_QTY}
                          >
                            +
                          </button>
                        </div>

                        <div className="flex flex-col text-right text-slate-600">
                          {strikeLineTotal ? (
                            <span className="text-xs text-slate-400 line-through">
                              Total {formatCurrencyINR(strikeLineTotal)}
                            </span>
                          ) : null}
                          <span className="text-sm font-medium">
                            Total {formatCurrencyINR(lineTotal || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {cartData.length > 0 && (
          <div className="space-y-4 border-t border-slate-100 px-4 py-5">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="text-base font-semibold text-slate-900">
                {formatCurrencyINR(subtotal)}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Taxes and installation will be calculated at checkout.
            </p>
            <Link
              href="/checkout"
              className="flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-400"
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
