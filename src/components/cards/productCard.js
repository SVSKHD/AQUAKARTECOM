import { useState, useEffect, useMemo } from "react";
import useCurrency from "@/utils/currency";
import useProduct from "@/utils/product";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { FaHeart, FaShoppingCart } from "react-icons/fa";
import AquaImage from "../images/AquaImage";

const AquaProductCard = ({ product }) => {
  const {
    title,
    photos = [],
    price,
    slug,
    coverage,
    capacity,
    warranty,
  } = product;
  const { formatCurrencyINRWithK } = useCurrency;
  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();
  const { cartData, favData } = useSelector((state) => ({ ...state }));
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

  const displayPhotos = useMemo(() => {
    if (Array.isArray(photos) && photos.length > 0) return photos;
    return [
      {
        secure_url:
          "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
      },
    ];
  }, [photos]);

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
      className="group flex h-full flex-col rounded-2xl border border-slate-100 bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
      aria-label={`View details for ${title}`}
    >
      <div className="relative h-48 overflow-hidden rounded-t-2xl bg-slate-100">
        <AquaImage
          src={displayPhotos[0]?.secure_url}
          alt={title}
          customClass="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-950/70 to-transparent px-3 pb-3 pt-8 text-xs uppercase tracking-wide text-white/80">
          <span>{product?.brand || product?.manufacturer || "Aquakart"}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
            {coverage || capacity || "All sources"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleFavToggle}
          className={`absolute top-3 right-3 rounded-full border p-2 transition-all duration-300 shadow ${
            fav
              ? "border-rose-500 bg-white/90 text-rose-600 hover:bg-rose-500 hover:text-white"
              : "border-white/70 bg-white/80 text-slate-500 hover:border-rose-300 hover:text-rose-500"
          }`}
        >
          <FaHeart size={16} />
        </button>
        <button
          type="button"
          onClick={handleCartToggle}
          className={`absolute top-3 left-3 rounded-full border p-2 transition-all duration-300 shadow ${
            cart
              ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
              : "border-white/70 bg-white/80 text-slate-500 hover:border-emerald-300 hover:text-emerald-600"
          }`}
        >
          <FaShoppingCart size={16} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 text-left">
        <h3 className="text-base font-semibold text-slate-900 transition group-hover:text-emerald-600">
          {title?.length > 100 ? `${title.slice(0, 97)}…` : title}
        </h3>
        <p className="text-lg font-bold text-slate-900">
          {formatCurrencyINRWithK(price)}
        </p>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {product?.color || product?.application || "Fits kitchens & baths"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
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
