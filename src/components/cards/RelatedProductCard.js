import React, { useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Check, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSelector } from "react-redux";
import useProduct from "@/utils/product";
import { getProductReviewStats } from "@/utils/reviewStats";

const AquaRelatedProductCard = ({ product }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [activeIndex, setActiveIndex] = useState(0);

  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();
  const { cartData, favData } = useSelector((state) => ({ ...state }));

  const displayPhotos =
    Array.isArray(product?.photos) && product.photos.length > 0
      ? product.photos.filter(Boolean)
      : [
          {
            secure_url:
              "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
          },
        ];
  const productHref = product?.slug
    ? `/product/${product.slug}`
    : product?._id
      ? `/product/${product._id}`
      : "/product";

  const priceDetails = useMemo(() => {
    const price = Number(product?.price) || null;
    const discountPrice = Number(product?.discountPrice) || null;
    const showDiscount = product?.discountPriceStatus && discountPrice;

    const formatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });

    return {
      actual: showDiscount ? discountPrice : price,
      original: showDiscount ? price : null,
      labelActual: price
        ? formatter.format(showDiscount ? discountPrice : price)
        : "",
      labelOriginal: showDiscount && price ? formatter.format(price) : "",
      discountPercent:
        showDiscount && price
          ? Math.max(1, Math.round(((price - discountPrice) / price) * 100))
          : null,
    };
  }, [product?.price, product?.discountPrice, product?.discountPriceStatus]);

  const reviewStats = useMemo(() => getProductReviewStats(product), [product]);
  const rawDescription =
    typeof product?.shortDescription === "string"
      ? product.shortDescription
      : typeof product?.description === "string"
        ? product.description.replace(/<[^>]+>/g, " ")
        : "";
  const descriptionText =
    rawDescription.replace(/\s+/g, " ").trim() ||
    "Well suited for modern water purification needs.";

  useEffect(() => {
    if (emblaApi) {
      const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());
      emblaApi.on("select", onSelect);
      return () => emblaApi.off("select", onSelect);
    }
  }, [emblaApi]);

  const isInCart = cartData?.some((item) => item._id === product?._id);
  const isFavorite = favData?.some((item) => item._id === product?._id);

  const handleAddToCart = () => {
    AddAndRemoveCart(product, () => undefined);
  };

  const handleAddToFav = () => {
    AddAndRemoveFav(product, () => undefined);
  };

  return (
    <article className="group flex h-full min-h-[30rem] w-full flex-col overflow-hidden rounded-[2rem] border border-white/85 bg-white/88 shadow-[0_22px_65px_rgba(15,23,42,0.1)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_28px_75px_rgba(15,23,42,0.14)] focus-within:ring-2 focus-within:ring-emerald-400 focus-within:ring-offset-2">
      <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#ffffff_0%,#ecfeff_48%,#d1fae5_100%)]">
        {/* Embla Carousel */}
        <div className="h-full overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            {displayPhotos.map((photo, index) => (
              <motion.div
                key={index}
                className="relative h-full w-full flex-shrink-0"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: activeIndex === index ? 1 : 0.5,
                  scale: activeIndex === index ? 1 : 0.9,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <Image
                  fill
                  sizes="(max-width: 639px) 82vw, (max-width: 1023px) 46vw, 30vw"
                  className="h-full w-full object-contain p-5 drop-shadow-[0_20px_22px_rgba(15,23,42,0.16)] transition duration-500 group-hover:scale-[1.03]"
                  src={
                    (typeof photo === "string" ? photo : photo?.secure_url) ||
                    "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png"
                  }
                  alt={product?.title || "Aquakart product"}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Favorite Button */}
        <motion.div
          className="absolute right-4 top-4"
          whileTap={{ scale: 0.8 }}
          onClick={handleAddToFav}
        >
          <button
            type="button"
            className={`rounded-full p-2.5 shadow-lg ring-1 ring-white/80 backdrop-blur-xl transition-all duration-300 ${
              isFavorite ? "bg-rose-100/95" : "bg-white/80"
            } hover:bg-white`}
          >
            <motion.div
              animate={{
                scale: isFavorite ? 1.3 : 1,
                color: isFavorite ? "#ef4444" : "#4b5563",
              }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <Heart
                className="h-5 w-5"
                fill={isFavorite ? "currentColor" : "none"}
              />
            </motion.div>
          </button>
        </motion.div>

        {priceDetails.discountPercent ? (
          <div className="absolute left-4 top-4 inline-flex items-center rounded-full bg-emerald-500/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-emerald-500/20">
            Save {priceDetails.discountPercent}%
          </div>
        ) : null}

        {/* Timeline Indicators */}
        {displayPhotos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 space-x-1.5 rounded-full bg-white/70 px-2.5 py-2 shadow-sm backdrop-blur-xl">
            {displayPhotos.slice(0, 5).map((_, index) => (
              <button
                type="button"
                aria-label={`View image ${index + 1}`}
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeIndex === index
                    ? "w-7 bg-slate-950"
                    : "w-1.5 bg-slate-400/45"
                }`}
                onClick={() => emblaApi?.scrollTo(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
            {product?.brand || "Aquakart"}
          </span>
          <h2 className="line-clamp-2 min-h-11 text-base font-black leading-snug text-slate-950 transition group-hover:text-emerald-600">
            <Link href={productHref}>{product?.title}</Link>
          </h2>
        </div>

        {reviewStats.ratingValue || reviewStats.ratingCount ? (
          <div className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {reviewStats.ratingValue
              ? reviewStats.ratingValue.toFixed(1)
              : "Reviews"}
            {reviewStats.ratingCount ? ` (${reviewStats.ratingCount})` : ""}
          </div>
        ) : null}

        <p className="line-clamp-2 text-xs leading-5 text-slate-500">
          {descriptionText}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="flex flex-col">
            {priceDetails.labelActual ? (
              <span className="text-xl font-black tracking-tight text-slate-950">
                {priceDetails.labelActual}
              </span>
            ) : null}
            {priceDetails.labelOriginal ? (
              <span className="text-xs text-slate-400 line-through">
                {priceDetails.labelOriginal}
              </span>
            ) : null}
          </div>

          <motion.button
            type="button"
            className={`relative inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold text-white shadow transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${
              isInCart ? "bg-emerald-600" : "bg-slate-900 hover:bg-slate-800"
            }`}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
          >
            {isInCart ? (
              <>
                <Check className="mr-1 h-4 w-4" />
                In cart
              </>
            ) : (
              <>
                <ShoppingCart className="mr-1 h-4 w-4" />
                Add
              </>
            )}
          </motion.button>
        </div>
      </div>
    </article>
  );
};

export default AquaRelatedProductCard;
