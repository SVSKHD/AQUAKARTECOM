"use client";
import { useState, useEffect, useMemo, Fragment } from "react";
import AquaLayout from "@/components/Layout/Layout";
import ProductServiceOperations from "@/services/products";
import AQ from "@/assests/logo-white.png";
import Image from "next/image";
import ProductGrid from "./productGrid";
import ShopFiltersPanel from "./shopFilter";
import { Dialog, Transition } from "@headlessui/react";

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
    () =>
      (initialCategories || [])
        .map((item) => item?.title)
        .filter(Boolean),
    [initialCategories],
  );

  const subcategoryTitlesFromProps = useMemo(
    () =>
      (initialSubcategories || [])
        .map((item) => item?.title)
        .filter(Boolean),
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

    const sortAlpha = (set) => Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));

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

  const filteredProducts = useMemo(() => {
    if (!products.length) return [];
    return products.filter((product) => {
      const category = extractCategory(product);
      const subcategory = extractSubcategory(product);
      const brand = extractBrand(product);
      const price = extractPrice(product);

      if (filters.category !== "All" && category !== filters.category) {
        return false;
      }

      if (filters.subcategory !== "All" && subcategory !== filters.subcategory) {
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
  }, [products, filters]);

  const hasAnyProducts = useMemo(() => products.length > 0, [products]);
  const hasFilteredProducts = useMemo(
    () => filteredProducts.length > 0,
    [filteredProducts],
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === "price" ? value : value,
    }));
  };

  return (
    <AquaLayout path="shop">
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
          <h2 className="text-xl font-semibold text-rose-700">Something went wrong</h2>
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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900">
              💧 Dive into the Best Deals on Products
            </h2>
            <button
              onClick={() => setShowFilters(true)}
              className="rounded bg-blue-500 px-4 py-2 text-white shadow transition hover:bg-blue-600"
            >
              Filters
            </button>
          </div>

          <section className="grid grid-cols-1">
            <section>
              {hasAnyProducts && hasFilteredProducts ? (
                <ProductGrid products={filteredProducts} />
              ) : hasAnyProducts ? (
                <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  No products match your filters. Adjust the filters to explore more options.
                </div>
              ) : (
                <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  No products available at the moment. Please check back soon.
                </div>
              )}
            </section>
          </section>

          {/* Mobile Filter Drawer */}
          <Transition appear show={showFilters} as={Fragment}>
            <Dialog
              as="div"
              className="relative z-10"
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
                <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                    <Dialog.Panel className="w-3/4 max-w-sm bg-white p-6 shadow-xl">
                      <Dialog.Title className="text-lg font-bold">
                        Filters
                      </Dialog.Title>
                      <div className="mt-4">
                        <ShopFiltersPanel
                          filters={filters}
                          onFilterChange={(key, value) => {
                            handleFilterChange(key, value);
                          }}
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
                      <div className="mt-6">
                        <button
                          onClick={() => setShowFilters(false)}
                          className="w-full bg-blue-500 text-white px-4 py-2 rounded"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        </div>
      )}
    </AquaLayout>
  );
};

export default AquaShopPageComponent;
