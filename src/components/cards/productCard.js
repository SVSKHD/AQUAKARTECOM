import { useState, useEffect, useMemo } from "react";
import useCurrency from "@/utils/currency";
import useProduct from "@/utils/product";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { FaHeart, FaShoppingCart, FaStar } from "react-icons/fa";
import AquaImage from "../images/AquaImage";
import { getProductReviewStats } from "@/utils/reviewStats";

const clampTwoLines = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const getProductPricing = (product) => {
  const finalPrice = Number(
    product?.pricing?.finalPrice ??
      product?.finalPrice ??
      product?.salePrice ??
      product?.discountPrice ??
      product?.price ??
      0,
  );
  const mrp = Number(product?.pricing?.mrp ?? product?.mrp ?? product?.price ?? 0);

  return {
    finalPrice,
    mrp,
    hasDiscount: Boolean(mrp && finalPrice && mrp > finalPrice),
  };
};

const AquaProductCard = ({ product = {} }) => {
  const {
    title = "Aquakart product",
    photos = [],
    slug,
    coverage,
    capacity,
    warranty,
  } = product;
  const { formatCurrencyINRWithK } = useCurrency;
  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();
  const { cartData = [], favData = [] } = useSelector((state) => ({ ...state }));
  const router = useRouter();

  const [cart, setAddCart] = useState(false);
  const [fav, setAddFav] = useState(false);

  useEffect(() => {
    const isProductInCart = cartData.some((item) => item._id === product?._id);
    const isProductInFav = favData.some((item) => item._id === product?._id);
    setAddCart(isProductInCart);
    setAddFav(isProductInFav);
  }, [cartData, product?._id, favData]);

  const productHref = useMemo(() => {
    if (product?.slug) return `/product/${product.slug}`;
    if (product?._id) return `/product/${product._id}`;
    return "/product";
  }, [product]);

  const reviewStats = useMemo(() => getProductReviewStats(product), [product]);
  const pricing = useMemo(() => getProductPricing(product), [product]);
  const displayPhotos = useMemo(() => {
    if (Array.isArray(photos) && photos.length > 0) return photos;
    return [
      {
        secure_url:
          "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
      },
    ];
  }, [photos]);

  const productImage =
    displayPhotos[0]?.secure_url ||
    displayPhotos[0]?.delivery_url ||
    displayPhotos[0]?.url ||
    "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png";

  const handleNavigate = () => {
    router.push(productHref);
  };

  const handleFavToggle = (event) => {
    event.stopPropagation();
    AddAndRemoveFav(product, setAddFav);
  };

  const handleCartToggle = (event) => {
    event.stopPropagation();
    AddAndRemoveCart(product, setAddCart);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleNavigate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleNavigate();
        }
      }}
      className="group flex h-full min-h-[430px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition hover:-translate-y-1 hover:border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
      aria-label={`View details for ${title}`}
    >
      <div className="relative h-48 shrink-0 overflow-hidden rounded-t-2xl bg-slate-100">
        <AquaImage
          src={productImage}
          alt={title}
          customClass="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-950/70 to-transparent px-3 pb-3 pt-8 text-xs uppercase tracking-wide text-white/80">
          <span className="max-w-[55%] truncate">
            {product?.brand || product?.manufacturer || "Aquakart"}
          </span>
          <span className="inline-flex max-w-[42%] items-center gap-1 truncate rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
            {coverage || capacity || "All sources"}
          </span>
        </div>

        {reviewStats.ratingValue || reviewStats.ratingCount ? (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-800">
            <FaStar className="text-amber-400" size={11} />
            {reviewStats.ratingValue
              ? reviewStats.ratingValue.toFixed(1)
              : "Reviews"}
            {reviewStats.ratingCount ? ` (${reviewStats.ratingCount})` : ""}
          </div>
        ) : null}

        <button
          type="button"
          aria-label={fav ? "Remove from favourites" : "Add to favourites"}
          onClick={handleFavToggle}
          className={`absolute top-3 right-3 rounded-full border p-2 transition-all duration-300 ${
            fav
              ? "border-rose-500 bg-white/90 text-rose-600 hover:bg-rose-500 hover:text-white"
              : "border-white/70 bg-white/80 text-slate-500 hover:border-rose-300 hover:text-rose-500"
          }`}
        >
          <FaHeart size={16} />
        </button>
        <button
          type="button"
          aria-label={cart ? "Remove from cart" : "Add to cart"}
          onClick={handleCartToggle}
          className={`absolute top-3 left-3 rounded-full border p-2 transition-all duration-300 ${
            cart
              ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
              : "border-white/70 bg-white/80 text-slate-500 hover:border-emerald-300 hover:text-emerald-600"
          }`}
        >
          <FaShoppingCart size={16} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 text-left">
        <h3
          className="min-h-[48px] text-base font-semibold leading-6 text-slate-900 transition group-hover:text-emerald-600"
          style={clampTwoLines}
          title={title}
        >
          {title}
        </h3>
        <div className="flex min-h-[32px] items-end gap-2">
          <p className="text-xl font-extrabold text-emerald-600">
            {formatCurrencyINRWithK(pricing.finalPrice)}
          </p>
          {pricing.hasDiscount && pricing.mrp ? (
            <p className="text-sm font-medium text-slate-400 line-through">
              {formatCurrencyINRWithK(pricing.mrp)}
            </p>
          ) : null}
        </div>
        <div className="flex min-h-[44px] items-start justify-between gap-3 text-xs text-slate-500">
          <span className="leading-5" style={clampTwoLines}>
            {product?.color || product?.application || "Fits kitchens & baths"}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
            {warranty || "1 yr warranty"}
          </span>
        </div>
        <div className="mt-auto text-sm font-medium text-emerald-600">
          View details →
        </div>
      </div>
    </div>
  );
};

export default AquaProductCard;
