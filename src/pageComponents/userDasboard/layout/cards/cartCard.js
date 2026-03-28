import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  PackageX,
} from "lucide-react";
import { useSelector } from "react-redux";
import useProduct from "@/utils/product";

const FALLBACK_IMAGE =
  "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png";

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizePhotos = (photos) => {
  const list = ensureArray(photos)
    .map((entry, index) => {
      if (typeof entry === "string") {
        return { id: `photo-${index}`, url: entry };
      }

      if (entry?.secure_url) {
        return { id: entry._id || `photo-${index}`, url: entry.secure_url };
      }

      return null;
    })
    .filter(Boolean);

  if (list.length > 0) {
    return list;
  }

  return [{ id: "fallback", url: FALLBACK_IMAGE }];
};

const toCurrency = (value) => {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return null;
  return numeric.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
};

const getStockBadge = (product) => {
  if (product?.inStock === false) {
    return { label: "Out of stock", tone: "bg-rose-100 text-rose-700" };
  }

  const stockValue = product?.stock ?? product?.quantityAvailable;
  if (stockValue === undefined || stockValue === null) {
    return { label: "In stock", tone: "bg-emerald-100 text-emerald-700" };
  }

  let numericStock = 0;
  if (typeof stockValue === "number") {
    numericStock = stockValue;
  } else if (typeof stockValue === "string") {
    const parsed = Number(stockValue);
    if (!Number.isNaN(parsed)) {
      numericStock = parsed;
    }
  } else {
    try {
      const parsedObject = JSON.parse(stockValue);
      if (typeof parsedObject === "number") {
        numericStock = parsedObject;
      }
    } catch {
      numericStock = 0;
    }
  }

  if (numericStock <= 0) {
    return { label: "Out of stock", tone: "bg-rose-100 text-rose-700" };
  }

  if (numericStock < 5) {
    return {
      label: `Only ${numericStock} left`,
      tone: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: `In stock (${numericStock})`,
    tone: "bg-emerald-100 text-emerald-700",
  };
};

const DashboardProductCard = ({ product = {}, variant = "default" }) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const { favData = [], cartData = [] } = useSelector((state) => ({
    favData: ensureArray(state.favData),
    cartData: ensureArray(state.cartData),
  }));

  const {
    AddAndRemoveCartFromFavourites,
    AddAndRemoveFav,
    removeFromCart,
    removeFavProduct,
  } = useProduct();

  const normalized = useMemo(() => {
    const photos = normalizePhotos(product?.photos);
    const title =
      product?.title ||
      product?.name ||
      product?.productName ||
      "Aquakart product";
    const slug = product?.slug || product?._id || product?.id;
    const href = slug ? `/product/${slug}` : "/product";
    const brand =
      product?.brand ||
      product?.manufacturer ||
      product?.brandName ||
      "Aquakart";
    const description =
      product?.shortDescription ||
      (typeof product?.description === "string"
        ? product.description
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
        : "") ||
      "Discover Aquakart's trusted water solutions.";

    const price = product?.discountPriceStatus
      ? product?.discountPrice
      : product?.price;
    const priceLabel = toCurrency(price);
    const originalLabel = product?.discountPriceStatus
      ? toCurrency(product?.price)
      : null;

    const stockBadge = getStockBadge(product);
    const quantity = product?.quantity || product?.qty || 1;

    const ratingValue =
      Number(product?.rating?.value || product?.rating) || null;
    const ratingCount =
      Number(product?.rating?.count || product?.reviews) || null;

    return {
      photos,
      title,
      href,
      brand,
      description,
      priceLabel,
      originalLabel,
      stockBadge,
      quantity,
      ratingValue,
      ratingCount,
      id: product?._id || product?.id,
      slug,
    };
  }, [product]);

  const isInCart = useMemo(
    () => cartData.some((item) => item?._id === normalized.id),
    [cartData, normalized.id],
  );

  const isInFav = useMemo(
    () => favData.some((item) => item?._id === normalized.id),
    [favData, normalized.id],
  );

  const showPreviousPhoto = () => {
    setPhotoIndex(
      (prev) =>
        (prev - 1 + normalized.photos.length) % normalized.photos.length,
    );
  };

  const showNextPhoto = () => {
    setPhotoIndex((prev) => (prev + 1) % normalized.photos.length);
  };

  const handleMoveToFavourites = () => {
    if (!isInFav) {
      AddAndRemoveFav(product, () => {});
    }
    if (normalized.id) {
      removeFromCart(normalized.id);
    }
  };

  const handleRemoveFromCart = () => {
    if (normalized.id) {
      removeFromCart(normalized.id);
    }
  };

  const handleAddToCartFromFav = () => {
    AddAndRemoveCartFromFavourites(product);
  };

  const handleToggleFav = () => {
    AddAndRemoveFav(product, () => {});
  };

  const handleRemoveFavourite = () => {
    if (normalized.id) {
      removeFavProduct(normalized.id);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl glass-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
        <Image
          src={normalized.photos[photoIndex]?.url || FALLBACK_IMAGE}
          alt={normalized.title}
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 300px, (min-width: 768px) 260px, 80vw"
          priority={false}
        />

        {normalized.photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPreviousPhoto}
              className="absolute left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/80 p-2 text-slate-600 shadow-sm transition hover:bg-white sm:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={showNextPhoto}
              className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/80 p-2 text-slate-600 shadow-sm transition hover:bg-white sm:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
              {normalized.photos.map((photo) => (
                <span
                  key={photo.id}
                  className={`h-1.5 w-6 rounded-full transition ${
                    photo.id === normalized.photos[photoIndex]?.id
                      ? "bg-emerald-500"
                      : "bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {normalized.originalLabel ? (
          <span className="absolute left-3 top-3 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Save
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-4 sm:p-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
            {normalized.brand}
          </span>
          <Link
            href={normalized.href}
            className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 transition hover:text-emerald-600"
          >
            {normalized.title}
          </Link>
          <p className="line-clamp-2 text-xs text-slate-500">
            {normalized.description}
          </p>
        </div>

        <div className="flex items-baseline gap-3">
          {normalized.priceLabel ? (
            <span className="text-xl font-semibold text-slate-900">
              {normalized.priceLabel}
            </span>
          ) : null}
          {normalized.originalLabel ? (
            <span className="text-sm text-slate-400 line-through">
              {normalized.originalLabel}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${normalized.stockBadge.tone}`}
          >
            {normalized.stockBadge.label.includes("Out") ? (
              <PackageX className="h-3.5 w-3.5" />
            ) : (
              <PackageCheck className="h-3.5 w-3.5" />
            )}
            {normalized.stockBadge.label}
          </span>
          {variant === "cart" && normalized.quantity ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-600">
              Qty: {normalized.quantity}
            </span>
          ) : null}
          {normalized.ratingValue ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-amber-700">
              ★ {normalized.ratingValue.toFixed(1)}
              {normalized.ratingCount ? ` (${normalized.ratingCount})` : ""}
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          {variant === "cart" ? (
            <>
              <button
                type="button"
                onClick={handleMoveToFavourites}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 sm:px-4 sm:py-2 sm:text-sm"
              >
                <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Move to favourites
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRemoveFromCart}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400/60 focus:ring-offset-1 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Remove
                </button>
                <Link
                  href={normalized.href}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:ring-offset-1 sm:px-4 sm:py-2 sm:text-sm"
                >
                  View
                </Link>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAddToCartFromFav}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/80 focus:ring-offset-1 sm:px-4 sm:py-2 sm:text-sm"
              >
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {isInCart ? "Already in cart" : "Add to cart"}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRemoveFavourite}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400/60 focus:ring-offset-1 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Remove
                </button>
                <button
                  type="button"
                  onClick={handleToggleFav}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 sm:px-4 sm:py-2 sm:text-sm ${
                    isInFav
                      ? "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      : "border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                  }`}
                >
                  <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {isInFav ? "Saved" : "Save"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardProductCard;
