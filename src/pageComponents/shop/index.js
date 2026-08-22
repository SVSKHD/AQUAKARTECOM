"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Droplets,
  Funnel,
  Grid2X2,
  List,
  RotateCcw,
  Search,
  SlidersHorizontal,
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
    return String(
      value.title ||
        value.name ||
        value.categoryTitle ||
        value.subCategoryTitle ||
        "",
    ).trim();
  }
  return String(value || "").trim();
};

const isMongoObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

const buildTitleLookup = (items) =>
  new Map(
    items
      .map((item) => [String(item?._id || item?.id || ""), normalizeText(item)])
      .filter(([id, title]) => id && title),
  );

const extractCategory = (product, titleLookup = new Map()) => {
  const value =
    product?.category?.title ||
    product?.categoryTitle ||
    product?.categoryName ||
    product?.category ||
    product?.mainCategory ||
    product?.productCategory;
  const rawValue = normalizeText(value);
  const id = String(value?._id || value?.id || rawValue);
  return (
    titleLookup.get(id) ||
    (isMongoObjectId(rawValue) ? "" : rawValue) ||
    "Others"
  );
};

const extractSubcategory = (product, titleLookup = new Map()) => {
  const value =
    product?.subcategory?.title ||
    product?.subCategory?.title ||
    product?.subCategoryName ||
    product?.subCategory ||
    product?.subcategory ||
    product?.productSubCategory;
  const rawValue = normalizeText(value);
  const id = String(value?._id || value?.id || rawValue);
  return (
    titleLookup.get(id) ||
    (isMongoObjectId(rawValue) ? "" : rawValue) ||
    "Others"
  );
};

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

const productSearchText = (product, categoryLookup, subcategoryLookup) =>
  [
    product?.title,
    product?.name,
    extractBrand(product),
    extractCategory(product, categoryLookup),
    extractSubcategory(product, subcategoryLookup),
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
    className="inline-flex min-h-9 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-[11px] font-bold text-emerald-800"
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
  managedSeo = null,
}) => {
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(initialError);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("recommended");
  const [filters, setFilters] = useState(defaultFilters);
  const deferredQuery = useDeferredValue(filters.query.trim().toLowerCase());

  const categoryTitleLookup = useMemo(
    () => buildTitleLookup(initialCategories),
    [initialCategories],
  );
  const subcategoryTitleLookup = useMemo(
    () => buildTitleLookup(initialSubcategories),
    [initialSubcategories],
  );

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
      const category = extractCategory(product, categoryTitleLookup);
      const subcategory = extractSubcategory(product, subcategoryTitleLookup);
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
  }, [
    products,
    categoryTitlesFromProps,
    subcategoryTitlesFromProps,
    categoryTitleLookup,
    subcategoryTitleLookup,
  ]);

  const filteredAndSortedProducts = useMemo(() => {
    const priceLimit =
      filters.price === null ? derivedMeta.priceRange.max : filters.price;

    const filtered = products.filter((product) => {
      if (
        deferredQuery &&
        !productSearchText(
          product,
          categoryTitleLookup,
          subcategoryTitleLookup,
        ).includes(deferredQuery)
      ) {
        return false;
      }
      if (
        filters.category !== "All" &&
        extractCategory(product, categoryTitleLookup) !== filters.category
      ) {
        return false;
      }
      if (
        filters.subcategory !== "All" &&
        extractSubcategory(product, subcategoryTitleLookup) !==
          filters.subcategory
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
  }, [
    products,
    filters,
    deferredQuery,
    derivedMeta.priceRange.max,
    sortBy,
    categoryTitleLookup,
    subcategoryTitleLookup,
  ]);

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
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-950 bg-slate-950 px-4 text-xs font-black text-white transition hover:border-emerald-700 hover:bg-emerald-700"
      >
        View {filteredAndSortedProducts.length} products{" "}
        <ArrowRight size={15} />
      </button>
    </div>
  );

  return (
    <AquaLayout
      path="shop"
      productListData={schemaProducts}
      managedSeo={managedSeo}
      allowPageSticky
    >
      {loading ? (
        <AquaAppLoader
          variant="screen"
          message="Refreshing the water studio"
          subtext="Matching products, prices and availability for you."
        />
      ) : error ? (
        <section className="mx-auto my-12 flex min-h-[58vh] w-[calc(100%-2rem)] max-w-3xl flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-8 text-center">
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
            className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full border border-slate-950 bg-slate-950 px-6 text-xs font-black text-white transition hover:border-emerald-700 hover:bg-emerald-700"
          >
            Refresh catalogue <RotateCcw size={15} />
          </button>
        </section>
      ) : (
        <div
          data-aqua-preserve-surface
          className="relative min-h-screen overflow-x-clip px-3 pb-16 pt-0 sm:px-5 sm:pt-1 lg:px-7"
        >
          <div className="pointer-events-none absolute left-[-12rem] top-10 h-[30rem] w-[30rem] rounded-full bg-emerald-200/25 blur-[110px]" />
          <div className="pointer-events-none absolute right-[-12rem] top-[36rem] h-[30rem] w-[30rem] rounded-full bg-sky-200/20 blur-[120px]" />

          <div className="relative mx-auto max-w-[1480px]">
            <section id="shop-products" className="scroll-mt-28">
              <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[310px_minmax(0,1fr)]">
                <aside className="hidden lg:block">
                  <div className="sticky top-[92px] max-h-[calc(100vh-108px)] overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-white p-4">
                    <div className="mb-4 flex items-center justify-between border-b border-slate-200/70 pb-4">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">
                          Refine products
                        </span>
                        <h1 className="mt-1 text-xl font-black tracking-[-0.05em] text-slate-950">
                          Filters
                        </h1>
                      </div>
                      {activeFilterChips.length ? (
                        <button
                          type="button"
                          onClick={clearAllFilters}
                          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-[10px] font-black text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <RotateCcw size={12} /> Reset
                        </button>
                      ) : null}
                    </div>
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
                  </div>
                </aside>

                <div className="min-w-0">
                  <div className="sticky top-[76px] z-30 mb-4 rounded-[1.65rem] border border-slate-200 bg-white p-2.5 sm:top-[92px] sm:p-3">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowFilters(true)}
                        className="relative inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-slate-950 bg-slate-950 px-4 text-xs font-black text-white transition hover:border-emerald-700 hover:bg-emerald-700 lg:hidden"
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

                  <div className="mb-4 flex items-end justify-between gap-6 px-1 sm:px-2">
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
                </div>
              </div>
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
