import Link from "next/link";
import React, { useMemo } from "react";

const FALLBACK_CATEGORY_IMAGE =
  "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-512x512_kfw439.png";

const clampTwoLines = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const getCategoryLink = (category) => {
  if (!category) return "/categories";
  if (category.slug) return `/category/${category.slug}`;
  if (category.title) return `/category/${encodeURIComponent(category.title.trim())}`;
  return `/category/${category._id ?? "categories"}`;
};

const getCategoryImage = (category) =>
  category?.photos?.[0]?.secure_url ||
  category?.photos?.[0]?.delivery_url ||
  category?.photos?.[0]?.url ||
  FALLBACK_CATEGORY_IMAGE;

const baseCardClass =
  "group relative block overflow-hidden border bg-white transition-all duration-300";

const AquaCategoryCard = ({ category, variant = "catalog" }) => {
  const title = category?.title ?? "Category";
  const imageUrl = getCategoryImage(category);
  const href = useMemo(() => getCategoryLink(category), [category]);
  const isCollection = variant === "collection";

  if (isCollection) {
    return (
      <Link
        href={href}
        className={`${baseCardClass} aspect-[16/10] min-h-[142px] rounded-2xl border-white/70 shadow-[0_16px_36px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_22px_54px_rgba(15,23,42,0.12)]`}
      >
        <img
          src={imageUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-white/5 transition duration-300 group-hover:from-slate-950/70" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3
            className="min-h-[40px] text-sm font-extrabold leading-5 drop-shadow-md sm:text-[15px]"
            style={clampTwoLines}
            title={title}
          >
            {title}
          </h3>
          <span className="mt-1 inline-flex translate-y-2 items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-200 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            View Collection
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`${baseCardClass} h-full min-h-[260px] rounded-3xl border-slate-100 hover:-translate-y-1 hover:border-slate-200`}
    >
      <div className="relative h-full min-h-[260px] overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-100 via-white to-indigo-50">
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
          loading="lazy"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-75 transition duration-300 group-hover:opacity-80" />

        <div className="absolute inset-x-0 bottom-0 flex min-h-[104px] flex-col justify-end gap-1 p-4 text-white">
          <span className="text-xs uppercase tracking-wide text-white/80">
            Category
          </span>
          <h3
            className="min-h-[56px] text-lg font-semibold leading-7"
            style={clampTwoLines}
            title={title}
          >
            {title}
          </h3>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl bg-indigo-600/90 px-5 text-center text-white opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="text-sm font-medium uppercase tracking-wide text-white/80">
            Explore
          </span>
          <span
            className="min-h-[48px] text-base font-semibold leading-6"
            style={clampTwoLines}
            title={title}
          >
            {title}
          </span>
          <span className="text-xs font-medium text-white/70">
            View products
          </span>
        </div>
      </div>
    </Link>
  );
};

export default AquaCategoryCard;
