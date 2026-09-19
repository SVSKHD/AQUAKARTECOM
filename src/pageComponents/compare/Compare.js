import Link from "next/link";
import React, { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  BadgeCheck,
  Check,
  ExternalLink,
  Heart,
  IndianRupee,
  PackageCheck,
  ShoppingCart,
  Star,
  Tag,
  X,
} from "lucide-react";
import AquaToast from "@/components/reusables/react-toastify";

const stripHtml = (value = "") =>
  String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const referenceTitle = (value) => {
  if (!value) return "";
  if (typeof value === "object") return value.title || value.name || "";
  return "";
};

const getProductUrl = (product) => {
  const value = product?._id || product?.seoSlug || product?.slug;
  return value ? `/product/${encodeURIComponent(value)}` : "/shop";
};

const getCurrentPrice = (product) => {
  const regular = Number(product?.price) || 0;
  const discounted = Number(product?.discountPrice) || 0;
  return product?.discountPriceStatus &&
    discounted > 0 &&
    (!regular || discounted < regular)
    ? discounted
    : regular || discounted;
};

const getProductDetails = (product) => ({
  brand: product?.brand || "Not specified",
  category:
    referenceTitle(product?.category) ||
    product?.categoryTitle ||
    product?.categoryName ||
    "Not assigned",
  subcategory:
    referenceTitle(product?.subCategory) ||
    referenceTitle(product?.subcategory) ||
    product?.subCategoryTitle ||
    product?.subCategoryName ||
    "Not assigned",
  stock:
    Number.isFinite(Number(product?.stock)) && Number(product.stock) > 0
      ? `${Number(product.stock)} available`
      : "Check availability",
  rating:
    Number(product?.ratings) > 0
      ? `${Number(product.ratings).toFixed(1)} / 5 (${Number(
          product?.numberOfReviews || 0,
        )} reviews)`
      : "No reviews yet",
  capacity: product?.capacity || product?.coverage || "Not specified",
  code: product?.code || product?.sku || product?.ShortName || "Not specified",
});

const comparisonRows = [
  { key: "brand", label: "Brand", icon: Tag },
  { key: "category", label: "Category", icon: BadgeCheck },
  { key: "subcategory", label: "Solution type", icon: BadgeCheck },
  { key: "capacity", label: "Capacity / coverage", icon: PackageCheck },
  { key: "stock", label: "Availability", icon: Check },
  { key: "rating", label: "Customer rating", icon: Star },
  { key: "code", label: "Model / SKU", icon: Tag },
];

const AquaCompareTabContent = () => {
  const { compare = [], cartData = [], favData = [] } = useSelector(
    (state) => state,
  );
  const dispatch = useDispatch();

  const comparedProducts = useMemo(
    () =>
      compare.map((product) => ({
        product,
        details: getProductDetails(product),
        currentPrice: getCurrentPrice(product),
        description: stripHtml(product?.description),
      })),
    [compare],
  );

  const differingRows = useMemo(
    () =>
      new Set(
        comparisonRows
          .filter(({ key }) => {
            const values = comparedProducts.map(({ details }) => details[key]);
            return new Set(values).size > 1;
          })
          .map(({ key }) => key),
      ),
    [comparedProducts],
  );

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);

  const removeFromCompare = (productId) => {
    dispatch({ type: "REMOVE_FROM_COMPARE", payload: productId });
    AquaToast({ message: "Removed from comparison", type: "success" });
  };

  const addToCart = (product) => {
    const isInCart = cartData.some((item) => item._id === product._id);
    if (isInCart) return;
    dispatch({ type: "ADD_TO_CART", payload: product });
    AquaToast({ message: "Added to cart", type: "success" });
  };

  const addToFavorites = (product) => {
    const isInFav = favData.some((item) => item._id === product._id);
    if (isInFav) return;
    dispatch({ type: "ADD_TO_FAV", payload: product });
    AquaToast({ message: "Added to favourites", type: "success" });
  };

  if (!comparedProducts.length) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white/65 px-6 py-20 text-center shadow-sm backdrop-blur-xl">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-indigo-50 text-indigo-500">
          <BadgeCheck className="h-9 w-9" />
        </div>
        <h2 className="mt-6 text-2xl font-black tracking-[-0.04em] text-slate-950">
          Choose products to compare
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
          Add two or more products from the shop to see their prices and
          important details side by side.
        </p>
        <Link
          href="/shop"
          className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-indigo-700"
        >
          Browse products <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-0 py-2">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
            Product comparison
          </span>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-slate-950 sm:text-3xl">
            Compare what matters
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Differences are highlighted. Scroll sideways on smaller screens.
          </p>
        </div>
        <span className="w-fit rounded-full border border-slate-200 bg-white/75 px-3 py-2 text-xs font-bold text-slate-600">
          {comparedProducts.length}{" "}
          {comparedProducts.length === 1 ? "product" : "products"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-[1.75rem] border border-white/80 bg-white/70 shadow-[0_24px_70px_rgba(15,23,42,0.1)] backdrop-blur-2xl">
        <div
          className="grid min-w-max"
          style={{
            gridTemplateColumns: `160px repeat(${comparedProducts.length}, minmax(250px, 1fr))`,
          }}
        >
          <div className="sticky left-0 z-20 border-b border-r border-slate-200 bg-[rgba(248,250,252,0.97)] p-4">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Products
            </span>
            <p className="mt-2 max-w-[120px] text-xs leading-5 text-slate-400">
              Review every key detail in one place.
            </p>
          </div>

          {comparedProducts.map(
            ({ product, currentPrice, description }, productIndex) => {
              const isInCart = cartData.some(
                (item) => item._id === product._id,
              );
              const isInFav = favData.some((item) => item._id === product._id);
              const originalPrice = Number(product?.price) || 0;
              const hasDiscount =
                product?.discountPriceStatus &&
                currentPrice > 0 &&
                originalPrice > currentPrice;
              const image =
                product?.photos?.[0]?.delivery_url ||
                product?.photos?.[0]?.secure_url;

              return (
                <article
                  key={product._id || productIndex}
                  className="relative border-b border-r border-slate-200 p-4 last:border-r-0"
                >
                  <button
                    type="button"
                    onClick={() => removeFromCompare(product._id)}
                    className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Remove ${product.title} from comparison`}
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <Link
                    href={getProductUrl(product)}
                    className="block rounded-2xl outline-none ring-indigo-500 focus-visible:ring-2"
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-slate-50">
                      {image ? (
                        <img
                          src={image}
                          alt={product.title || "Aquakart product"}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-xs font-bold text-slate-400">
                          Image unavailable
                        </div>
                      )}
                    </div>
                    <h3 className="mt-4 min-h-12 text-base font-black leading-6 text-slate-950">
                      {product.title || "Aquakart product"}
                    </h3>
                  </Link>

                  <p className="mt-2 line-clamp-3 min-h-[60px] text-xs leading-5 text-slate-500">
                    {description || "Product information is available on the details page."}
                  </p>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      <IndianRupee className="h-3 w-3" /> Current price
                    </span>
                    <div className="mt-1 flex flex-wrap items-end gap-2">
                      <strong className="text-xl font-black text-slate-950">
                        {formatPrice(currentPrice)}
                      </strong>
                      {hasDiscount ? (
                        <span className="pb-0.5 text-xs text-slate-400 line-through">
                          {formatPrice(originalPrice)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-[1fr_42px] gap-2">
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={isInCart}
                      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition ${
                        isInCart
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-950 text-white hover:bg-indigo-700"
                      }`}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {isInCart ? "In cart" : "Add to cart"}
                    </button>
                    <button
                      type="button"
                      onClick={() => addToFavorites(product)}
                      disabled={isInFav}
                      className={`grid min-h-11 place-items-center rounded-xl border transition ${
                        isInFav
                          ? "border-rose-200 bg-rose-50 text-rose-500"
                          : "border-slate-200 bg-white text-slate-500 hover:text-rose-500"
                      }`}
                      aria-label={
                        isInFav ? "Already in favourites" : "Add to favourites"
                      }
                    >
                      <Heart
                        className={`h-4 w-4 ${isInFav ? "fill-current" : ""}`}
                      />
                    </button>
                  </div>
                </article>
              );
            },
          )}

          {comparisonRows.map(({ key, label, icon: Icon }) => {
            const differs = differingRows.has(key);
            return (
              <React.Fragment key={key}>
                <div
                  className={`sticky left-0 z-10 flex items-center gap-2 border-b border-r border-slate-200 p-4 ${
                    differs
                      ? "bg-indigo-50 text-indigo-900"
                      : "bg-[rgba(248,250,252,0.97)] text-slate-700"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-black">{label}</span>
                </div>
                {comparedProducts.map(({ product, details }, index) => (
                  <div
                    key={`${product._id || index}-${key}`}
                    className={`border-b border-r border-slate-200 p-4 text-sm font-semibold last:border-r-0 ${
                      differs
                        ? "bg-indigo-50/55 text-indigo-950"
                        : "bg-white/50 text-slate-700"
                    }`}
                  >
                    {details[key]}
                  </div>
                ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AquaCompareTabContent;
