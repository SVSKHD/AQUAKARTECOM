import Link from "next/link";
import React, { useMemo } from "react";

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
  const imageUrl = category?.photos?.[0]?.secure_url ?? "";
  const href = useMemo(() => getCategoryLink(category), [category]);

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-3xl glass-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]"
    >
      <div className="relative h-60 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-100 via-white to-indigo-50">
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

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-70 transition duration-300 group-hover:opacity-80" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-white">
          <span className="text-xs uppercase tracking-wide text-white/80">
            Category
          </span>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl bg-indigo-600/90 text-white opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="text-sm font-medium uppercase tracking-wide text-white/80">
            Explore
          </span>
          <span className="text-base font-semibold">
            {title.length > 30 ? `${title.slice(0, 30)}…` : title}
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
