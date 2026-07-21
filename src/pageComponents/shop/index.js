"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BadgePercent,
  ChevronDown,
  Droplets,
  Funnel,
  Grid2X2,
  Headphones,
  List,
  PackageCheck,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  WandSparkles,
  X,
} from "lucide-react";
import AquaLayout from "@/components/Layout/Layout";
import AquaReuseDrawer from "@/components/reusables/drawer";
import AquaAppLoader from "@/components/common/AquaAppLoader";
import ProductServiceOperations from "@/services/products";
import { getProductReviewStats } from "@/utils/reviewStats";
import ProductGrid from "./productGrid";
import ShopFiltersPanel from "./shopFilter";

const defaultFilters = {
  query: "",
  category: "All",
  subcategory: "All",
  brand: "All",
  price: null,
  inStockOnly: false,
  offersOnly: false,
  rating: 0,
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const normalizeText = (value) => {
  if (value && typeof value === "object") {
    return String(value.title || value.name || "").trim();
  }
  return String(value || "").trim();
};

const extractCategory = (product) =>
  normalizeText(
    product?.category?.title ||
      product?.categoryTitle ||
      product?.categoryName ||
      product?.category ||
      product?.mainCategory ||
      product?.productCategory,
  ) || "Others";

const extractSubcategory = (product) =>
  normalizeText(
    product?.subcategory?.title ||
      product?.subCategory?.title ||
      product?.subCategoryName ||
      product?.subCategory ||
      product?.subcategory ||
      product?.productSubCategory,
  ) || "Others";

const extractBrand = (product) =>
  normalizeText(
    product?.brand ||
      product?.brandName ||
      product?.manufacturer ||
      product?.productBrand,
  ) || "Aquakart";

const extractPrice = (product) => {
  const regularPrice = Number(product?.price) || 0;
  const discountPrice = Number(product?.discountPrice) || 0;
  const useDiscount =
    product?.discountPriceStatus &&
    discountPrice > 0 &&
    (!regularPrice || discountPrice < regularPrice);

  return useDiscount ? discountPrice : regularPrice || discountPrice;
};

const hasOffer = (product) => {
  const regularPrice = Number(product?.price) || 0;
  const discountPrice = Number(product?.discountPrice) || 0;
  return Boolean(
    product?.discountPriceStatus &&
    discountPrice > 0 &&
    regularPrice > discountPrice,
  );
};

const isProductInStock = (product) => {
  if (typeof product?.inStock === "boolean") return product.inStock;
  if (typeof product?.available === "boolean") return product.available;

  const stock = Number(
    product?.stock ??
      product?.stockQuantity ??
      product?.availableStock ??
      product?.quantity,
  );
  return Number.isFinite(stock) ? stock > 0 : true;
};

const productSearchText = (product) =>
  [
    product?.title,
    product?.name,
    extractBrand(product),
    extractCategory(product),
    extractSubcategory(product),
    product?.application,
    product?.coverage,
    product?.capacity,
    product?.color,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const FilterChip = ({ label, onRemove }) => (
  <motion.span
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="inline-flex min-h-9 items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/85 px-3 text-[11px] font-bold text-emerald-800 shadow-sm"
  >
    {label}
    <button
      type="button"
      onClick={onRemove}
      className="grid h-5 w-5 place-items-center rounded-full bg-white/80 text-emerald-700 transition hover:bg-emerald-100"
      aria-label={`Remove ${label} filter`}
    >
      <X size={12} />
    </button>
  </motion.span>
);

const AquaShopPageComponent = ({
  initialProducts = [],
  initialError = "",
  initialCategories = [],
  initialSubcategories = [],
}) => {
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(initialError);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("recommended");
  const [filters, setFilters] = useState(defaultFilters);
  const deferredQuery = useDeferredValue(filters.query.trim().toLowerCase());

  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await ProductServiceOperations.AllProducts();
      const data = response?.data?.data;
      const nextProducts = Array.isArray(data) ? data : [];
      setProducts(nextProducts);
      if (!nextProducts.length) {
        setError("No products are available at the moment.");
      }
    } catch (fetchError) {
      console.error("Error fetching products:", fetchError);
      setError(
        "We’re having trouble loading products right now. Please refresh or try again later.",
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const categoryTitlesFromProps = useMemo(
    () => initialCategories.map((item) => normalizeText(item)).filter(Boolean),
    [initialCategories],
  );

  const subcategoryTitlesFromProps = useMemo(
    () =>
      initialSubcategories.map((item) => normalizeText(item)).filter(Boolean),
    [initialSubcategories],
  );

  const derivedMeta = useMemo(() => {
    const categories = new Set(categoryTitlesFromProps);
    const subcategories = new Set(subcategoryTitlesFromProps);
    const brands = new Set();
    const categoryCounts = new Map();
    let minPrice = Infinity;
    let maxPrice = 0;

    products.forEach((product) => {
      const category = extractCategory(product);
      const subcategory = extractSubcategory(product);
      const brand = extractBrand(product);
      const price = extractPrice(product);

      categories.add(category);
      subcategories.add(subcategory);
      brands.add(brand);
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);

      if (price > 0) {
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
      }
    });

    const sortAlpha = (collection) =>
      Array.from(collection)
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right));

    return {
      categories: sortAlpha(categories),
      subcategories: sortAlpha(subcategories),
      brands: sortAlpha(brands),
      categoryCounts,
      priceRange: {
        min: Number.isFinite(minPrice) ? minPrice : 0,
        max: maxPrice,
      },
    };
  }, [products, categoryTitlesFromProps, subcategoryTitlesFromProps]);

  const filteredAndSortedProducts = useMemo(() => {
    const priceLimit =
      filters.price === null ? derivedMeta.priceRange.max : filters.price;

    const filtered = products.filter((product) => {
      if (
        deferredQuery &&
        !productSearchText(product).includes(deferredQuery)
      ) {
        return false;
      }
      if (
        filters.category !== "All" &&
        extractCategory(product) !== filters.category
      ) {
        return false;
      }
      if (
        filters.subcategory !== "All" &&
        extractSubcategory(product) !== filters.subcategory
      ) {
        return false;
      }
      if (filters.brand !== "All" && extractBrand(product) !== filters.brand) {
        return false;
      }
      if (priceLimit > 0 && extractPrice(product) > priceLimit) return false;
      if (filters.inStockOnly && !isProductInStock(product)) return false;
      if (filters.offersOnly && !hasOffer(product)) return false;
      if (
        filters.rating > 0 &&
        getProductReviewStats(product).ratingValue < filters.rating
      ) {
        return false;
      }
      return true;
    });

    return [...filtered].sort((left, right) => {
      switch (sortBy) {
        case "price-low":
          return extractPrice(left) - extractPrice(right);
        case "price-high":
          return extractPrice(right) - extractPrice(left);
        case "rating":
          return (
            getProductReviewStats(right).ratingValue -
            getProductReviewStats(left).ratingValue
          );
        case "saving": {
          const leftSaving = hasOffer(left)
            ? Number(left.price) - Number(left.discountPrice)
            : 0;
          const rightSaving = hasOffer(right)
            ? Number(right.price) - Number(right.discountPrice)
            : 0;
          return rightSaving - leftSaving;
        }
        case "name":
          return String(left?.title || "").localeCompare(
            String(right?.title || ""),
          );
        default:
          return 0;
      }
    });
  }, [products, filters, deferredQuery, derivedMeta.priceRange.max, sortBy]);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (filters.query) {
      chips.push({ key: "query", label: `“${filters.query}”`, value: "" });
    }
    if (filters.category !== "All") {
      chips.push({
        key: "category",
        label: filters.category,
        value: "All",
      });
    }
    if (filters.subcategory !== "All") {
      chips.push({
        key: "subcategory",
        label: filters.subcategory,
        value: "All",
      });
    }
    if (filters.brand !== "All") {
      chips.push({ key: "brand", label: filters.brand, value: "All" });
    }
    if (filters.price !== null && filters.price < derivedMeta.priceRange.max) {
      chips.push({
        key: "price",
        label: `Under ${formatCurrency(filters.price)}`,
        value: null,
      });
    }
    if (filters.inStockOnly) {
      chips.push({
        key: "inStockOnly",
        label: "Ready to buy",
        value: false,
      });
    }
    if (filters.offersOnly) {
      chips.push({
        key: "offersOnly",
        label: "Best offers",
        value: false,
      });
    }
    if (filters.rating > 0) {
      chips.push({
        key: "rating",
        label: `${filters.rating}+ stars`,
        value: 0,
      });
    }
    return chips;
  }, [filters, derivedMeta.priceRange.max]);

  const handleFilterChange = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  };

  const clearAllFilters = () => setFilters(defaultFilters);
  const hasAnyProducts = products.length > 0;
  const hasFilteredProducts = filteredAndSortedProducts.length > 0;
  const schemaProducts = initialProducts.length ? initialProducts : products;
  const priceValue = filters.price ?? derivedMeta.priceRange.max;

  const drawerFooter = (
    <div className="grid grid-cols-[0.75fr_1.25fr] gap-2.5">
      <button
        type="button"
        onClick={clearAllFilters}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
      >
        <RotateCcw size={15} /> Reset
      </button>
      <button
        type="button"
        onClick={() => setShowFilters(false)}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-xs font-black text-white shadow-[0_14px_28px_rgba(15,23,42,0.2)] transition hover:bg-emerald-700"
      >
        View {filteredAndSortedProducts.length} products{" "}
        <ArrowRight size={15} />
      </button>
    </div>
  );

  return (
    <AquaLayout path="shop" productListData={schemaProducts}>
      {loading ? (
        <AquaAppLoader
          variant="screen"
          message="Refreshing the water studio"
          subtext="Matching products, prices and availability for you."
        />
      ) : error ? (
        <section className="mx-auto my-12 flex min-h-[58vh] w-[calc(100%-2rem)] max-w-3xl flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/75 p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.1)] backdrop-blur-2xl">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-rose-500">
            <Droplets size={28} />
          </div>
          <span className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
            Aquakart catalogue
          </span>
          <h1 className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">
            The water studio needs a moment.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-500">
            {error}
          </p>
          <button
            type="button"
            onClick={fetchProducts}
            className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-slate-950 px-6 text-xs font-black text-white shadow-lg transition hover:bg-emerald-700"
          >
            Refresh catalogue <RotateCcw size={15} />
          </button>
        </section>
      ) : (
        <div
          data-aqua-preserve-surface
          className="relative min-h-screen overflow-x-clip px-3 pb-16 pt-3 sm:px-5 sm:pt-5 lg:px-7"
        >
          <div className="pointer-events-none absolute left-[-12rem] top-10 h-[30rem] w-[30rem] rounded-full bg-emerald-200/25 blur-[110px]" />
          <div className="pointer-events-none absolute right-[-12rem] top-[36rem] h-[30rem] w-[30rem] rounded-full bg-sky-200/20 blur-[120px]" />

          <div className="relative mx-auto max-w-[1480px]">
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 px-5 py-8 text-white shadow-[0_32px_90px_rgba(2,6,23,0.24)] sm:rounded-[2.75rem] sm:px-9 sm:py-11 lg:px-14 lg:py-14"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.22),transparent_30%),radial-gradient(circle_at_8%_100%,rgba(14,165,233,0.14),transparent_35%)]" />
              <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full border border-white/10 shadow-[0_0_0_50px_rgba(255,255,255,0.025),0_0_0_100px_rgba(255,255,255,0.015)]" />

              <div className="relative z-10 grid items-end gap-10 lg:grid-cols-[1.25fr_0.75fr]">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
                    <Sparkles size={14} /> Curated water solutions
                  </div>
                  <h1 className="mt-6 max-w-4xl text-[clamp(2.45rem,7vw,6.4rem)] font-black leading-[0.87] tracking-[-0.085em]">
                    Water,
                    <br /> thoughtfully solved.
                  </h1>
                  <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                    Explore reliable softeners, purifiers and filtration systems
                    selected for Indian homes—with clear pricing and expert help
                    before you buy.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        document
                          .getElementById("shop-products")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="inline-flex min-h-12 items-center gap-2 rounded-full bg-emerald-400 px-5 text-xs font-black text-slate-950 shadow-[0_14px_30px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 hover:bg-emerald-300"
                    >
                      Shop the collection <ArrowRight size={16} />
                    </button>
                    <Link
                      href="/softener-planner"
                      className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 bg-white/8 px-5 text-xs font-black text-white backdrop-blur transition hover:bg-white/14"
                    >
                      <WandSparkles size={16} /> Find my solution
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
                  {[
                    [BadgeCheck, `${products.length}+`, "curated products"],
                    [
                      ShieldCheck,
                      `${derivedMeta.brands.length}`,
                      "trusted brands",
                    ],
                    [Headphones, "Human", "pre-buy guidance"],
                  ].map(([Icon, value, label]) => (
                    <div
                      key={label}
                      className="flex min-h-[88px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.065] p-4 backdrop-blur-xl last:col-span-2 sm:last:col-span-1"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/12 text-emerald-300">
                        <Icon size={19} />
                      </span>
                      <span>
                        <strong className="block text-lg font-black tracking-[-0.04em]">
                          {value}
                        </strong>
                        <small className="mt-0.5 block text-[9px] uppercase tracking-[0.13em] text-slate-400">
                          {label}
                        </small>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            <section className="mt-5 overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/70 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-2xl sm:p-4">
              <div className="mb-3 flex items-center justify-between px-1 sm:px-2">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">
                    Start with your need
                  </span>
                  <h2 className="mt-1 text-sm font-black tracking-[-0.03em] text-slate-950 sm:text-base">
                    Quick solution lanes
                  </h2>
                </div>
                {filters.category !== "All" ? (
                  <button
                    type="button"
                    onClick={() => handleFilterChange("category", "All")}
                    className="text-[10px] font-black text-slate-500 transition hover:text-emerald-700"
                  >
                    Show everything
                  </button>
                ) : null}
              </div>

              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => handleFilterChange("category", "All")}
                  className={`flex min-w-[145px] items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    filters.category === "All"
                      ? "border-slate-950 bg-slate-950 text-white shadow-lg"
                      : "border-slate-200/80 bg-white/80 text-slate-700 hover:border-emerald-200"
                  }`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-400/15 text-emerald-500">
                    <Droplets size={18} />
                  </span>
                  <span>
                    <strong className="block text-[11px] font-black">
                      All solutions
                    </strong>
                    <small className="mt-0.5 block text-[9px] opacity-60">
                      {products.length} products
                    </small>
                  </span>
                </button>

                {derivedMeta.categories.slice(0, 9).map((category, index) => (
                  <button
                    type="button"
                    key={category}
                    onClick={() => handleFilterChange("category", category)}
                    className={`flex min-w-[170px] items-center gap-3 rounded-2xl border p-3 text-left transition ${
                      filters.category === category
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-lg"
                        : "border-slate-200/80 bg-white/80 text-slate-700 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                        filters.category === category
                          ? "bg-white/15 text-white"
                          : "bg-slate-100 text-emerald-700"
                      }`}
                    >
                      {index % 2 ? (
                        <PackageCheck size={18} />
                      ) : (
                        <Droplets size={18} />
                      )}
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-[11px] font-black">
                        {category}
                      </strong>
                      <small className="mt-0.5 block text-[9px] opacity-60">
                        {derivedMeta.categoryCounts.get(category) || 0} products
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section id="shop-products" className="scroll-mt-28 pt-7">
              <div className="sticky top-[76px] z-30 mb-5 rounded-[1.65rem] border border-white/80 bg-[rgba(248,252,251,0.88)] p-2.5 shadow-[0_18px_55px_rgba(15,23,42,0.09)] backdrop-blur-2xl sm:top-[92px] sm:p-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowFilters(true)}
                    className="relative inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-xs font-black text-white shadow-lg transition hover:bg-emerald-700"
                  >
                    <SlidersHorizontal size={17} />
                    <span className="hidden sm:inline">Tune filters</span>
                    {activeFilterChips.length ? (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-emerald-400 px-1 text-[9px] text-slate-950">
                        {activeFilterChips.length}
                      </span>
                    ) : null}
                  </button>

                  <label className="relative min-w-0 flex-1">
                    <Search
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="search"
                      value={filters.query}
                      onChange={(event) =>
                        handleFilterChange("query", event.target.value)
                      }
                      placeholder="Search water solutions…"
                      className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white/90 pl-10 pr-9 text-xs font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    />
                    {filters.query ? (
                      <button
                        type="button"
                        onClick={() => handleFilterChange("query", "")}
                        className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-slate-100 text-slate-500"
                        aria-label="Clear search"
                      >
                        <X size={13} />
                      </button>
                    ) : null}
                  </label>

                  <div className="relative hidden sm:block">
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      aria-label="Sort products"
                      className="h-12 appearance-none rounded-2xl border border-slate-200/80 bg-white/90 pl-4 pr-10 text-xs font-black text-slate-700 outline-none transition hover:border-slate-300 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="recommended">Recommended</option>
                      <option value="price-low">Price: low to high</option>
                      <option value="price-high">Price: high to low</option>
                      <option value="rating">Top rated</option>
                      <option value="saving">Biggest saving</option>
                      <option value="name">Name: A to Z</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                  </div>

                  <div className="hidden h-12 items-center rounded-2xl border border-slate-200/80 bg-white/90 p-1 sm:flex">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`grid h-10 w-10 place-items-center rounded-xl transition ${
                        viewMode === "grid"
                          ? "bg-slate-950 text-white"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                      aria-label="Grid view"
                    >
                      <Grid2X2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`grid h-10 w-10 place-items-center rounded-xl transition ${
                        viewMode === "list"
                          ? "bg-slate-950 text-white"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                      aria-label="List view"
                    >
                      <List size={17} />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200/70 px-1 pt-2 sm:hidden">
                  <div className="relative min-w-0 flex-1">
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      aria-label="Sort products"
                      className="h-9 w-full appearance-none rounded-xl border-0 bg-slate-100 pl-3 pr-8 text-[10px] font-black text-slate-700 outline-none"
                    >
                      <option value="recommended">Recommended</option>
                      <option value="price-low">Price: low to high</option>
                      <option value="price-high">Price: high to low</option>
                      <option value="rating">Top rated</option>
                      <option value="saving">Biggest saving</option>
                    </select>
                    <ChevronDown
                      size={13}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                  </div>
                  <span className="shrink-0 text-[10px] font-black text-slate-500">
                    {filteredAndSortedProducts.length} results
                  </span>
                </div>
              </div>

              <AnimatePresence mode="popLayout">
                {activeFilterChips.length ? (
                  <motion.div
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5 overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center gap-2 px-1">
                      {activeFilterChips.map((chip) => (
                        <FilterChip
                          key={chip.key}
                          label={chip.label}
                          onRemove={() =>
                            handleFilterChange(chip.key, chip.value)
                          }
                        />
                      ))}
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="inline-flex h-9 items-center gap-1.5 px-2 text-[10px] font-black text-slate-500 transition hover:text-rose-600"
                      >
                        <RotateCcw size={13} /> Clear all
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="mb-5 flex items-end justify-between gap-6 px-1 sm:px-2">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">
                    Shop with clarity
                  </span>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.06em] text-slate-950 sm:text-4xl">
                    {filters.category === "All"
                      ? "The complete collection"
                      : filters.category}
                  </h2>
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/75 px-3 py-2 text-[10px] font-bold text-slate-500 sm:flex">
                  <BadgeCheck size={14} className="text-emerald-600" />
                  {filteredAndSortedProducts.length} carefully matched
                </div>
              </div>

              {hasAnyProducts && hasFilteredProducts ? (
                <ProductGrid
                  products={filteredAndSortedProducts}
                  viewMode={viewMode}
                />
              ) : hasAnyProducts ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex min-h-[44vh] flex-col items-center justify-center rounded-[2.25rem] border border-dashed border-slate-300 bg-white/65 p-8 text-center backdrop-blur-xl"
                >
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Funnel size={26} />
                  </span>
                  <h3 className="mt-5 text-xl font-black tracking-[-0.04em] text-slate-950">
                    No exact match yet
                  </h3>
                  <p className="mt-2 max-w-md text-xs leading-6 text-slate-500">
                    Widen the budget or remove a filter. Your full Aquakart
                    collection is one tap away.
                  </p>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-950 px-5 text-xs font-black text-white transition hover:bg-emerald-700"
                  >
                    <RotateCcw size={15} /> Reset filters
                  </button>
                </motion.div>
              ) : (
                <div className="flex min-h-[42vh] items-center justify-center rounded-[2.25rem] border border-dashed border-slate-300 bg-white/65 text-xs font-semibold text-slate-500">
                  No products are available right now.
                </div>
              )}
            </section>

            <section className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                [
                  ShieldCheck,
                  "Confident purchase",
                  "Clear specifications and transparent prices.",
                ],
                [
                  Headphones,
                  "Human guidance",
                  "Talk to our team before choosing a system.",
                ],
                [
                  BadgePercent,
                  "Value that lasts",
                  "Compare offers without losing product context.",
                ],
              ].map(([Icon, title, description]) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/65 p-4 shadow-sm backdrop-blur"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon size={18} />
                  </span>
                  <div>
                    <strong className="text-xs font-black text-slate-900">
                      {title}
                    </strong>
                    <p className="mt-1 text-[10px] leading-5 text-slate-500">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </section>
          </div>

          <AquaReuseDrawer
            open={showFilters}
            close={() => setShowFilters(false)}
            title="Tune your water solution"
            description="Every choice updates the collection instantly. Refine only what matters to your home."
            eyebrow="Smart catalogue"
            size="lg"
            footer={drawerFooter}
          >
            <ShopFiltersPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              categoryOptions={derivedMeta.categories}
              subcategoryOptions={derivedMeta.subcategories}
              brandOptions={derivedMeta.brands}
              priceRange={{
                min: derivedMeta.priceRange.min,
                max: derivedMeta.priceRange.max,
                value: priceValue,
              }}
            />
          </AquaReuseDrawer>
        </div>
      )}
    </AquaLayout>
  );
};

export default AquaShopPageComponent;
