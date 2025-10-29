import AquaLayout from "@/components/Layout/Layout";
import AquaProductCard from "@/components/cards/productCard";
import SubCategoryServiceOperations from "@/services/subcategory";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const LoadingState = () => (
  <div className="animate-pulse space-y-12">
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <div className="h-8 w-40 rounded-full bg-slate-200" />
        <div className="mt-6 space-y-3">
          <div className="h-6 w-3/4 rounded-full bg-slate-200" />
          <div className="h-4 w-full rounded-full bg-slate-200" />
          <div className="h-4 w-4/5 rounded-full bg-slate-200" />
        </div>
        <div className="mt-8 h-48 rounded-2xl bg-slate-200" />
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="h-6 w-24 rounded-full bg-slate-200" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="h-40 rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const AquaDynamicSubCategoryComponent = () => {
  const [category, setCategory] = useState({});
  const [related, setRelated] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const { id } = router.query;

  const seo = {
    title: `Aquakart | ${category.title || "Category"}`,
    description: `Aquakart - ${category.description}`,
    image: `${category?.photos?.[0]?.secure_url}`,
    keywords: `${category.keywords}`,
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.asPath} `,
    url: `${process.env.NEXT_PUBLIC_URL}${router.asPath}`,
    photos: `${category?.photos?.[0]?.secure_url}`,
    follow: true,
  };

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      setErrorMessage("");
      SubCategoryServiceOperations.SubCategoryByTitle(id)
        .then((res) => {
          setCategory(res.data.data);
          setRelated(res.data.relatedProducts);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching category:", err);
          setErrorMessage(
            "We couldn’t load this subcategory right now. Please try again in a moment.",
          );
          setIsLoading(false);
        });
    }
  }, [id]);

  return (
    <>
      <AquaLayout subcategoryData={seo} productListData={related}>
        <div className="bg-slate-50 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">
                  Subcategory spotlight
                </p>
                <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                  {category?.title ?? "Subcategory"}
                </h1>
                <p className="max-w-2xl text-sm text-slate-600">
                  {category?.description ||
                    "Dive deeper into our catalogue with curated subcategory picks—perfect for when you know exactly what you’re shopping for."}
                </p>
              </div>
              <Link
                href="/categories"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600"
              >
                Browse categories
              </Link>
            </header>

            {isLoading && <LoadingState />}

            {!isLoading && (
              <div className="mt-12 space-y-12">
                {errorMessage ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-medium text-red-700">
                    {errorMessage}
                  </div>
                ) : (
                  <>
                    <section className="grid gap-8 lg:grid-cols-2">
                      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                        <div className="space-y-4">
                          <h2 className="text-xl font-semibold text-slate-900">
                            About this subcategory
                          </h2>
                          <p className="text-sm leading-relaxed text-slate-600">
                            {category?.description ||
                              "A focused range of products that give you exactly what you need without the noise—curated, reliable, and ready to add to cart."}
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <Link
                              href="/shop"
                              className="inline-flex items-center justify-center rounded-full border border-transparent bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                            >
                              View all products
                            </Link>
                            <Link
                              href="/categories"
                              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-indigo-300 hover:text-indigo-600"
                            >
                              Back to categories
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {category?.photos?.[0]?.secure_url ? (
                            <div className="relative h-48 overflow-hidden rounded-2xl">
                              <img
                                src={category.photos[0].secure_url}
                                alt={category?.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-48 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                              Image not available
                            </div>
                          )}
                          <div className="flex h-48 flex-col justify-between rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
                            <p>
                              Want to track this collection? Save it to your dashboard to revisit quickly next time.
                            </p>
                            <Link
                              href="/dashboard"
                              className="inline-flex items-center justify-start text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                            >
                              Manage saved lists →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900">
                            Popular picks in {category?.title ?? "this subcategory"}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Explore products customers frequently buy from this focused assortment.
                          </p>
                        </div>
                        {related?.length > 0 && (
                          <Link
                            href="/shop"
                            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-indigo-300 hover:text-indigo-600"
                          >
                            Shop more items
                          </Link>
                        )}
                      </div>

                      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {related?.length ? (
                          related.map((product) => (
                            <div
                              key={product?._id || product?.id}
                              className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:ring-indigo-200"
                            >
                              <AquaProductCard product={product} />
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-600">
                            No products available in this subcategory at the moment. Please check back soon.
                          </div>
                        )}
                      </div>
                    </section>
                  </>
                )}
              </div>
            )}

            <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row">
              <span>Want to explore more? Browse all categories and uncover additional collections.</span>
              <Link
                href="/categories"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-indigo-300 hover:text-indigo-600"
              >
                Browse all categories
              </Link>
            </div>
          </div>
        </div>
      </AquaLayout>
    </>
  );
};

export default AquaDynamicSubCategoryComponent;
