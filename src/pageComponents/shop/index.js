"use client";
import { useState, useEffect, useMemo, Fragment } from "react";
import AquaLayout from "@/components/Layout/Layout";
import ProductServiceOperations from "@/services/products";
import AQ from "@/assests/logo-white.png";
import Image from "next/image";
import ProductGrid from "./productGrid";
import ShopFiltersPanel from "./shopFilter";
import { Dialog, Transition } from "@headlessui/react";

const AquaShopPageComponent = ({ initialProducts = [], initialError = "" }) => {
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(initialError);

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

  const hasProducts = useMemo(() => products.length > 0, [products]);

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
              className="rounded bg-blue-500 px-4 py-2 text-white shadow md:hidden"
            >
              Filters
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <aside className="hidden rounded-2xl bg-white p-4 shadow-sm md:block">
              <h3 className="mb-4 text-lg font-semibold">Filter by</h3>
              <ShopFiltersPanel />
            </aside>

            <section className="col-span-1 md:col-span-3">
              {hasProducts ? (
                <ProductGrid products={products} />
              ) : (
                <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  No products available at the moment. Please check back soon.
                </div>
              )}
            </section>
          </div>

          {/* Mobile Filter Drawer */}
          <Transition appear show={showFilters} as={Fragment}>
            <Dialog
              as="div"
              className="relative z-10 md:hidden"
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
                        <ShopFiltersPanel />
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
