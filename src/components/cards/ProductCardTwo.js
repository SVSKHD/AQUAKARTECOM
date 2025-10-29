import useCurrency from "@/utils/currency";
import useProduct from "@/utils/product";
import { useState, useEffect, useMemo } from "react";
import { FaHeart } from "react-icons/fa";
import { useSelector } from "react-redux";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import AquaImage from "../images/AquaImage";
import { useRouter } from "next/router";

const ReusableProductCard = ({ product, viewMode = "grid" }) => {
  const [fav, setAddFav] = useState(false);
  const [cart, setAddCart] = useState(false);
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
  } = product;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const isProductInCart = cartData.some((item) => item._id === product?._id);
    const isProductInFav = favData.some((item) => item._id === product?._id);
    setAddCart(isProductInCart);
    setAddFav(isProductInFav);
  }, [cartData, product?._id, favData]);

  const displayPhotos = useMemo(() => {
    if (Array.isArray(photos) && photos.length > 0) {
      return photos;
    }
    return [
      {
        secure_url:
          "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
      },
    ];
  }, [photos]);

  useEffect(() => {
    if (emblaApi) {
      const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());
      emblaApi.on("select", onSelect);
      return () => emblaApi.off("select", onSelect);
    }
  }, [emblaApi]);

  const productHref = useMemo(() => {
    if (product?.slug) return `/product/${product.slug}`;
    if (product?._id) return `/product/${product._id}`;
    return "/product";
  }, [product]);

  const handleNavigate = () => {
    router.push(productHref);
  };

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
    AddAndRemoveCart(product, setAddCart);
  };

  if (viewMode === "list") {
    return (
      <div
        role="link"
        tabIndex={0}
        onClick={handleNavigate}
        onKeyDown={handleKeyPress}
        className="group relative flex cursor-pointer gap-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg transition hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
        aria-label={`View details for ${title}`}
      >
        {/* Image Section */}
        <div className="relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-xl">
          <div className="overflow-hidden" ref={emblaRef}>
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
                  <AquaImage
                    src={photo?.secure_url}
                    alt={title}
                    customClass="h-full w-full object-cover object-center"
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={handleFavToggle}
            className={`absolute top-2 right-2 z-10 rounded-full border p-2 transition-all duration-300 shadow-lg ${
              fav
                ? "border-rose-500 bg-white/90 text-rose-600 hover:bg-rose-500 hover:text-white"
                : "border-white/70 bg-white/80 text-slate-500 hover:border-rose-300 hover:text-rose-500"
            }`}
          >
            <FaHeart size={16} />
          </button>
        </div>

        {/* Content Section */}
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
                <span className="text-base text-gray-500 line-through ml-2">
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
              className={`flex-1 rounded-lg py-3 text-sm font-semibold shadow-md transition-all duration-300 ${
                cart
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-emerald-500 text-white hover:bg-emerald-400"
              }`}
            >
              {cart ? "In Cart" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleNavigate}
      onKeyDown={handleKeyPress}
      className="group relative flex h-full cursor-pointer flex-col rounded-2xl border border-slate-100 bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
      aria-label={`View details for ${title}`}
    >
      {/* Full-Width Image Carousel */}
      <div className="relative w-full overflow-hidden rounded-t-xl">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {displayPhotos.map((photo, index) => (
              <motion.div
                key={index}
                className="flex h-72 w-full flex-shrink-0"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: activeIndex === index ? 1 : 0.5,
                  scale: activeIndex === index ? 1 : 0.9,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <AquaImage
                  src={photo?.secure_url}
                  alt={title}
                  customClass="h-full w-full object-cover object-center"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleFavToggle}
          className={`absolute top-4 right-4 z-10 rounded-full border p-3 transition-all duration-300 shadow-lg ${
            fav
              ? "border-rose-500 bg-white/90 text-rose-600 hover:bg-rose-500 hover:text-white"
              : "border-white/70 bg-white/80 text-slate-500 hover:border-rose-300 hover:text-rose-500"
          }`}
        >
          <FaHeart size={20} />
        </button>

        {/* Timeline Indicators */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {displayPhotos.map((_, index) => (
            <div
              key={index}
              className={`w-4 h-1 rounded-full cursor-pointer transition-all duration-300 ${
                activeIndex === index ? "bg-blue-500 scale-125" : "bg-gray-300"
              }`}
              onClick={() => emblaApi && emblaApi.scrollTo(index)}
            ></div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {product?.brand || product?.manufacturer || "Aquakart"}
          </p>
          <h3 className="text-lg font-semibold text-slate-900 transition group-hover:text-emerald-600">
            {title}
          </h3>
        </div>
        <p className="text-lg font-bold text-slate-900">
          {discountPriceStatus ? (
            <>
              <span className="text-red-600">
                {formatCurrencyINR(discountPrice)}
              </span>
              <span className="text-sm text-gray-500 line-through ml-2">
                {formatCurrencyINR(price)}
              </span>
            </>
          ) : (
            formatCurrencyINR(price)
          )}
        </p>
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            {product?.coverage || product?.capacity
              ? `${product.coverage || product.capacity} coverage`
              : "For all water sources"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600">
            {product?.warranty || "1 year warranty"}
          </span>
        </div>

        <div className="mt-auto flex w-full">
          <button
            onClick={handleCartToggle}
            type="button"
            className={`w-full rounded-lg py-3 text-sm font-semibold shadow-md transition-all duration-300 ${
              cart
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-emerald-500 text-white hover:bg-emerald-400"
            }`}
          >
            {cart ? "In Cart" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReusableProductCard;
