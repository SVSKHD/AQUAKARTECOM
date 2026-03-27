import ReusableProductCard from "@/components/cards/ProductCardTwo";
import ProductServiceOperations from "@/services/products";
import { useEffect, useMemo, useState } from "react";
import AquaSpinner from "@/components/common/spinner";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const AquaProducts = ({ initialProducts = [] }) => {
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");

  // Fallback fetch if no initial products (e.g., client navigation fallback)
  useEffect(() => {
    if (initialProducts.length === 0) {
      let isMounted = true;
      const fetchProducts = async () => {
        setLoading(true);
        try {
          const response = await ProductServiceOperations.AllProducts();
          if (isMounted) {
            setProducts(response.data?.data || []);
          }
        } catch (error) {
          console.error("Failed to load products", error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      fetchProducts();

      return () => {
        isMounted = false;
      };
    } else {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  useEffect(() => {
    setSelectedFilter("All");
  }, [products.length]);

  const getProductCategory = (item = {}) => {
    const rawLabel =
      item?.category?.title ||
      item?.category?.name ||
      item?.category ||
      item?.productCategory ||
      item?.productType ||
      item?.subcategory?.title ||
      item?.SubCategory ||
      "";

    const sanitizedLabel = typeof rawLabel === "string" ? rawLabel.trim() : "";
    const looksLikeId = /^[0-9a-fA-F]{16,}$/.test(sanitizedLabel);

    if (!sanitizedLabel || looksLikeId) {
      return item?.title || item?.name || "Featured";
    }

    return sanitizedLabel;
  };

  const categoryFilters = useMemo(() => {
    const set = new Set();
    products.forEach((item) => {
      const label = getProductCategory(item);
      if (label) {
        set.add(label);
      }
    });
    return ["All", ...Array.from(set).slice(0, 8)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedFilter === "All") return products;
    return products.filter((item) => {
      const label = getProductCategory(item);
      return label.toLowerCase() === selectedFilter.toLowerCase();
    });
  }, [products, selectedFilter]);

  const visibleProducts = filteredProducts.slice(0, 4);

  return (
    <section
      aria-labelledby="trending-heading"
      className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Glass Header for Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h2
            id="trending-heading"
            className="text-2xl font-bold tracking-tight text-slate-900"
          >
            Trending <span className="text-emerald-600">Essentials</span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Curated top-picks for your home water systems.
          </p>
        </div>

        {/* Glass Filters */}
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {categoryFilters.map((filter) => {
            const isActive = filter === selectedFilter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilter(filter)}
                className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold uppercase tracking-wide rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                    : "glass-subtle border border-white/50 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-white/50"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative min-h-[300px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center glass rounded-3xl z-10">
            <AquaSpinner color="emerald" size="lg" />
          </div>
        ) : (
          <div className="flex snap-x snap-mandatory overflow-x-auto gap-4 pb-4 p-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-y-10 sm:gap-x-6 xl:gap-x-8 no-scrollbar">
            {visibleProducts.length ? (
              visibleProducts.map((product) => (
                <div
                  key={product._id}
                  className="group relative min-w-[280px] snap-center sm:min-w-0 sm:snap-align-none"
                >
                  <ReusableProductCard product={product} />
                </div>
              ))
            ) : (
              <div className="col-span-full flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-500">
                No products found for this filter.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/shop"
          className="group glass-card flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-slate-700 transition-all hover:border-emerald-300 hover:text-emerald-700 hover:shadow-emerald-100"
        >
          Browse Full Catalog{" "}
          <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
};

export default AquaProducts;
