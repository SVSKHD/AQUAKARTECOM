import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import {
  ArrowRight,
  Check,
  ChevronRight,
  GitCompare,
  Heart,
  Info,
  Scale,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import useCurrency from "@/utils/currency";
import AquaToast from "@/components/reusables/react-toastify";

const FALLBACK_IMAGE =
  "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png";

const stripHtml = (value) => {
  if (!value || typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
};

const resolveDisplayText = (input) => {
  if (input === null || input === undefined) return "";
  if (typeof input === "string") return stripHtml(input).trim();
  if (typeof input === "number" || typeof input === "boolean") {
    return String(input);
  }

  if (Array.isArray(input)) {
    return input
      .map((item) => resolveDisplayText(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof input === "object") {
    for (const key of [
      "title",
      "name",
      "label",
      "value",
      "displayName",
      "slug",
      "text",
      "description",
    ]) {
      const value = resolveDisplayText(input[key]);
      if (value) return value;
    }
  }

  return "";
};

const normalizeSpecificationSource = (source) => {
  if (!source) return [];

  if (Array.isArray(source)) {
    return source
      .map((item, index) => {
        if (typeof item === "string") {
          const [label, ...valueParts] = item.split(":");
          return valueParts.length
            ? {
                label: label.trim(),
                value: valueParts.join(":").trim(),
              }
            : {
                label: `Detail ${index + 1}`,
                value: item.trim(),
              };
        }

        if (item && typeof item === "object") {
          return {
            label: resolveDisplayText(
              item.label || item.title || item.name || item.key,
            ),
            value: resolveDisplayText(
              item.value || item.description || item.text || item.detail,
            ),
          };
        }

        return null;
      })
      .filter((item) => item?.label && item?.value);
  }

  if (typeof source === "object") {
    return Object.entries(source)
      .map(([label, value]) => ({
        label: label
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/[_-]+/g, " "),
        value: resolveDisplayText(value),
      }))
      .filter((item) => item.value);
  }

  return [];
};

const getProductPrice = (product) => {
  const candidates = [
    product?.pricing?.finalPrice,
    product?.finalPrice,
    product?.discountPriceStatus ? product?.discountPrice : null,
    product?.salePrice,
    product?.price,
  ];

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }

  return 0;
};

const getProductImage = (product) => {
  const photos = Array.isArray(product?.photos) ? product.photos : [];
  const photo = photos[0];

  if (typeof photo === "string") return photo;
  return (
    photo?.delivery_url ||
    photo?.secure_url ||
    photo?.url ||
    product?.image ||
    FALLBACK_IMAGE
  );
};

const getProductHref = (product) => {
  if (product?.slug) return `/product/${product.slug}`;
  if (product?._id) return `/product/${product._id}`;
  return "/shop";
};

const buildProductSpecs = (product, formatCurrencyINR) => {
  const entries = [
    [
      "Price",
      getProductPrice(product) > 0
        ? formatCurrencyINR(getProductPrice(product))
        : "",
    ],
    ["Brand", resolveDisplayText(product?.brand || product?.manufacturer)],
    ["Model", resolveDisplayText(product?.model)],
    ["Category", resolveDisplayText(product?.category)],
    ["Subcategory", resolveDisplayText(product?.subCategory || product?.subcategory)],
    ["Capacity", resolveDisplayText(product?.capacity)],
    ["Coverage", resolveDisplayText(product?.coverage)],
    ["Warranty", resolveDisplayText(product?.warranty)],
    ["Application", resolveDisplayText(product?.application)],
    ["SKU", resolveDisplayText(product?.sku)],
  ];

  const extended = [
    product?.specifications,
    product?.technicalSpecifications,
    product?.specs,
  ].flatMap(normalizeSpecificationSource);

  const map = new Map();

  [...entries.map(([label, value]) => ({ label, value })), ...extended].forEach(
    ({ label, value }) => {
      const cleanLabel = resolveDisplayText(label);
      const cleanValue = resolveDisplayText(value);
      if (!cleanLabel || !cleanValue) return;

      const normalized = cleanLabel.toLowerCase();
      if (!map.has(normalized)) {
        map.set(normalized, {
          label: cleanLabel,
          value: cleanValue,
        });
      }
    },
  );

  return map;
};

const coreOrder = [
  "price",
  "brand",
  "model",
  "category",
  "subcategory",
  "capacity",
  "coverage",
  "warranty",
  "application",
  "sku",
];

const labelPriority = (label) => {
  const index = coreOrder.indexOf(label.toLowerCase());
  return index === -1 ? 100 : index;
};

const ProductHeaderCard = ({
  product,
  lowestPrice,
  isInCart,
  isInFav,
  onRemove,
  onCart,
  onFav,
  onOpen,
  formatCurrencyINR,
}) => {
  const price = getProductPrice(product);
  const description = stripHtml(
    product?.shortDescription || product?.description || "",
  );
  const brand =
    resolveDisplayText(product?.brand || product?.manufacturer) || "Aquakart";

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
        aria-label={`Remove ${product?.title || "product"} from comparison`}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
        <img
          src={getProductImage(product)}
          alt={product?.title || "Aquakart product"}
          className="h-full w-full object-contain p-5"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent px-4 pb-3 pt-10">
          <span className="max-w-[58%] truncate text-[10px] font-black uppercase tracking-[0.14em] text-white/80">
            {brand}
          </span>
          {lowestPrice && price > 0 ? (
            <span className="rounded-full bg-emerald-300 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-950">
              Lowest price
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="min-h-[72px]">
          <h3 className="line-clamp-2 text-lg font-black leading-6 tracking-[-0.025em] text-slate-950">
            {product?.title || "Aquakart product"}
          </h3>
          {description ? (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
              {description}
            </p>
          ) : null}
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Listed price
          </p>
          <p className="mt-1 text-2xl font-black tracking-[-0.035em] text-slate-950">
            {price > 0 ? formatCurrencyINR(price) : "Not listed"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product?.capacity ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-sm">
                {resolveDisplayText(product.capacity)}
              </span>
            ) : null}
            {product?.coverage ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-sm">
                {resolveDisplayText(product.coverage)}
              </span>
            ) : null}
            {product?.warranty ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-sm">
                {resolveDisplayText(product.warranty)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
          <button
            type="button"
            onClick={onCart}
            className={[
              "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black transition",
              isInCart
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-950 text-white hover:bg-emerald-700",
            ].join(" ")}
          >
            {isInCart ? (
              <Check className="h-4 w-4" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
            {isInCart ? "In cart" : "Add to cart"}
          </button>

          <button
            type="button"
            onClick={onFav}
            className={[
              "grid h-11 w-11 place-items-center rounded-2xl border transition",
              isInFav
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-600",
            ].join(" ")}
            aria-label={isInFav ? "Saved to wishlist" : "Add to wishlist"}
          >
            <Heart className={`h-4 w-4 ${isInFav ? "fill-current" : ""}`} />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="mt-2 inline-flex min-h-10 items-center justify-center gap-1 text-xs font-black text-emerald-700 transition hover:text-emerald-900"
        >
          View full product
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
};

const AquaCompareTabContent = () => {
  const { compare, cartData, favData } = useSelector((state) => ({
    compare: Array.isArray(state.compare) ? state.compare : [],
    cartData: Array.isArray(state.cartData) ? state.cartData : [],
    favData: Array.isArray(state.favData) ? state.favData : [],
  }));
  const { formatCurrencyINR } = useCurrency;
  const dispatch = useDispatch();
  const router = useRouter();
  const [differencesOnly, setDifferencesOnly] = useState(false);

  const comparison = useMemo(
    () =>
      compare
        .filter((product) => product && product._id)
        .slice(0, 4),
    [compare],
  );

  const prices = useMemo(
    () =>
      comparison
        .map((product) => getProductPrice(product))
        .filter((price) => price > 0),
    [comparison],
  );

  const lowestPrice = prices.length ? Math.min(...prices) : 0;
  const highestPrice = prices.length ? Math.max(...prices) : 0;

  const specMaps = useMemo(
    () =>
      comparison.map((product) =>
        buildProductSpecs(product, formatCurrencyINR),
      ),
    [comparison, formatCurrencyINR],
  );

  const allRows = useMemo(() => {
    const labels = new Map();

    specMaps.forEach((map) => {
      map.forEach((entry, key) => {
        if (!labels.has(key)) labels.set(key, entry.label);
      });
    });

    return Array.from(labels.entries())
      .map(([key, label]) => {
        const values = specMaps.map((map) => map.get(key)?.value || "");
        const normalizedValues = new Set(
          values.map((value) => String(value || "").trim().toLowerCase()),
        );

        return {
          key,
          label,
          values,
          different: normalizedValues.size > 1,
        };
      })
      .sort((a, b) => {
        const priorityDifference =
          labelPriority(a.label) - labelPriority(b.label);
        if (priorityDifference !== 0) return priorityDifference;
        return a.label.localeCompare(b.label);
      });
  }, [specMaps]);

  const visibleRows = useMemo(
    () =>
      differencesOnly ? allRows.filter((row) => row.different) : allRows,
    [allRows, differencesOnly],
  );

  const differenceCount = useMemo(
    () => allRows.filter((row) => row.different).length,
    [allRows],
  );

  const removeFromCompare = (productId) => {
    dispatch({
      type: "REMOVE_FROM_COMPARE",
      payload: productId,
    });
    AquaToast({ message: "Removed from comparison", type: "success" });
  };

  const addToCart = (product) => {
    if (cartData.some((item) => item?._id === product?._id)) return;
    dispatch({
      type: "ADD_TO_CART",
      payload: product,
    });
    AquaToast({ message: "Added to cart", type: "success" });
  };

  const addToFavorites = (product) => {
    if (favData.some((item) => item?._id === product?._id)) return;
    dispatch({
      type: "ADD_TO_FAV",
      payload: product,
    });
    AquaToast({ message: "Saved to wishlist", type: "success" });
  };

  if (comparison.length === 0) {
    return (
      <div className="mx-auto max-w-4xl py-10 sm:py-16">
        <div className="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.07)]">
          <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="grid min-h-[320px] place-items-center bg-slate-950 p-8 text-white">
              <div className="text-center">
                <span className="mx-auto grid h-20 w-20 place-items-center rounded-[1.75rem] bg-emerald-300 text-slate-950">
                  <GitCompare className="h-9 w-9" />
                </span>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                  Guest comparison
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.045em]">
                  Start with two products.
                </h2>
              </div>
            </div>

            <div className="flex flex-col justify-center p-7 sm:p-10">
              <h3 className="text-2xl font-black tracking-[-0.035em] text-slate-950">
                Nothing selected yet
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-7 text-slate-500">
                Add products from the shop, wishlist or cart. You can compare
                everything without creating an account.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push("/shop")}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  Browse products
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/softener-planner")}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Help me choose
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
              {comparison.length} selected
            </span>
            {comparison.length > 1 ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                {differenceCount} differences found
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
            Your shortlist, side by side.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Start with the quick scan, then use the specification matrix below
            for the details that separate one product from another.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/shop")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
        >
          Add another product
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-slate-400">
            <Scale className="h-4 w-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.16em]">
              Products
            </p>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {comparison.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Compare up to four at a time.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-slate-400">
            <Tag className="h-4 w-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.16em]">
              Price range
            </p>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {prices.length
              ? `${formatCurrencyINR(lowestPrice)} – ${formatCurrencyINR(highestPrice)}`
              : "Not listed"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Based on current listed prices.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-slate-400">
            <SlidersHorizontal className="h-4 w-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.16em]">
              Spec differences
            </p>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {differenceCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Rows where the listed details differ.
          </p>
        </div>
      </section>

      {comparison.length === 1 ? (
        <section className="flex flex-col gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h3 className="font-black text-amber-950">
                Add one more product to unlock comparison differences.
              </h3>
              <p className="mt-1 text-sm text-amber-800/75">
                You can still review this product below while building your
                shortlist.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/shop")}
            className="min-h-10 rounded-xl bg-amber-950 px-4 text-xs font-black text-white"
          >
            Find another
          </button>
        </section>
      ) : null}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Quick scan
            </p>
            <h3 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">
              Products at a glance
            </h3>
          </div>
          <p className="hidden text-xs text-slate-400 sm:block">
            Lowest listed price is highlighted automatically.
          </p>
        </div>

        <div className="overflow-x-auto pb-3">
          <div
            className="grid gap-4"
            style={{
              minWidth: `${Math.max(280 * comparison.length, 280)}px`,
              gridTemplateColumns: `repeat(${comparison.length}, minmax(260px, 1fr))`,
            }}
          >
            {comparison.map((product) => {
              const price = getProductPrice(product);
              const isInCart = cartData.some(
                (item) => item?._id === product?._id,
              );
              const isInFav = favData.some(
                (item) => item?._id === product?._id,
              );

              return (
                <ProductHeaderCard
                  key={product._id}
                  product={product}
                  lowestPrice={Boolean(price && price === lowestPrice)}
                  isInCart={isInCart}
                  isInFav={isInFav}
                  onRemove={() => removeFromCompare(product._id)}
                  onCart={() => addToCart(product)}
                  onFav={() => addToFavorites(product)}
                  onOpen={() => router.push(getProductHref(product))}
                  formatCurrencyINR={formatCurrencyINR}
                />
              );
            })}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Detailed comparison
            </p>
            <h3 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">
              Specification matrix
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Missing data is shown as “Not listed” instead of being guessed.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={differencesOnly}
              onChange={(event) => setDifferencesOnly(event.target.checked)}
              className="h-4 w-4 accent-emerald-600"
            />
            <span className="text-xs font-black text-slate-700">
              Show differences only
            </span>
          </label>
        </div>

        <div className="overflow-x-auto">
          <div
            style={{
              minWidth: `${220 + Math.max(220 * comparison.length, 440)}px`,
            }}
          >
            <div
              className="grid border-b border-slate-200 bg-slate-950 text-white"
              style={{
                gridTemplateColumns: `220px repeat(${comparison.length}, minmax(220px, 1fr))`,
              }}
            >
              <div className="sticky left-0 z-10 flex items-end bg-slate-950 p-4">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-white/60">
                  Specification
                </span>
              </div>
              {comparison.map((product) => (
                <div
                  key={product._id}
                  className="border-l border-white/10 p-4"
                >
                  <p className="line-clamp-2 text-sm font-black leading-5">
                    {product?.title || "Product"}
                  </p>
                </div>
              ))}
            </div>

            {visibleRows.length ? (
              visibleRows.map((row) => (
                <div
                  key={row.key}
                  className={[
                    "grid border-b border-slate-100 last:border-b-0",
                    row.different ? "bg-amber-50/45" : "bg-white",
                  ].join(" ")}
                  style={{
                    gridTemplateColumns: `220px repeat(${comparison.length}, minmax(220px, 1fr))`,
                  }}
                >
                  <div
                    className={[
                      "sticky left-0 z-10 flex items-center gap-2 border-r border-slate-100 p-4",
                      row.different ? "bg-amber-50" : "bg-white",
                    ].join(" ")}
                  >
                    {row.different ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                    ) : null}
                    <span className="text-xs font-black text-slate-700">
                      {row.label}
                    </span>
                  </div>

                  {row.values.map((value, index) => (
                    <div
                      key={`${row.key}-${comparison[index]?._id || index}`}
                      className={[
                        "flex min-h-[60px] items-center border-l border-slate-100 p-4 text-sm",
                        row.different
                          ? "font-semibold text-slate-950"
                          : "text-slate-600",
                      ].join(" ")}
                    >
                      {value || (
                        <span className="text-xs font-medium text-slate-400">
                          Not listed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="p-10 text-center">
                <Check className="mx-auto h-8 w-8 text-emerald-600" />
                <h4 className="mt-3 font-black text-slate-950">
                  No listed differences in this view
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Turn off “Show differences only” to see all available specs.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-[2rem] bg-slate-950 p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
            <Sparkles className="h-4 w-4" />
            Still deciding?
          </span>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.035em]">
            Use your home and water details to narrow the shortlist.
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            The softener planner can narrow products by household size,
            coverage and water hardness. It also works without login.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/softener-planner")}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 text-sm font-black text-emerald-950 transition hover:bg-white"
        >
          Open softener planner
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>
    </div>
  );
};

export default AquaCompareTabContent;
