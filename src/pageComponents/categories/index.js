import AquaCategoryCard from "@/components/cards/categoryCard";
import AquaLayout from "@/components/Layout/Layout";
import CategoryServiceOperations from "@/services/category";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

const CategoriesSkeleton = () => (
  <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: 8 }).map((_, index) => (
      <div
        key={`skeleton-${index}`}
        className="animate-pulse rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-indigo-100"
      >
        <div className="mb-4 h-40 w-full rounded-2xl bg-indigo-100/60" />
        <div className="h-4 w-3/4 rounded-full bg-indigo-100/80" />
        <div className="mt-3 h-3 w-1/2 rounded-full bg-indigo-100/60" />
      </div>
    ))}
  </div>
);

const AquaAllCategoriesComponent = () => {
  const router = useRouter();
  const seo = {
    title: "Aquakart | shop by categories",
    desscription:
      "Aquakart offers a wide range of water solutions including purifiers, dispensers, softeners, storage tanks, pumps, and plumbing accessories. Ensure safe, efficient, and stylish water management for your home or business with our high-quality products. Shop now!",
    keywords:
      "Aquakart,Water Purifiers,Water Dispensers,Water Softeners ,Water Storage Tanks,Water Pumps,Plumbing Accessories,Bath Fittings,Irrigation Solutions,Home Appliances,Water Filtration,Clean Drinking Water,Water Management, Water Treatment,Water Solutions, Safe Drinking Water",
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.asPath}`,
  };
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const res = await CategoryServiceOperations.Allcategories();
        if (!isMounted) return;
        setCategories(res?.data?.data ?? []);
      } catch (error) {
        console.error("Failed to fetch categories", error);
        if (isMounted) {
          setErrorMessage("We couldn’t load the categories right now. Please retry in a moment.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const categoryCount = useMemo(() => categories?.length ?? 0, [categories]);

  return (
    <>
      <AquaLayout seo={seo}>
        <div className="bg-slate-50 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">
                  Browse by category
                </p>
                <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                  Explore our catalogue
                </h1>
                <p className="max-w-2xl text-sm text-slate-600">
                  Discover curated assortments across water solutions, appliances, and daily essentials. Each category is reviewed to ensure it meets Aquakart standards.
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 text-sm font-semibold text-slate-600 sm:items-end">
                <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs uppercase tracking-wide text-slate-700">
                  {isLoading ? "Loading…" : `${categoryCount} categories`}
                </span>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-indigo-300 hover:text-indigo-600"
                >
                  Explore products
                </Link>
              </div>
            </header>

            <div className="mt-12">
              {isLoading && <CategoriesSkeleton />}

              {!isLoading && errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-700">
                  {errorMessage}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoading(true);
                      setErrorMessage("");
                      CategoryServiceOperations.Allcategories()
                        .then((res) => {
                          setCategories(res?.data?.data ?? []);
                        })
                        .catch((error) => {
                          console.error("Retry fetch categories error", error);
                          setErrorMessage("Still having trouble fetching categories. Please try again later.");
                        })
                        .finally(() => {
                          setIsLoading(false);
                        });
                    }}
                    className="ml-3 inline-flex items-center justify-center rounded-full border border-transparent bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!isLoading && !errorMessage && (
                <>
                  <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                      <h2 className="text-lg font-semibold text-slate-900">Looking for inspiration?</h2>
                      <p className="mt-2 text-sm text-slate-600">
                        Browse popular picks from across the store and see what other customers are exploring right now.
                      </p>
                      <Link
                        href="/shop"
                        className="mt-6 inline-flex items-center justify-center rounded-full border border-transparent bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                      >
                        View top products
                      </Link>
                    </div>
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                      <h2 className="text-lg font-semibold text-slate-900">Stay organised</h2>
                      <p className="mt-2 text-sm text-slate-600">
                        Save categories you revisit often and get notified when new items land in your favourites.
                      </p>
                      <Link
                        href="/auth"
                        className="mt-6 inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-indigo-300 hover:text-indigo-600"
                      >
                        Sign in to save
                      </Link>
                    </div>
                    <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
                      <h2 className="text-lg font-semibold">Aquakart Pro benefits</h2>
                      <p className="mt-2 text-sm text-white/80">
                        Unlock faster delivery windows, bundle offers, and seasonal deals across every category.
                      </p>
                      <Link
                        href="/membership"
                        className="mt-6 inline-flex items-center justify-center rounded-full border border-transparent bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                      >
                        See membership plans
                      </Link>
                    </div>
                  </section>

                  <section className="mt-12 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">All categories</h2>
                        <p className="text-sm text-slate-600">
                          Navigate through the full catalogue and jump straight into the collection that fits your next purchase.
                        </p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Updated regularly
                      </span>
                    </div>

                    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {categoryCount ? (
                        categories.map((category) => (
                          <div
                            key={category?._id || category?.title}
                            className="transition hover:-translate-y-1 hover:shadow-lg"
                          >
                            <AquaCategoryCard category={category} />
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-sm font-medium text-slate-600">
                          We are adding categories right now. Check back soon for a refreshed catalogue.
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      </AquaLayout>
    </>
  );
};
export default AquaAllCategoriesComponent;
