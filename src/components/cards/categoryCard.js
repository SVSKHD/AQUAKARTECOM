import Link from "next/link";
import React, { useMemo } from "react";

const clampTwoLines = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const getCategoryLink = (category) => {
  if (!category) return "/categories";
  if (category.slug) return `/category/${category.slug}`;
  if (category.title) {
    const safeTitle = encodeURIComponent(category.title.trim());
    return `/category/${safeTitle}`;
  }
  return `/category/${category._id ?? "categories"}`;
};

const AquaCategoryCard = ({ category }) => {
  const title = category?.title ?? "Category";
  const imageUrl =
    category?.photos?.[0]?.secure_url ||
    category?.photos?.[0]?.delivery_url ||
    category?.photos?.[0]?.url ||
    "";
  const href = useMemo(() => getCategoryLink(category), [category]);

  return (
    <Link
      href={href}
      className="group relative block h-full min-h-[260px] overflow-hidden rounded-3xl border border-slate-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-slate-200"
    >
      <div className="relative h-full min-h-[260px] overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-100 via-white to-indigo-50">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-200 via-indigo-100 to-white">
            <span className="text-lg font-semibold uppercase tracking-wide text-indigo-700">
              {title.slice(0, 1)}
            </span>
          </div>
        )}

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
            View products →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default AquaCategoryCard;
