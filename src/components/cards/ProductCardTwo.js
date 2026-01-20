import useCurrency from "@/utils/currency";
import useProduct from "@/utils/product";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { FaHeart, FaShoppingCart, FaCheck } from "react-icons/fa";
import { useSelector } from "react-redux";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import LazyImage from "../image/LazyImage";
import { useRouter } from "next/router";

const ReusableProductCard = ({ product, viewMode = "grid", padded = true }) => {
  const [fav, setAddFav] = useState(false);
  const [cart, setAddCart] = useState(false);

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
  const isPausedRef = useRef(false);
  const [progress, setProgress] = useState(0); // 0..1

  const stopAuto = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const tick = useCallback(() => {
    if (!emblaApi) return;

    if (padded) {
      if (!isHoveredRef.current) return;
    } else {
      if (isPausedRef.current) return;
    }

    const now = performance.now();
    const elapsed = now - startRef.current;
    const p = Math.min(1, elapsed / AUTO_MS);
    setProgress(p);
    if (p >= 1) return;
    rafRef.current = requestAnimationFrame(tick);
  }, [emblaApi, padded, AUTO_MS]);

  const startAuto = useCallback(() => {
    if (!emblaApi) return;
    stopAuto();
    setProgress(0);
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);

    timerRef.current = setTimeout(() => {
      if (!emblaApi) return;

      if (padded) {
        if (!isHoveredRef.current) return;
      } else {
        if (isPausedRef.current) return;
      }

      if (emblaApi.canScrollNext()) emblaApi.scrollNext();
      else emblaApi.scrollTo(0);
    }, AUTO_MS);
  }, [emblaApi, stopAuto, tick, padded, AUTO_MS]);

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
      if (padded) {
        if (isHoveredRef.current) startAuto();
      } else {
        startAuto();
      }
    };

    emblaApi.on("select", onSelect);

    if (padded) {
      stopAuto();
      setProgress(0);
    } else {
      startAuto();
    }

    return () => {
      emblaApi.off("select", onSelect);
      stopAuto();
    };
  }, [emblaApi, startAuto, stopAuto, padded]);

  const productHref = useMemo(() => {
    if (slug) return `/product/${slug}`;
    if (product?._id) return `/product/${product._id}`;
    return "/product";
  }, [slug, product?._id]);

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
    AddAndRemoveFav(product, setAddFav);
  };

  const handleCartToggle = (event) => {
    event.stopPropagation();
    event.preventDefault();
    AddAndRemoveCart(product, setAddCart);
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
        className={`group relative flex cursor-pointer gap-6 rounded-2xl border bg-white p-4 shadow-lg transition hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${
          fav ? "border-rose-200" : "border-slate-100"
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
                  <LazyImage
                    src={photo?.delivery_url}
                    alt={title}
                    width={500}
                    height={500}
                    imgClassName="h-full w-full object-cover object-center"
                  />
                </motion.div>
              ))}
            </div>
          </div>

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

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3">
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
  // padded = true  -> Full-image hover details + rich cart button + timer filler
  // padded = false -> Your existing grid card (kept)
  // ===========================
  return (
    <>
      {padded ? (
        <div
          className={[
            "group relative h-[420px] w-full cursor-pointer overflow-hidden rounded-3xl shadow-xl transition",
            fav ? "ring-2 ring-rose-500 ring-offset-2" : "",
            cart
              ? "outline outline-2 outline-emerald-500 outline-offset-[-2px]"
              : "",
          ].join(" ")}
          onClick={handleNavigate}
          onMouseEnter={() => {
            isHoveredRef.current = true;
            if (padded) {
              startAuto();
            } else {
              isPausedRef.current = true;
              stopAuto();
            }
          }}
          onMouseLeave={() => {
            isHoveredRef.current = false;
            if (padded) {
              stopAuto();
              setProgress(0); // Optional: reset progress bar
              // api.scrollTo(0)? Maybe not, leave it at current image
            } else {
              isPausedRef.current = false;
              startAuto();
            }
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
                  <LazyImage
                    src={p.delivery_url}
                    alt={title}
                    width={900}
                    height={900}
                    imgClassName="h-full w-full object-cover rounded-3xl p-1"
                  />
                </motion.div>
              ))}
            </div>
          </div>

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

          {/* INFO OVERLAY (Always Visible) */}
          <div
            className="
              absolute inset-0 z-10
              flex flex-col justify-end
              bg-gradient-to-t from-black/90 via-black/20 to-transparent
              transition-all duration-300
            "
          >
            <div className="px-5 pb-5 text-white">
              <div className="flex flex-col gap-1 mb-3">
                <h3 className="text-lg font-bold leading-snug drop-shadow-sm line-clamp-2">
                  {title}
                </h3>
                <p className="text-xs text-white/80 font-medium uppercase tracking-wider">
                  {product?.brand || "Aquakart"}
                </p>
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

              <div className="flex items-end justify-between border-t border-white/20 pt-3">
                {/* Price - Left */}
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold">
                      {discountPriceStatus
                        ? formatCurrencyINR(discountPrice)
                        : formatCurrencyINR(price)}
                    </span>
                    {discountPriceStatus && (
                      <span className="text-xs text-white/60 line-through">
                        {formatCurrencyINR(price)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cart Button - Right */}
                <button
                  onClick={handleCartToggle}
                  className={`flex items-center justify-center rounded-full p-3 shadow-lg transition-all duration-300 active:scale-95 ${
                    cart
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "bg-white text-slate-900 hover:bg-slate-200"
                  }`}
                  aria-label={cart ? "Remove from cart" : "Add to cart"}
                >
                  <FaShoppingCart
                    size={16}
                    className={cart ? "text-white" : "text-slate-900"}
                  />
                  {cart && <FaCheck size={12} className="ml-1 text-white" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="link"
          tabIndex={0}
          onClick={handleNavigate}
          onKeyDown={handleKeyPress}
          className="group relative flex h-full cursor-pointer flex-col rounded-3xl border border-slate-100 bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
          aria-label={`View details for ${title}`}
        >
          {/* Full-Width Image Carousel */}
          <div className="relative w-full overflow-hidden rounded-t-xl">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {displayPhotos.map((photo, index) => (
                  <motion.div
                    key={index}
                    className="flex h-72 w-full flex-shrink-0 rounded-3xl"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: activeIndex === index ? 1 : 0.5,
                      scale: activeIndex === index ? 1 : 0.9,
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <LazyImage
                      src={photo?.delivery_url}
                      alt={title}
                      width={500}
                      height={500}
                      imgClassName="h-full w-full object-cover object-center rounded-3xl p-3"
                    />
                  </motion.div>
                ))}
              </div>
            </div>

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

          <div className="flex flex-1 flex-col justify-between p-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1 text-left">
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 transition group-hover:text-emerald-600">
                  {title}
                </h3>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {product?.brand || product?.manufacturer || "Aquakart"}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  {product?.warranty || "1 yr warranty"}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 pt-3 border-t border-slate-50">
              {/* Price - Left */}
              <div className="flex flex-col">
                <p className="text-sm font-bold text-slate-900">
                  {discountPriceStatus ? (
                    <>
                      <span className="text-red-600">
                        {formatCurrencyINR(discountPrice)}
                      </span>
                    </>
                  ) : (
                    formatCurrencyINR(price)
                  )}
                </p>
                {discountPriceStatus && (
                  <span className="text-[10px] text-gray-400 line-through">
                    {formatCurrencyINR(price)}
                  </span>
                )}
              </div>

              {/* Cart Button - Right */}
              <button
                onClick={handleCartToggle}
                type="button"
                className={`flex items-center justify-center rounded-full p-2.5 shadow-md transition-all duration-300 ${
                  cart
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
                aria-label={cart ? "Remove from cart" : "Add to cart"}
              >
                {cart ? <FaCheck size={14} /> : <FaShoppingCart size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReusableProductCard;
