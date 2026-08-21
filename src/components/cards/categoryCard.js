import Link from "next/link";
import React, { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";

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
  if (category.title)
    return `/category/${encodeURIComponent(category.title.trim())}`;
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
        className={`${baseCardClass} min-h-[22rem] rounded-[1.75rem] border-slate-200/80 p-2 shadow-[0_18px_48px_rgba(15,23,42,0.09)] hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_26px_64px_rgba(15,23,42,0.14)]`}
      >
        <div className="relative h-[15rem] overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-cyan-50 via-white to-emerald-50">
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.06]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-white/10" />
          <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700 shadow-sm backdrop-blur-xl">
            Aquakart collection
          </span>
        </div>

        <div className="flex min-h-[6rem] items-center justify-between gap-3 px-3 py-3">
          <div className="min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.17em] text-slate-400">
              Better water starts here
            </span>
            <h3
              className="mt-1 text-lg font-black leading-tight tracking-tight text-slate-950 transition group-hover:text-emerald-700"
              style={clampTwoLines}
              title={title}
            >
              {title}
            </h3>
          </div>
          <span
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-slate-950 text-white shadow-lg transition duration-300 group-hover:rotate-6 group-hover:bg-emerald-600"
            aria-hidden="true"
          >
            <ArrowUpRight size={19} />
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
