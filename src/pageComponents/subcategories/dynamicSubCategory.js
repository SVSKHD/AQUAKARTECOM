import AquaLayout from "@/components/Layout/Layout";
import AquaProductCard from "@/components/cards/ProductCardTwo";
import SubCategoryServiceOperations from "@/services/subcategory";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  SparklesIcon,
  ShoppingCartIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import AquaImage from "@/components/images/AquaImage";

const LoadingState = () => (
  <div className="grid gap-8 lg:grid-cols-2 animate-pulse">
    <div className="rounded-3xl bg-white/40 p-8 shadow-sm border border-white/50 h-96" />
    <div className="rounded-3xl bg-white/40 p-8 shadow-sm border border-white/50 h-96" />
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
    title: `Aquakart | ${category.title || "Subcategory"}`,
    description: `Aquakart - ${category.description || "Browse our specialized collection."}`,
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
            "We couldn’t load this specialist collection right now. Please try again.",
          );
          setIsLoading(false);
        });
    }
  }, [id]);

  return (
    <AquaLayout subcategoryData={seo} productListData={related}>
      {/* Global Background */}
      <div className="fixed inset-0 bg-slate-50 z-[-1]">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-cyan-200/20 blur-[90px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-200/20 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-24 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back to All Categories
          </Link>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : errorMessage ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-12 text-center backdrop-blur-sm">
            <p className="text-rose-600 font-semibold text-lg">
              {errorMessage}
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Hero / Information Section */}
            <section className="grid gap-8 lg:grid-cols-2">
              {/* Text Content */}
              <div className="flex flex-col justify-center rounded-[2rem] border border-white/60 bg-white/60 p-8 shadow-xl backdrop-blur-xl lg:p-12 order-2 lg:order-1">
                <div className="mb-6 inline-flex self-start rounded-full bg-indigo-100/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 border border-indigo-200/50">
                  <FunnelIcon className="mr-1.5 h-3.5 w-3.5 inline-block" />{" "}
                  Sub-Category
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-6">
                  {category?.title}
                </h1>
                <p className="text-lg leading-relaxed text-slate-600 mb-8">
                  {category?.description ||
                    "Curated products refined for your specific requirements."}
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() =>
                      document
                        .getElementById("sub-products-grid")
                        .scrollIntoView({ behavior: "smooth" })
                    }
                    className="rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-transform hover:scale-105 active:scale-95"
                  >
                    Browse Collection
                  </button>
                </div>
              </div>

              {/* Image */}
              <div className="relative min-h-[300px] overflow-hidden rounded-[2rem] border border-white/40 shadow-2xl group order-1 lg:order-2">
                {category?.photos?.[0]?.secure_url ? (
                  <AquaImage
                    src={category.photos[0].secure_url}
                    alt={category.title}
                    customClass="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    width={800}
                    height={600}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-indigo-50/50">
                    <SparklesIcon className="h-16 w-16 text-indigo-200" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent mix-blend-overlay" />
              </div>
            </section>

            {/* Products Grid */}
            <section id="sub-products-grid">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Featured Items
                  </h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {related?.length || 0}
                  </span>
                </div>
              </div>

              {related?.length > 0 ? (
                <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                  {related.map((product) => (
                    <div key={product._id} className="group relative">
                      <AquaProductCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border-2 border-dashed border-slate-300 bg-white/30 p-16 text-center">
                  <ShoppingCartIcon className="mx-auto h-16 w-16 text-slate-300 mb-6" />
                  <h3 className="text-xl font-bold text-slate-900">
                    Collection Empty
                  </h3>
                  <p className="mt-2 text-slate-500 max-w-md mx-auto">
                    We are updating the inventory for this specific collection.
                    Please check back shortly or browse our general catalog.
                  </p>
                  <Link
                    href="/shop"
                    className="mt-8 inline-block rounded-full bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-all hover:scale-105"
                  >
                    Continue Shopping
                  </Link>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </AquaLayout>
  );
};

export default AquaDynamicSubCategoryComponent;
