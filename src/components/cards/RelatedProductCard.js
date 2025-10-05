import React, { useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Check } from "lucide-react";
import Link from "next/link";
import { useSelector } from "react-redux";
import useProduct from "@/utils/product";

const AquaRelatedProductCard = ({ product }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInCart, setIsInCart] = useState(false);

  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();
  const { cartData, favData } = useSelector((state) => ({ ...state }));

  const displayPhotos = useMemo(() => {
    if (Array.isArray(product?.photos) && product.photos.length > 0) {
      return product.photos.filter(Boolean);
    }

    return [
      {
        secure_url:
          "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
      },
    ];
  }, [product?.photos]);

  const productHref = useMemo(() => {
    if (product?.slug) return `/product/${product.slug}`;
    if (product?._id) return `/product/${product._id}`;
    return "/product";
  }, [product?.slug, product?._id]);

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
      labelOriginal:
        showDiscount && price ? formatter.format(price) : "",
      discountPercent:
        showDiscount && price
          ? Math.max(1, Math.round(((price - discountPrice) / price) * 100))
          : null,
    };
  }, [product?.price, product?.discountPrice, product?.discountPriceStatus]);

  const descriptionText = useMemo(() => {
    const raw =
      typeof product?.shortDescription === "string"
        ? product.shortDescription
        : typeof product?.description === "string"
        ? product.description.replace(/<[^>]+>/g, " ")
        : "";

    const trimmed = raw.replace(/\s+/g, " ").trim();
    return trimmed || "Well suited for modern water purification needs.";
  }, [product?.shortDescription, product?.description]);

  useEffect(() => {
    if (emblaApi) {
      const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());
      emblaApi.on("select", onSelect);
      return () => emblaApi.off("select", onSelect);
    }
  }, [emblaApi]);

  useEffect(() => {
    if (!product) return;

    const isProductInCart = cartData?.some((item) => item._id === product?._id);
    const isProductInFav = favData?.some((item) => item._id === product?._id);

    setIsFavorite(isProductInFav);
    setIsInCart(isProductInCart);
  }, [cartData, favData, product]);

  const handleAddToCart = () => {
    AddAndRemoveCart(product, setIsInCart);
  };

  const handleAddToFav = () => {
    AddAndRemoveFav(product, setIsFavorite);
  };

  return (
    <div className="group flex h-full w-full min-w-[260px] max-w-[320px] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-emerald-400 focus-within:ring-offset-2 sm:min-w-0">
      <div className="relative">
        {/* Embla Carousel */}
        <div className="overflow-hidden rounded-t-xl" ref={emblaRef}>
          <div className="flex">
            {displayPhotos.map((photo, index) => (
              <motion.div
                key={index}
                className="flex-shrink-0 w-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: activeIndex === index ? 1 : 0.5,
                  scale: activeIndex === index ? 1 : 0.9,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <img
                  className="w-full object-cover rounded-t-xl"
                  src={photo?.secure_url}
                  alt={product?.title || "Aquakart product"}
                  style={{ height: "auto", maxHeight: "320px" }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Favorite Button */}
        <motion.div
          className="absolute top-3 right-3"
          whileTap={{ scale: 0.8 }}
          onClick={handleAddToFav}
        >
          <button
            type="button"
            className={`p-2 rounded-full shadow transition-all duration-300 ${
              isFavorite ? "bg-red-100" : "bg-white"
            } hover:bg-gray-100`}
          >
            <motion.div
              animate={{
                scale: isFavorite ? 1.3 : 1,
                color: isFavorite ? "#ef4444" : "#4b5563",
              }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <Heart className="w-6 h-6" />
            </motion.div>
          </button>
        </motion.div>

        {priceDetails.discountPercent ? (
          <div className="absolute left-4 top-4 inline-flex items-center rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Save {priceDetails.discountPercent}%
          </div>
        ) : null}

        {/* Timeline Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {displayPhotos.map((_, index) => (
            <div
              key={index}
              className={`relative w-10 h-2 rounded-full cursor-pointer transition-all duration-300 ${
                activeIndex === index ? "bg-blue-500 scale-125" : "bg-gray-300"
              }`}
              onClick={() => emblaApi && emblaApi.scrollTo(index)}
            ></div>
          ))}
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
            {product?.brand || "Aquakart"}
          </span>
          <h2 className="text-base font-semibold leading-snug text-slate-900 transition group-hover:text-emerald-600">
            <Link href={productHref}>{product?.title}</Link>
          </h2>
        </div>

        <p className="line-clamp-2 text-xs text-slate-500">{descriptionText}</p>

        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="flex flex-col">
            {priceDetails.labelActual ? (
              <span className="text-lg font-bold text-slate-900">
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
    </div>
  );
};

export default AquaRelatedProductCard;
