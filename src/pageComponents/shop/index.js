"use client";
import { useState, useEffect, Fragment } from "react";
import AquaLayout from "@/components/Layout/Layout";
import ProductServiceOperations from "@/services/products";
import AQ from "@/assests/logo-white.png";
import Image from "next/image";
import ProductGrid from "./productGrid";
import ShopFiltersPanel from "./shopFilter";
import { Dialog, Transition } from "@headlessui/react";

const AquaShopPageComponent = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    ProductServiceOperations.AllProducts()
      .then((res) => setProducts(res.data.data))
      .catch(console.log)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AquaLayout>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-blue-300">
          <div className="animate-bounce">
            <Image
              src={AQ}
              alt="Loading..."
              width={80}
              height={80}
              className="rounded-full shadow-lg"
            />
          </div>
          <p className="mt-4 text-lg text-blue-900 font-medium animate-pulse">
            Fetching the products for you...
          </p>
        </div>
      ) : (
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              💧 Dive into the Best Deals on Products
            </h2>
            <button
              onClick={() => setShowFilters(true)}
              className="md:hidden bg-blue-500 text-white px-4 py-2 rounded shadow"
            >
              Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Desktop Filters */}
            <aside className="hidden md:block bg-white p-4">
              <h3 className="text-lg font-semibold mb-4">Filter by</h3>
              <ShopFiltersPanel />
            </aside>

            {/* Products */}
            <section className="col-span-1 md:col-span-3">
              <ProductGrid products={products} />
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
