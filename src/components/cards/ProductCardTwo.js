import useCurrency from "@/utils/currency";
import useProduct from "@/utils/product";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { FaHeart, FaShoppingCart, FaCheck, FaStar } from "react-icons/fa";
import { useSelector } from "react-redux";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import LazyImage from "../image/LazyImage";
import { useRouter } from "next/router";
import { getProductReviewStats } from "@/utils/reviewStats";

const getPhotoUrl = (photo) =>
  typeof photo === "string"
    ? photo
    : photo?.delivery_url || photo?.secure_url || photo?.url || "";

const ReusableProductCard = ({
  product,
  viewMode = "grid",
  padded = true,
  imagePriority = false,
  variant,
}) => {
  const [fav, setAddFav] = useState(false);
  const [cart, setAddCart] = useState(false);
  const [celebration, setCelebration] = useState("");
  const celebrationTimerRef = useRef(null);
  const cardVariant = variant || (padded ? "glass" : "standard");
  const isGlass = cardVariant === "glass";

  // ✅ FIX: hook must be invoked
  const { formatCurrencyINR } = useCurrency;
  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();

  const { cartData, favData } = useSelector((state) => ({ ...state }));
  const router = useRouter();

  const {
    title,
    photos = [],
    price,
    slug,
    discountPrice,
    discountPriceStatus,
  } = product || {};

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [activeIndex, setActiveIndex] = useState(0);

  const isHoveredRef = useRef(false);

  // ====== Timer filler (no dots) ======
  const AUTO_MS = 3500;
  const timerRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const [progress, setProgress] = useState(0); // 0..1

  const stopAuto = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const tick = useCallback(() => {
    if (!emblaApi) return;

    if (!isGlass || !isHoveredRef.current) return;

    const now = performance.now();
    const elapsed = now - startRef.current;
    const p = Math.min(1, elapsed / AUTO_MS);
    setProgress(p);
    if (p >= 1) return;
    rafRef.current = requestAnimationFrame(tick);
  }, [emblaApi, isGlass, AUTO_MS]);

  const startAuto = useCallback(() => {
    if (!emblaApi) return;
    stopAuto();
    setProgress(0);
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);

    timerRef.current = setTimeout(() => {
      if (!emblaApi) return;

      if (!isGlass || !isHoveredRef.current) return;

      if (emblaApi.canScrollNext()) emblaApi.scrollNext();
      else emblaApi.scrollTo(0);
    }, AUTO_MS);
  }, [emblaApi, stopAuto, tick, isGlass, AUTO_MS]);

  useEffect(() => {
    const isProductInCart = cartData?.some((i) => i._id === product?._id);
    const isProductInFav = favData?.some((i) => i._id === product?._id);
    setAddCart(!!isProductInCart);
    setAddFav(!!isProductInFav);
  }, [cartData, favData, product?._id]);

  const displayPhotos = useMemo(() => {
    if (Array.isArray(photos) && photos.length > 0) return photos;
    return [
      {
        secure_url:
          "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
      },
    ];
  }, [photos]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setActiveIndex(emblaApi.selectedScrollSnap());
      if (isGlass && isHoveredRef.current) startAuto();
    };

    emblaApi.on("select", onSelect);

    stopAuto();
    setProgress(0);

    return () => {
      emblaApi.off("select", onSelect);
      stopAuto();
    };
  }, [emblaApi, startAuto, stopAuto, isGlass]);

  const productHref = useMemo(() => {
    if (slug) return `/product/${slug}`;
    if (product?._id) return `/product/${product._id}`;
    return "/product";
  }, [slug, product?._id]);

  const reviewStats = useMemo(() => getProductReviewStats(product), [product]);

  const description = useMemo(() => {
    const value = product?.shortDescription || product?.description || "";
    if (typeof value !== "string") return "";
    return value
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, [product?.shortDescription, product?.description]);

  const discountPercent = useMemo(() => {
    const original = Number(price);
    const sale = Number(discountPrice);
    if (!discountPriceStatus || original <= 0 || sale >= original) return 0;
    return Math.round(((original - sale) / original) * 100);
  }, [discountPriceStatus, discountPrice, price]);

  const renderRatingBadge = (variant = "overlay") => {
    if (!reviewStats.ratingValue && !reviewStats.ratingCount) return null;
    const base =
      "absolute z-20 inline-flex items-center gap-1 rounded-full font-semibold shadow";
    const styles =
      variant === "light"
        ? "bottom-3 left-3 bg-white/95 px-2 py-1 text-[11px] text-slate-800"
        : "left-4 top-14 bg-black/35 px-2.5 py-1.5 text-xs text-white backdrop-blur";
    return (
      <div className={`${base} ${styles}`}>
        <FaStar className="text-amber-400" size={12} />
        {reviewStats.ratingValue ? (
          <span>{reviewStats.ratingValue.toFixed(1)}</span>
        ) : (
          <span>Reviews</span>
        )}
        {reviewStats.ratingCount ? (
          <span className="text-slate-400">({reviewStats.ratingCount})</span>
        ) : null}
      </div>
    );
  };

  useEffect(
    () => () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
    },
    [],
  );

  const celebrate = (type) => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    setCelebration(type);
    if (celebrationTimerRef.current) {
      clearTimeout(celebrationTimerRef.current);
    }
    celebrationTimerRef.current = window.setTimeout(
      () => setCelebration(""),
      720,
    );
  };

  const handleNavigate = () => router.push(productHref);

  const handleKeyPress = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleNavigate();
    }
  };

  const handleFavToggle = (event) => {
    event.stopPropagation();
    event.preventDefault();
    if (!fav) celebrate("fav");
    AddAndRemoveFav(product, setAddFav);
  };

  const handleCartToggle = (event) => {
    event.stopPropagation();
    event.preventDefault();
    if (!cart) celebrate("cart");
    AddAndRemoveCart(product, setAddCart);
  };

  const renderSelectionStatus = () => {
    if (!fav && !cart) return null;

    const label = fav && cart ? "Saved + In cart" : fav ? "Saved" : "In cart";
    return (
      <span
        className={`absolute right-4 top-[4.6rem] z-20 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black shadow-lg backdrop-blur-md ${
          fav && cart
            ? "border-violet-200 bg-violet-600/95 text-white"
            : fav
              ? "border-rose-200 bg-rose-500/95 text-white"
              : "border-emerald-200 bg-emerald-500/95 text-white"
        }`}
        aria-live="polite"
      >
        {fav && cart ? (
          <>
            <FaHeart size={9} />
            <FaShoppingCart size={10} />
          </>
        ) : fav ? (
          <FaHeart size={10} />
        ) : (
          <FaCheck size={10} />
        )}
        {label}
      </span>
    );
  };

  const renderCelebration = () => {
    if (!celebration) return null;
    const colors =
      celebration === "fav"
        ? ["#fb7185", "#f43f5e", "#fda4af", "#fbbf24"]
        : ["#10b981", "#34d399", "#6ee7b7", "#fbbf24"];
    const particles = [
      [-34, -28],
      [-18, -44],
      [0, -50],
      [20, -42],
      [36, -24],
      [-30, 4],
      [30, 6],
      [0, 18],
    ];

    return (
      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-3xl">
        {particles.map(([x, y], index) => (
          <motion.span
            key={`${celebration}-${index}`}
            className="absolute left-1/2 top-[18%] h-2 w-2 rounded-full"
            style={{ backgroundColor: colors[index % colors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
            animate={{ x, y, opacity: 0, scale: 1 }}
            transition={{ duration: 0.68, ease: "easeOut" }}
          />
        ))}
      </div>
    );
  };

  // ===========================
  // LIST VIEW
  // ===========================
  if (viewMode === "list") {
    return (
      <div
        role="link"
        tabIndex={0}
        onClick={handleNavigate}
        onKeyDown={handleKeyPress}
        className={`group relative flex cursor-pointer gap-6 rounded-2xl glass-card p-4 transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${
          fav ? "border-rose-200" : ""
        } ${cart ? "ring-1 ring-emerald-300" : ""}`}
        aria-label={`View details for ${title}`}
      >
        {/* Image */}
        <div className="relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-xl">
          <div className="overflow-hidden h-full" ref={emblaRef}>
            <div className="flex h-full">
              {displayPhotos.map((photo, index) => (
                <motion.div
                  key={index}
                  className="flex h-full w-48 flex-shrink-0"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: activeIndex === index ? 1 : 0.5,
                    scale: activeIndex === index ? 1 : 0.9,
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  {index === activeIndex ? (
                    <LazyImage
                      src={getPhotoUrl(photo)}
                      alt={title}
                      width={480}
                      height={480}
                      sizes="192px"
                      priority={imagePriority && index === 0}
                      quality={68}
                      imgClassName="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="h-full w-full bg-slate-100" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Rating */}
          {renderRatingBadge("light")}

          {/* Fav */}
          <button
            type="button"
            onClick={handleFavToggle}
            aria-label={fav ? "Remove from wishlist" : "Add to wishlist"}
            className={`absolute top-2 right-2 z-10 rounded-full border p-2 shadow-lg transition-all duration-300 ${
              fav
                ? "border-rose-500 bg-white/90 text-rose-600 hover:bg-rose-500 hover:text-white"
                : "border-white/70 bg-white/80 text-slate-500 hover:border-rose-300 hover:text-rose-500"
            }`}
          >
            <FaHeart size={16} />
          </button>
        </div>

        {renderSelectionStatus()}
        {renderCelebration()}

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 pr-2">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {product?.brand || product?.manufacturer || "Aquakart"}
            </p>
            <h3 className="text-xl font-semibold text-slate-900 transition group-hover:text-emerald-600">
              {title}
            </h3>
          </div>

          <p className="text-2xl font-bold text-slate-900">
            {discountPriceStatus ? (
              <>
                <span className="text-red-600">
                  {formatCurrencyINR(discountPrice)}
                </span>
                <span className="ml-2 text-base text-gray-500 line-through">
                  {formatCurrencyINR(price)}
                </span>
              </>
            ) : (
              formatCurrencyINR(price)
            )}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span>
              {product?.coverage || product?.capacity
                ? `${product.coverage || product.capacity} coverage`
                : "For all water sources"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              {product?.warranty || "1 year warranty"}
            </span>
          </div>

          <div className="mt-auto flex gap-3">
            <button
              onClick={handleCartToggle}
              type="button"
              aria-label={cart ? "Remove from cart" : "Add to cart"}
              className={`flex-1 rounded-full py-3 text-sm font-semibold shadow-md transition-all duration-300 ${
                cart
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <FaShoppingCart size={16} className="text-white" />
                {cart ? "In Cart" : "Add to Cart"}
                {cart && <FaCheck size={14} className="text-white/90" />}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===========================
  // GRID VIEW
  // glass    -> full-bleed image with readable overlay
  // standard -> white retail card with separate content
  // ===========================
  return (
    <>
      {isGlass ? (
        <div
          className={[
            "group relative h-[460px] w-full cursor-pointer overflow-hidden rounded-[30px] border border-white/50 bg-white/20 shadow-[0_10px_34px_rgba(15,23,42,0.12)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_18px_48px_rgba(15,23,42,0.18)]",
            fav ? "ring-2 ring-rose-500 ring-offset-2" : "",
            cart
              ? "outline outline-2 outline-emerald-500 outline-offset-[-2px]"
              : "",
          ].join(" ")}
          onClick={handleNavigate}
          onMouseEnter={() => {
            isHoveredRef.current = true;
            startAuto();
          }}
          onMouseLeave={() => {
            isHoveredRef.current = false;
            stopAuto();
            setProgress(0);
          }}
        >
          {/* IMAGE */}
          <div ref={emblaRef} className="absolute inset-0 rounded-3xl">
            <div className="flex h-full">
              {displayPhotos.map((p, i) => (
                <motion.div
                  key={i}
                  className="h-full w-full flex-shrink-0"
                  animate={{ opacity: activeIndex === i ? 1 : 0.6 }}
                  transition={{ duration: 0.4 }}
                >
                  {i === activeIndex ? (
                    <LazyImage
                      src={getPhotoUrl(p)}
                      alt={title}
                      width={720}
                      height={720}
                      sizes="(max-width: 639px) calc(100vw - 24px), (max-width: 1023px) 50vw, (max-width: 1535px) 33vw, 25vw"
                      priority={imagePriority && i === 0}
                      quality={68}
                      imgClassName="h-full w-full object-cover rounded-3xl p-1"
                    />
                  ) : (
                    <div className="h-full w-full bg-slate-100" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* RATING */}
          {renderRatingBadge("overlay")}

          {discountPercent > 0 && (
            <span className="absolute left-4 top-4 z-20 rounded-full bg-black/35 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
              {discountPercent}% off
            </span>
          )}

          {/* FAVORITE */}
          <button
            onClick={handleFavToggle}
            aria-label={fav ? "Remove from wishlist" : "Add to wishlist"}
            className={`absolute right-4 top-4 z-20 rounded-full p-3 shadow ${
              fav ? "bg-rose-500 text-white" : "bg-white/90 text-slate-600"
            }`}
          >
            <FaHeart size={18} />
          </button>

          {renderSelectionStatus()}
          {renderCelebration()}

          {/* INFO OVERLAY (Always Visible) */}
          <div
            className="
              absolute inset-0 z-10
              flex flex-col justify-end
              bg-gradient-to-t from-black/95 via-black/30 to-transparent
              transition-all duration-300
            "
          >
            <div className="px-5 pb-5 text-white sm:px-6 sm:pb-6">
              <div className="mb-3 flex flex-col gap-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
                  {product?.brand || "Aquakart"}
                </p>
                <h3 className="line-clamp-2 text-xl font-black leading-snug drop-shadow-sm">
                  {title}
                </h3>
                {description && (
                  <p className="line-clamp-2 text-sm leading-5 text-white/75">
                    {description}
                  </p>
                )}
              </div>

              {/* Timer Filler - Relative */}
              <div className="flex gap-1.5 mb-3 opacity-80">
                {displayPhotos.map((_, i) => {
                  const isPast = i < activeIndex;
                  const isActive = i === activeIndex;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        emblaApi?.scrollTo(i);
                      }}
                      className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-white/30 transition-all duration-300 hover:h-1 hover:bg-white/50"
                      aria-label={`Go to slide ${i + 1}`}
                    >
                      <span
                        className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-150"
                        style={{
                          width: isPast
                            ? "100%"
                            : isActive
                              ? `${progress * 100}%`
                              : "0%",
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="whitespace-nowrap rounded-full bg-black/35 px-3 py-1 text-lg font-black leading-tight backdrop-blur-md">
                      {discountPriceStatus
                        ? formatCurrencyINR(discountPrice)
                        : formatCurrencyINR(price)}
                    </span>
                    {discountPriceStatus && (
                      <span className="whitespace-nowrap text-xs leading-tight text-white/60 line-through">
                        {formatCurrencyINR(price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleCartToggle}
                type="button"
                className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-black shadow-lg transition-colors ${
                  cart
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-white text-slate-950 hover:bg-slate-100"
                }`}
                aria-label={cart ? "Remove from cart" : "Add to cart"}
              >
                {cart ? <FaCheck size={14} /> : <FaShoppingCart size={15} />}
                {cart ? "Added to cart" : "Add to cart"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="link"
          tabIndex={0}
          onClick={handleNavigate}
          onKeyDown={handleKeyPress}
          className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[30px] border bg-white p-3 shadow-[0_10px_32px_rgba(15,23,42,0.07)] transition-shadow duration-300 hover:shadow-[0_16px_42px_rgba(15,23,42,0.12)] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${
            fav ? "border-rose-200" : "border-slate-200/80"
          } ${cart ? "ring-1 ring-emerald-300" : ""}`}
          aria-label={`View details for ${title}`}
        >
          {/* Full-Width Image Carousel */}
          <div className="relative w-full overflow-hidden rounded-[22px] bg-slate-50">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {displayPhotos.map((photo, index) => (
                  <motion.div
                    key={index}
                    className="flex h-64 w-full flex-shrink-0 sm:h-72"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: activeIndex === index ? 1 : 0.5,
                      scale: activeIndex === index ? 1 : 0.9,
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    {index === activeIndex ? (
                      <LazyImage
                        src={getPhotoUrl(photo)}
                        alt={title}
                        width={640}
                        height={640}
                        sizes="(max-width: 639px) calc(100vw - 24px), (max-width: 1023px) 50vw, 33vw"
                        priority={imagePriority && index === 0}
                        quality={68}
                        imgClassName="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <div className="h-full w-full bg-slate-100" />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {renderRatingBadge("light")}

            {discountPercent > 0 && (
              <span className="absolute left-3 top-3 z-20 rounded-full bg-slate-950/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                {discountPercent}% off
              </span>
            )}

            {/* Favorite Button */}
            <button
              type="button"
              onClick={handleFavToggle}
              aria-label={fav ? "Remove from wishlist" : "Add to wishlist"}
              className={`absolute top-4 right-4 z-10 rounded-full border p-3 transition-all duration-300 shadow-lg ${
                fav
                  ? "border-rose-500 bg-white/90 text-rose-600 hover:bg-rose-500 hover:text-white"
                  : "border-white/70 bg-white/80 text-slate-500 hover:border-rose-300 hover:text-rose-500"
              }`}
            >
              <FaHeart size={20} />
            </button>
            {renderSelectionStatus()}
            {renderCelebration()}
            {/* TIMER FILLER (no dots) - Shared with padded mode */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex gap-2">
              {displayPhotos.map((_, i) => {
                const isPast = i < activeIndex;
                const isActive = i === activeIndex;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      emblaApi?.scrollTo(i);
                    }}
                    className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/35"
                    aria-label={`Go to slide ${i + 1}`}
                  >
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-150"
                      style={{
                        width: isPast
                          ? "100%"
                          : isActive
                            ? `${progress * 100}%`
                            : "0%",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between px-2 pb-2 pt-4 sm:px-3 sm:pb-3">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1 text-left">
                <h3 className="line-clamp-2 text-lg font-black leading-snug text-slate-950 transition group-hover:text-emerald-700">
                  {title}
                </h3>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {product?.brand || product?.manufacturer || "Aquakart"}
                </p>
                {description && (
                  <p className="line-clamp-2 text-sm leading-5 text-slate-500">
                    {description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  {product?.warranty || "1 yr warranty"}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
              {/* Price - Left */}
              <div className="min-w-0">
                <p className="whitespace-nowrap text-xl font-black text-slate-950">
                  {discountPriceStatus ? (
                    <>
                      <span>{formatCurrencyINR(discountPrice)}</span>
                    </>
                  ) : (
                    formatCurrencyINR(price)
                  )}
                </p>
                {discountPriceStatus && (
                  <span className="text-xs text-slate-400 line-through">
                    {formatCurrencyINR(price)}
                  </span>
                )}
              </div>

              <button
                onClick={handleCartToggle}
                type="button"
                className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black shadow-sm transition-colors ${
                  cart
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-slate-950 text-white hover:bg-emerald-700"
                }`}
                aria-label={cart ? "Remove from cart" : "Add to cart"}
              >
                {cart ? <FaCheck size={14} /> : <FaShoppingCart size={15} />}
                {cart ? "Added to cart" : "Add to cart"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReusableProductCard;
