import ReusableProductCard from "@/components/cards/ProductCardTwo";
import ProductServiceOperations from "@/services/products";
import { useEffect, useMemo, useState } from "react";
import AquaSpinner from "@/components/common/spinner";

const AquaProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");

  useEffect(() => {
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
  }, []);

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
    <>
      {loading ? (
        <>
          <div className="flex items-center justify-center p-20">
            <div className="text-center">
              <AquaSpinner color="blue" size="lg" />
            </div>
          </div>
        </>
      ) : (
        <section aria-labelledby="trending-heading" className="bg-white">
          <div className="py-16 sm:py-24 lg:mx-auto lg:max-w-7xl lg:px-8 lg:py-32">
            <div className="flex flex-col gap-6 px-4 sm:px-6 lg:px-0">
              <div className="flex items-center justify-between">
                <h2
                  id="trending-heading"
                  className="text-2xl font-bold tracking-tight text-gray-900"
                >
                  Trending products
                </h2>
                <a
                  href="/shop"
                  className="hidden text-sm font-semibold text-indigo-600 hover:text-indigo-500 sm:block"
                >
                  Browse All Products
                  <span aria-hidden="true"> &rarr;</span>
                </a>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {categoryFilters.map((filter) => {
                  const isActive = filter === selectedFilter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setSelectedFilter(filter)}
                      className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        isActive
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow"
                          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-600"
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>

              <div className="relative mt-6">
                <div className="relative w-full overflow-x-auto">
                  {visibleProducts.length ? (
                    <ul
                      role="list"
                      className="mx-4 inline-flex space-x-8 sm:mx-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-x-8 lg:space-x-0"
                    >
                      {visibleProducts.map((product) => (
                        <li
                          key={product.id || product._id}
                          className="inline-flex w-64 flex-col text-center lg:w-auto"
                        >
                          <ReusableProductCard product={product} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-500">
                      Nothing to show for this filter just yet. Try another
                      category.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-12 px-4 sm:hidden">
                <a
                  href="/shop"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Browse All Products
                  <span aria-hidden="true"> &rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};
export default AquaProducts;
