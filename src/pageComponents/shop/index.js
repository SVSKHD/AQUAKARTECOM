"use client";
import { useState, useEffect, useMemo, Fragment } from "react";
import AquaLayout from "@/components/Layout/Layout";
import ProductServiceOperations from "@/services/products";
import AQ from "@/assests/logo-white.png";
import Image from "next/image";
import ProductGrid from "./productGrid";
import ShopFiltersPanel from "./shopFilter";
import { Dialog, Transition } from "@headlessui/react";
import {
  FunnelIcon,
  XMarkIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

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
  const [sortBy, setSortBy] = useState("featured");
  const [filters, setFilters] = useState({
    category: "All",
    subcategory: "All",
    brand: "All",
    price: 0,
  });

  const fetchProducts = async (signal) => {
    setLoading(true);
    setError("");

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      if (!apiBase) {
        throw new Error(
          "NEXT_PUBLIC_API_URL is not defined. Please configure the API endpoint.",
        );
      }

      const response = await ProductServiceOperations.AllProducts({ signal });
      const data = response?.data?.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      if (signal?.aborted) return;
      console.error("Error fetching products:", fetchError);
      setError(
        "We’re having trouble loading products right now. Please refresh or try again later.",
      );
      setProducts([]);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (initialProducts.length > 0 && !initialError) {
      return undefined;
    }
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProducts.length, initialError]);

  const extractCategory = (product) =>
    product?.category?.title ||
    product?.categoryTitle ||
    product?.categoryName ||
    product?.category ||
    product?.mainCategory ||
    product?.productCategory ||
    "Others";

  const extractSubcategory = (product) =>
    product?.subcategory?.title ||
    product?.subCategory?.title ||
    product?.subCategoryName ||
    product?.subCategory ||
    product?.subcategory ||
    product?.productSubCategory ||
    "Others";

  const extractBrand = (product) =>
    product?.brand ||
    product?.brandName ||
    product?.manufacturer ||
    product?.productBrand ||
    "Aquakart";

  const extractPrice = (product) => {
    const price = product?.discountPriceStatus
      ? product?.discountPrice
      : product?.price;
    const numeric = Number(price);
    if (Number.isNaN(numeric)) {
      return 0;
    }
    return numeric;
  };

  const categoryTitlesFromProps = useMemo(
    () => (initialCategories || []).map((item) => item?.title).filter(Boolean),
    [initialCategories],
  );

  const subcategoryTitlesFromProps = useMemo(
    () =>
      (initialSubcategories || []).map((item) => item?.title).filter(Boolean),
    [initialSubcategories],
  );

  const derivedMeta = useMemo(() => {
    if (!products.length) {
      return {
        categories: categoryTitlesFromProps,
        subcategories: subcategoryTitlesFromProps,
        brands: [],
        priceRange: { min: 0, max: 0 },
      };
    }

    const categoriesSet = new Set();
    const subcategoriesSet = new Set();
    const brandsSet = new Set();
    let minPrice = Infinity;
    let maxPrice = 0;

    products.forEach((product) => {
      categoriesSet.add(extractCategory(product));
      subcategoriesSet.add(extractSubcategory(product));
      brandsSet.add(extractBrand(product));

      const price = extractPrice(product);
      if (price > 0) {
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
      }
    });

    categoryTitlesFromProps.forEach((title) => categoriesSet.add(title));
    subcategoryTitlesFromProps.forEach((title) => subcategoriesSet.add(title));

    if (!Number.isFinite(minPrice)) minPrice = 0;
    if (maxPrice === 0) maxPrice = minPrice || 0;

    const sortAlpha = (set) =>
      Array.from(set)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

    return {
      categories: sortAlpha(categoriesSet),
      subcategories: sortAlpha(subcategoriesSet),
      brands: sortAlpha(brandsSet),
      priceRange: { min: minPrice, max: maxPrice },
    };
  }, [products, categoryTitlesFromProps, subcategoryTitlesFromProps]);

  useEffect(() => {
    setFilters((prev) => ({
      category: prev.category,
      subcategory: prev.subcategory,
      brand: prev.brand,
      price: derivedMeta.priceRange.max || 0,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedMeta.priceRange.max]);

  const filteredAndSortedProducts = useMemo(() => {
    if (!products.length) return [];

    let filtered = products.filter((product) => {
      const category = extractCategory(product);
      const subcategory = extractSubcategory(product);
      const brand = extractBrand(product);
      const price = extractPrice(product);

      if (filters.category !== "All" && category !== filters.category) {
        return false;
      }

      if (
        filters.subcategory !== "All" &&
        subcategory !== filters.subcategory
      ) {
        return false;
      }

      if (filters.brand !== "All" && brand !== filters.brand) {
        return false;
      }

      if (filters.price && price > filters.price) {
        return false;
      }

      return true;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case "price-low":
        sorted.sort((a, b) => extractPrice(a) - extractPrice(b));
        break;
      case "price-high":
        sorted.sort((a, b) => extractPrice(b) - extractPrice(a));
        break;
      case "name":
        sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      default:
        break;
    }

    return sorted;
  }, [products, filters, sortBy]);

  const hasAnyProducts = useMemo(() => products.length > 0, [products]);
  const hasFilteredProducts = useMemo(
    () => filteredAndSortedProducts.length > 0,
    [filteredAndSortedProducts],
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category !== "All") count++;
    if (filters.subcategory !== "All") count++;
    if (filters.brand !== "All") count++;
    if (filters.price > 0 && filters.price < derivedMeta.priceRange.max)
      count++;
    return count;
  }, [filters, derivedMeta.priceRange.max]);

  const clearAllFilters = () => {
    setFilters({
      category: "All",
      subcategory: "All",
      brand: "All",
      price: derivedMeta.priceRange.max || 0,
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === "price" ? value : value,
    }));
  };

  const schemaProducts = useMemo(() => {
    if (Array.isArray(initialProducts) && initialProducts.length > 0) {
      return initialProducts;
    }
    return products;
  }, [initialProducts, products]);

  return (
    <AquaLayout path="shop" productListData={schemaProducts}>
      {loading ? (
        <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
          <div className="animate-bounce">
            <Image
              src={AQ}
              alt="Loading"
              width={80}
              height={80}
              className="rounded-full shadow-lg"
              priority
            />
          </div>
          <p className="mt-4 text-lg font-medium text-blue-900 animate-pulse">
            Fetching the products for you...
          </p>
        </div>
      ) : error ? (
        <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 rounded-3xl border border-rose-100 bg-rose-50/80 p-8 text-center">
          <h2 className="text-xl font-semibold text-rose-700">
            Something went wrong
          </h2>
          <p className="text-sm text-rose-600">{error}</p>
          <button
            type="button"
            onClick={() => fetchProducts()}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="px-3 py-6 sm:px-4 lg:px-6">
          <div className="mx-auto max-w-7xl">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-3xl bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-8 shadow-lg"
            >
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Discover Premium Water Solutions
              </h1>
              <p className="text-slate-600 text-lg">
                Browse our collection of {products.length} professional-grade
                products
              </p>
            </motion.div>

            {/* Filter Bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-md">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowFilters(true)}
                  className="relative inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
                >
                  <FunnelIcon className="h-5 w-5" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {activeFiltersCount > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Clear all
                  </motion.button>
                )}

                <div className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2">
                  <span className="text-sm font-medium text-slate-600">
                    {filteredAndSortedProducts.length}{" "}
                    {filteredAndSortedProducts.length === 1
                      ? "product"
                      : "products"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>

                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded p-2 transition ${
                      viewMode === "grid"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Squares2X2Icon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`rounded p-2 transition ${
                      viewMode === "list"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <ListBulletIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            <AnimatePresence>
              {activeFiltersCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 flex flex-wrap gap-2"
                >
                  {filters.category !== "All" && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                      Category: {filters.category}
                      <button
                        onClick={() => handleFilterChange("category", "All")}
                        className="rounded-full hover:bg-blue-100 p-0.5"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                  {filters.subcategory !== "All" && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                      Subcategory: {filters.subcategory}
                      <button
                        onClick={() => handleFilterChange("subcategory", "All")}
                        className="rounded-full hover:bg-emerald-100 p-0.5"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                  {filters.brand !== "All" && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
                      Brand: {filters.brand}
                      <button
                        onClick={() => handleFilterChange("brand", "All")}
                        className="rounded-full hover:bg-amber-100 p-0.5"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Products Grid */}
            <section>
              {hasAnyProducts && hasFilteredProducts ? (
                <ProductGrid
                  products={filteredAndSortedProducts}
                  viewMode={viewMode}
                />
              ) : hasAnyProducts ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center"
                >
                  <div className="rounded-full bg-slate-100 p-4">
                    <FunnelIcon className="h-12 w-12 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700">
                    No products found
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md">
                    No products match your current filters. Try adjusting your
                    filters or clearing them to see more options.
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="mt-2 rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-400"
                  >
                    Clear all filters
                  </button>
                </motion.div>
              ) : (
                <div className="flex min-h-[40vh] items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  No products available at the moment. Please check back soon.
                </div>
              )}
            </section>

            {/* Filter Sidebar */}
            <Transition appear show={showFilters} as={Fragment}>
              <Dialog
                as="div"
                className="relative z-50"
                onClose={() => setShowFilters(false)}
              >
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                  <div className="flex min-h-full justify-end">
                    <Transition.Child
                      as={Fragment}
                      enter="ease-out duration-300"
                      enterFrom="translate-x-full"
                      enterTo="translate-x-0"
                      leave="ease-in duration-200"
                      leaveFrom="translate-x-0"
                      leaveTo="translate-x-full"
                    >
                      <Dialog.Panel className="w-full max-w-md bg-white shadow-2xl">
                        <div className="flex h-full flex-col">
                          <div className="flex items-center justify-between border-b border-slate-200 p-6">
                            <Dialog.Title className="text-2xl font-bold text-slate-900">
                              Filters
                            </Dialog.Title>
                            <button
                              onClick={() => setShowFilters(false)}
                              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            >
                              <XMarkIcon className="h-6 w-6" />
                            </button>
                          </div>

                          <div className="flex-1 overflow-y-auto p-6">
                            <ShopFiltersPanel
                              filters={filters}
                              onFilterChange={handleFilterChange}
                              categoryOptions={derivedMeta.categories}
                              subcategoryOptions={derivedMeta.subcategories}
                              brandOptions={derivedMeta.brands}
                              priceRange={{
                                min: derivedMeta.priceRange.min,
                                max: derivedMeta.priceRange.max,
                                value: filters.price,
                              }}
                            />
                          </div>

                          <div className="border-t border-slate-200 p-6">
                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  clearAllFilters();
                                }}
                                className="flex-1 rounded-lg border-2 border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                Clear All
                              </button>
                              <button
                                onClick={() => setShowFilters(false)}
                                className="flex-1 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-400"
                              >
                                Show {filteredAndSortedProducts.length} Results
                              </button>
                            </div>
                          </div>
                        </div>
                      </Dialog.Panel>
                    </Transition.Child>
                  </div>
                </div>
              </Dialog>
            </Transition>
          </div>
        </div>
      )}
    </AquaLayout>
  );
};

export default AquaShopPageComponent;
