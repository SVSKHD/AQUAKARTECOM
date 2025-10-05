import React, { useState, useEffect, Suspense, useMemo } from "react";
import {
  ShoppingCart,
  Heart,
  Truck,
  ShieldCheck,
  RefreshCcw,
  PhoneCall,
  Star,
  CheckCircle2,
  Clock3,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AquaHeader from "@/components/Layout/Header";
import AquaFooter from "@/components/Layout/Footer";
import useProduct from "@/utils/product";
import { useSelector } from "react-redux";
import AquafavDrawer from "@/components/common/commonDrawers/favDrawer";
import AquaCartDrawer from "@/components/common/commonDrawers/cartDrawer";
import useEmblaCarousel from "embla-carousel-react";

const AquaRelatedProductCard = React.lazy(
  () => import("@/components/cards/RelatedProductCard"),
);

const DEFAULT_FALLBACK_IMAGE =
  "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png";

const stripHtml = (value) => {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

const resolveDisplayText = (input) => {
  if (input === null || input === undefined) return "";
  if (typeof input === "string") return input.trim();
  if (typeof input === "number" || typeof input === "boolean") {
    return String(input);
  }

  if (Array.isArray(input)) {
    return input
      .map((item) => resolveDisplayText(item))
      .filter((item) => item && item.length > 0)
      .join(", ");
  }

  if (typeof input === "object") {
    const candidateKeys = [
      "title",
      "name",
      "label",
      "value",
      "displayName",
      "slug",
      "text",
    ];

    for (const key of candidateKeys) {
      if (input[key]) {
        return resolveDisplayText(input[key]);
      }
    }
  }

  return "";
};

const normalizeImages = (photos, fallbackImage) => {
  if (Array.isArray(photos) && photos.length > 0) {
    return photos
      .map((photo, index) => {
        if (photo?.secure_url) {
          return { id: photo._id || `photo-${index}`, url: photo.secure_url };
        }

        if (typeof photo === "string") {
          return { id: `photo-${index}`, url: photo };
        }

        return null;
      })
      .filter(Boolean);
  }

  return [{ id: "fallback", url: fallbackImage || DEFAULT_FALLBACK_IMAGE }];
};

const extractHighlightText = (value) => {
  if (!value) return null;
  if (typeof value === "string") return stripHtml(value);

  if (typeof value === "object") {
    const candidates = ["text", "title", "label", "description", "value"];
    for (const key of candidates) {
      if (typeof value[key] === "string" && value[key].trim()) {
        return stripHtml(value[key]);
      }
    }
  }

  return null;
};

const buildHighlights = (product) => {
  if (Array.isArray(product?.keyHighlights) && product.keyHighlights.length > 0) {
    return product.keyHighlights
      .map((item) => extractHighlightText(item))
      .filter((item) => item && item.length > 0)
      .slice(0, 6);
  }

  const description = product?.description;
  if (!description) return [];

  const listMatches = description.match(/<li[^>]*>(.*?)<\/li>/gis);
  if (listMatches && listMatches.length > 0) {
    return listMatches
      .map((item) => stripHtml(item))
      .filter((item) => item && item.length > 0)
      .slice(0, 6);
  }

  const fallbackHighlights = stripHtml(description)
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .filter((item) => item && item.length > 0)
    .slice(0, 4);

  return fallbackHighlights;
};

const getStockStatus = (stockCount) => {
  if (stockCount <= 0) {
    return {
      label: "Out of stock",
      tone: "border-rose-200 bg-rose-50 text-rose-600",
      Icon: XCircle,
    };
  }

  if (stockCount < 5) {
    return {
      label: stockCount === 1 ? "Only 1 left" : `Only ${stockCount} left`,
      tone: "border-amber-200 bg-amber-50 text-amber-600",
      Icon: Clock3,
    };
  }

  return {
    label: `In stock (${stockCount} available)`,
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Icon: CheckCircle2,
  };
};

const formatIndianCurrency = (value) => {
  if (value === null || value === undefined) return null;
  const amount = Number(value);
  if (Number.isNaN(amount)) return null;
  return amount.toLocaleString("en-IN");
};

function AquaServerDynamicProduct({
  product,
  related,
  stockCount = 0,
  fallbackImage = DEFAULT_FALLBACK_IMAGE,
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [cart, setCart] = useState(false);
  const [relatedEmblaRef, relatedEmblaApi] = useEmblaCarousel({
    align: "start",
    skipSnaps: false,
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const images = useMemo(
    () => normalizeImages(product?.photos, fallbackImage),
    [product?.photos, fallbackImage],
  );
  const highlights = useMemo(() => buildHighlights(product), [product]);
  const stockStatus = useMemo(() => getStockStatus(stockCount), [stockCount]);
  const relatedProducts = useMemo(() => {
    if (!Array.isArray(related)) return [];
    return related.filter((item) => item && (item.slug || item._id));
  }, [related]);

  const { cartData = [], favData = [] } = useSelector((state) => ({
    cartData: state.cartData || [],
    favData: state.favData || [],
  }));
  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();

  const ratingValue = Number(product?.rating?.value) || null;
  const ratingCount = Number(product?.rating?.count) || null;

  const discountPercentage = useMemo(() => {
    if (!product?.discountPriceStatus) return 0;
    const price = Number(product?.price);
    const discounted = Number(product?.discountPrice);
    if (Number.isNaN(price) || Number.isNaN(discounted) || price <= 0) return 0;
    return Math.round(((price - discounted) / price) * 100);
  }, [product?.discountPriceStatus, product?.price, product?.discountPrice]);

  const detailItems = useMemo(
    () =>
      [
        { label: "Brand", value: resolveDisplayText(product?.brand) },
        { label: "Model", value: resolveDisplayText(product?.model) },
        { label: "SKU", value: resolveDisplayText(product?.sku) },
        { label: "Category", value: resolveDisplayText(product?.category) },
        { label: "Warranty", value: resolveDisplayText(product?.warranty) },
        { label: "Capacity", value: resolveDisplayText(product?.capacity) },
        { label: "Coverage", value: resolveDisplayText(product?.coverage) },
      ].filter((item) => item.value),
    [
      product?.brand,
      product?.model,
      product?.sku,
      product?.category,
      product?.warranty,
      product?.capacity,
      product?.coverage,
    ],
  );

  const infoTiles = useMemo(
    () => [
      {
        Icon: Truck,
        title: "Same-day delivery (Hyderabad)",
        description:
          "Order before 1:00 PM to receive your purifier within Hyderabad city limits on the same day.",
      },
      {
        Icon: ShieldCheck,
        title: product?.warranty ? `${product.warranty} warranty support` : "Trusted warranty support",
        description: "Genuine manufacturer warranty backed by Aquakart service assistance.",
      },
      {
        Icon: RefreshCcw,
        title: "Easy replacements",
        description: "7-day doorstep assistance for manufacturing defects or transit issues.",
      },
      {
        Icon: PhoneCall,
        title: "Talk to water experts",
        description: "Need help choosing? Our team is a call away for a personalised recommendation.",
      },
    ],
    [product?.warranty],
  );

  useEffect(() => {
    if (!product?._id) return;
    const isProductInCart = cartData.some((item) => item?._id === product?._id);
    const isProductInFav = favData.some((item) => item?._id === product?._id);
    setCart(isProductInCart);
    setIsFavorite(isProductInFav);
  }, [cartData, favData, product?._id]);

  useEffect(() => {
    if (!relatedEmblaApi) return;

    const updateControls = () => {
      setCanScrollPrev(relatedEmblaApi.canScrollPrev());
      setCanScrollNext(relatedEmblaApi.canScrollNext());
    };

    updateControls();
    relatedEmblaApi.on("select", updateControls);
    relatedEmblaApi.on("reInit", updateControls);

    return () => {
      relatedEmblaApi.off("select", updateControls);
      relatedEmblaApi.off("reInit", updateControls);
    };
  }, [relatedEmblaApi]);

  useEffect(() => {
    if (images.length <= 1) return undefined;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    if (currentImageIndex >= images.length) {
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex, images.length]);

  const handleAddToCart = () => {
    AddAndRemoveCart(product, setCart);
  };

  const handleAddToFav = () => {
    AddAndRemoveFav(product, setIsFavorite);
  };

  const scrollRelatedPrev = () => {
    relatedEmblaApi?.scrollPrev();
  };

  const scrollRelatedNext = () => {
    relatedEmblaApi?.scrollNext();
  };

  const { Icon: StockIcon, tone, label } = stockStatus;
  const actualPrice = product?.discountPriceStatus
    ? product?.discountPrice
    : product?.price;
  const strikePrice = product?.discountPriceStatus ? product?.price : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <AquaHeader />
      <AquaCartDrawer />
      <AquafavDrawer />

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6 sm:pb-16 sm:pt-8 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm">
              <AnimatePresence mode="wait">
                <motion.img
                  key={images[currentImageIndex]?.id}
                  src={images[currentImageIndex]?.url}
                  alt={product?.title}
                  className="h-full w-full object-contain bg-white"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              </AnimatePresence>

              <button
                type="button"
                onClick={handleAddToFav}
                className="absolute right-6 top-6 rounded-full bg-white/90 p-3 shadow-lg transition hover:bg-white"
                aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
              >
                <Heart
                  className={`h-6 w-6 transition ${
                    isFavorite ? "text-rose-500" : "text-slate-600"
                  }`}
                  fill={isFavorite ? "currentColor" : "none"}
                />
              </button>
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border transition ${
                      index === currentImageIndex
                        ? "border-emerald-500"
                        : "border-transparent hover:border-emerald-200"
                    }`}
                    aria-label={`View product image ${index + 1}`}
                  >
                    <motion.img
                      src={image.url}
                      alt={`${product?.title} thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                      whileHover={{ scale: 1.05 }}
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {infoTiles.map(({ Icon, title, description }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                    <p className="mt-1 text-xs text-slate-600">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                {product?.brand || "Aquakart"}
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                {product?.title}
              </h1>

              {ratingValue && (
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="font-semibold">{ratingValue.toFixed(1)} / 5</span>
                  {ratingCount ? (
                    <span className="text-xs text-slate-500">({ratingCount} reviews)</span>
                  ) : null}
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-baseline gap-3">
                {actualPrice !== null && actualPrice !== undefined ? (
                  <p className="text-4xl font-bold tracking-tight text-slate-900">
                    ₹{formatIndianCurrency(actualPrice)}
                  </p>
                ) : null}
                {strikePrice ? (
                  <p className="text-lg text-slate-400 line-through">
                    ₹{formatIndianCurrency(strikePrice)}
                  </p>
                ) : null}
                {discountPercentage > 0 ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-600">
                    Save {discountPercentage}%
                  </span>
                ) : null}
              </div>

              <div
                className={`mt-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${tone}`}
              >
                <StockIcon className="h-4 w-4" />
                <span>{label}</span>
              </div>

              {detailItems.length > 0 && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {detailItems.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {item.label}
                      </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {stripHtml(item.value)}
                  </p>
                </div>
              ))}
            </div>
          )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <motion.button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                    cart ? "bg-emerald-600 hover:bg-emerald-500" : "bg-slate-900 hover:bg-slate-800"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    {cart ? "In cart" : "Add to cart"}
                  </span>
                </motion.button>

                <button
                  type="button"
                  onClick={handleAddToFav}
                  className="flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      isFavorite ? "text-rose-500" : "text-current"
                    }`}
                    fill={isFavorite ? "currentColor" : "none"}
                  />
                  {isFavorite ? "Saved" : "Add to wishlist"}
                </button>
              </div>

              <a
                href="/contact"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                <PhoneCall className="h-4 w-4" />
                Consult with an expert
              </a>
            </div>

            {highlights.length > 0 && (
              <div className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
                <h2 className="text-xl font-semibold text-slate-900">
                  Key highlights
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {highlights.map((highlight, index) => (
                    <li
                      key={`${highlight}-${index}`}
                      className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"
                    >
                      <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-600" />
                      <span className="text-sm text-slate-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section className="mt-12 rounded-3xl bg-white p-6 shadow-sm lg:p-8">
          <h2 className="text-xl font-semibold text-slate-900">
            Product description
          </h2>
          <div
            className="prose prose-slate mt-4 max-w-none"
            dangerouslySetInnerHTML={{
              __html:
                product?.description ||
                "<p>Product description will be updated shortly. Please reach out to us for detailed information.</p>",
            }}
          />
        </section>

        <section className="mt-12 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Related products
            </h2>
            <a
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition hover:text-emerald-500"
            >
              Browse all products
              <span aria-hidden="true">→</span>
            </a>
          </div>

          {relatedProducts.length > 0 ? (
            <Suspense
              fallback={
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                  Loading related products...
                </div>
              }
            >
              <div className="relative">
                <div
                  className="overflow-hidden"
                  ref={relatedEmblaRef}
                >
                  <div className="flex gap-4 sm:gap-5">
                    {relatedProducts.map((relatedProduct) => (
                      <div
                        key={relatedProduct?._id || relatedProduct?.slug}
                        className="w-[85%] flex-shrink-0 sm:w-[48%] lg:w-[32%]"
                      >
                        <AquaRelatedProductCard product={relatedProduct} />
                      </div>
                    ))}
                  </div>
                </div>

                {relatedProducts.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Show previous related products"
                      onClick={scrollRelatedPrev}
                      disabled={!canScrollPrev}
                      className={`pointer-events-auto absolute left-0 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 sm:flex ${
                        canScrollPrev ? "opacity-100" : "opacity-50"
                      }`}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Show more related products"
                      onClick={scrollRelatedNext}
                      disabled={!canScrollNext}
                      className={`pointer-events-auto absolute right-0 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 sm:flex ${
                        canScrollNext ? "opacity-100" : "opacity-50"
                      }`}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </Suspense>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              More curated recommendations will appear here once available.
            </div>
          )}
        </section>
      </main>

      <AquaFooter />
    </div>
  );
}

export default AquaServerDynamicProduct;
