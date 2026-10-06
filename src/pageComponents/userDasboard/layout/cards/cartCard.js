import Link from "next/link";
import { useSelector } from "react-redux";
import { Heart, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import LazyImage from "@/components/image/LazyImage";
import { FALLBACK_IMAGE } from "@/constants/images";
import useProduct from "@/utils/product";
import useCart from "@/utils/cart";

const MAX_QTY = 5;

const ensureArray = (value) => (Array.isArray(value) ? value : []);

export const formatINR = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return numeric.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
};

export const getUnitPrice = (product) =>
  Number(
    product?.discountPriceStatus ? product?.discountPrice : product?.price,
  ) || 0;

/** Amount saved per unit when a discount is active. */
export const getUnitSaving = (product) => {
  if (!product?.discountPriceStatus) return 0;
  const saving = Number(product?.price) - Number(product?.discountPrice);
  return saving > 0 ? saving : 0;
};

const getImage = (product) => {
  const first = ensureArray(product?.photos).find(Boolean);
  if (typeof first === "string") return first;
  return first?.secure_url || first?.url || FALLBACK_IMAGE;
};

const getHref = (product) => {
  const slug = product?.slug || product?._id || product?.id;
  return slug ? `/product/${slug}` : "/shop";
};

const getTitle = (product) =>
  product?.title || product?.name || "Aquakart product";

const getBrand = (product) =>
  product?.brand || product?.manufacturer || "Aquakart";

const isOutOfStock = (product) => {
  if (product?.inStock === false) return true;
  const stock = Number(product?.stock);
  return product?.stock !== undefined && product?.stock !== null && stock <= 0;
};

const Thumb = ({ product, className = "" }) => (
  <Link
    href={getHref(product)}
    className={`relative block shrink-0 overflow-hidden rounded-2xl bg-slate-100 ${className}`}
    aria-label={getTitle(product)}
  >
    <LazyImage
      src={getImage(product)}
      alt={getTitle(product)}
      fill
      sizes="160px"
      className="absolute inset-0"
      imgClassName="object-cover"
    />
  </Link>
);

const PriceBlock = ({ product, quantity = 1, size = "base" }) => {
  const unit = getUnitPrice(product);
  const saving = getUnitSaving(product);
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span
        className={`font-black text-slate-950 ${size === "lg" ? "text-lg" : "text-base"}`}
      >
        {formatINR(unit * quantity)}
      </span>
      {saving > 0 && (
        <span className="text-xs text-slate-400 line-through">
          {formatINR(Number(product.price) * quantity)}
        </span>
      )}
    </div>
  );
};

/** Compact read-only row used in overview previews. */
export const MiniProductRow = ({ product }) => (
  <Link
    href={getHref(product)}
    className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-slate-50"
  >
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
      <LazyImage
        src={getImage(product)}
        alt={getTitle(product)}
        fill
        sizes="56px"
        className="absolute inset-0"
        imgClassName="object-cover"
      />
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-slate-900">
        {getTitle(product)}
      </p>
      <p className="text-xs text-slate-500">
        {product?.quantity ? `Qty ${product.quantity} · ` : ""}
        {getBrand(product)}
      </p>
    </div>
    <span className="shrink-0 text-sm font-bold text-slate-950">
      {formatINR(getUnitPrice(product) * (product?.quantity || 1))}
    </span>
  </Link>
);

/** A cart line: thumbnail, details, quantity stepper and actions. */
export const CartLineItem = ({ product }) => {
  const favData = useSelector((state) => state.favData);
  const { AddAndRemoveFav, removeFromCart } = useProduct();
  const { changeItemQuantity } = useCart();
  const quantity = product?.quantity || 1;
  const id = product?._id;
  const saved = ensureArray(favData).some((item) => item?._id === id);
  const outOfStock = isOutOfStock(product);

  const saveForLater = () => {
    if (!saved) AddAndRemoveFav(product, () => {});
    removeFromCart(id);
  };

  return (
    <article className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-3 sm:p-4">
      <Thumb product={product} className="h-24 w-24 sm:h-28 sm:w-28" />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              {getBrand(product)}
            </p>
            <Link
              href={getHref(product)}
              className="line-clamp-2 text-sm font-bold leading-snug text-slate-950 hover:text-emerald-700 sm:text-base"
            >
              {getTitle(product)}
            </Link>
            {outOfStock && (
              <p className="mt-1 text-xs font-semibold text-rose-600">
                Currently out of stock
              </p>
            )}
          </div>
          <div className="hidden text-right sm:block">
            <PriceBlock product={product} quantity={quantity} size="lg" />
            {quantity > 1 && (
              <p className="text-xs text-slate-500">
                {formatINR(getUnitPrice(product))} each
              </p>
            )}
          </div>
        </div>

        <div className="mt-1 sm:hidden">
          <PriceBlock product={product} quantity={quantity} />
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <div className="inline-flex items-center rounded-full border border-slate-200">
            <button
              type="button"
              onClick={() => changeItemQuantity(id, quantity - 1)}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="grid h-8 w-8 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span
              className="w-7 text-center text-sm font-bold text-slate-900"
              aria-live="polite"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => changeItemQuantity(id, quantity + 1)}
              disabled={quantity >= MAX_QTY}
              aria-label="Increase quantity"
              className="grid h-8 w-8 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={saveForLater}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <Heart className="h-3.5 w-3.5" />
              Save for later
            </button>
            <button
              type="button"
              onClick={() => removeFromCart(id)}
              aria-label={`Remove ${getTitle(product)} from cart`}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Remove</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

/** Saved-item card for the favourites grid. */
const DashboardProductCard = ({ product = {} }) => {
  const cartData = useSelector((state) => state.cartData);
  const { AddAndRemoveCartFromFavourites, removeFavProduct } = useProduct();
  const inCart = ensureArray(cartData).some(
    (item) => item?._id === product?._id,
  );
  const outOfStock = isOutOfStock(product);
  const saving = getUnitSaving(product);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition-colors hover:border-emerald-300">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Link href={getHref(product)} aria-label={getTitle(product)}>
          <LazyImage
            src={getImage(product)}
            alt={getTitle(product)}
            fill
            sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 90vw"
            className="absolute inset-0"
            imgClassName="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
        {saving > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">
            Save {formatINR(saving)}
          </span>
        )}
        <button
          type="button"
          onClick={() => removeFavProduct(product?._id)}
          aria-label={`Remove ${getTitle(product)} from saved items`}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-rose-500 shadow-sm transition hover:bg-rose-50"
        >
          <Heart className="h-4 w-4 fill-current" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
          {getBrand(product)}
        </p>
        <Link
          href={getHref(product)}
          className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-slate-950 hover:text-emerald-700"
        >
          {getTitle(product)}
        </Link>
        <div className="mt-2">
          <PriceBlock product={product} />
        </div>
        {outOfStock && (
          <p className="mt-1 text-xs font-semibold text-rose-600">
            Currently out of stock
          </p>
        )}

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={() => AddAndRemoveCartFromFavourites(product)}
            disabled={inCart}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:bg-emerald-50 disabled:text-emerald-700"
          >
            <ShoppingCart className="h-4 w-4" />
            {inCart ? "In your cart" : "Move to cart"}
          </button>
        </div>
      </div>
    </article>
  );
};

export default DashboardProductCard;
