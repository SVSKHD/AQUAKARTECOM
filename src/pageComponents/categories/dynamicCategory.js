import AquaLayout from "@/components/Layout/Layout";
import AquaProductCard from "@/components/cards/ProductCardTwo";
import CategoryServiceOperations from "@/services/category";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  SparklesIcon,
  ShoppingBagIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import AquaImage from "@/components/images/AquaImage";

const LoadingState = () => (
  <div className="grid gap-8 lg:grid-cols-2 animate-pulse">
    <div className="rounded-3xl bg-white/40 p-8 shadow-sm border border-white/50 h-96" />
    <div className="rounded-3xl bg-white/40 p-8 shadow-sm border border-white/50 h-96" />
  </div>
);

const AquaDynamicCategoryComponent = ({ id }) => {
  const [category, setCategory] = useState({});
  const [related, setRelated] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const seo = {
    title: `Aquakart | ${category.title || "Category"}`,
    description: `Aquakart - ${category.description || "Explore premium quality products tailored for you."}`,
    image: category?.photos?.[0]?.secure_url || undefined,
    url: `${process.env.NEXT_PUBLIC_URL}${router.asPath}`,
    keywords: category.keywords,
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.asPath}`,
    photos: category?.photos?.[0]?.secure_url,
    follow: true,
  };

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      setErrorMessage("");
      CategoryServiceOperations.CategoyByTitle(id)
        .then((res) => {
          setCategory(res.data.data);
          setRelated(res.data.relatedProducts);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching category:", err);
          setErrorMessage(
            "We couldn’t load this category right now. Please try again.",
          );
          setIsLoading(false);
        });
    }
  }, [id]);

  return (
    <AquaLayout categoryData={seo} productListData={related}>
      {/* Global Background */}
      <div className="fixed inset-0 bg-slate-50 z-[-1]">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-300/20 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-300/20 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-24 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back to Categories
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
            {/* Hero / About Section */}
            <section className="grid gap-8 lg:grid-cols-2">
              {/* Left: Text Content */}
              <div className="flex flex-col justify-center rounded-[2rem] border border-white/60 bg-white/60 p-8 shadow-xl backdrop-blur-xl lg:p-12">
                <div className="mb-6 inline-flex self-start rounded-full bg-emerald-100/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200/50">
                  <SparklesIcon className="mr-1.5 h-3.5 w-3.5 inline-block" />{" "}
                  Collection
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-6">
                  {category?.title}
                </h1>
                <p className="text-lg leading-relaxed text-slate-600 mb-8">
                  {category?.description ||
                    "Explore our premium selection specifically curated for your needs."}
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() =>
                      document
                        .getElementById("products-grid")
                        .scrollIntoView({ behavior: "smooth" })
                    }
                    className="rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-transform hover:scale-105 active:scale-95"
                  >
                    Browse Products
                  </button>
                  <Link
                    href="/contact"
                    className="rounded-full border border-slate-300 bg-transparent px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    Contact Expert
                  </Link>
                </div>
              </div>

              {/* Right: Hero Image */}
              <div className="relative min-h-[300px] overflow-hidden rounded-[2rem] border border-white/40 shadow-2xl group">
                {category?.photos?.[0]?.secure_url ? (
                  <AquaImage
                    src={category.photos[0].secure_url}
                    alt={category.title}
                    customClass="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    width={800} // Add explicit width
                    height={600} // Add explicit height
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100">
                    <span className="text-slate-400 font-medium">
                      No cover image available
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </section>

            {/* Products Grid */}
            <section id="products-grid">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Curated Selections
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Found {related?.length || 0} products matching this category
                  </p>
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
                <div className="rounded-[2rem] border-2 border-dashed border-slate-300 bg-white/30 p-12 text-center">
                  <ShoppingBagIcon className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900">
                    No products found
                  </h3>
                  <p className="mt-1 text-slate-500">
                    We are currently restocking this collection. Please check
                    back later.
                  </p>
                  <Link
                    href="/shop"
                    className="mt-6 inline-block rounded-full bg-emerald-600 px-6 py-2 text-sm font-bold text-white shadow-md hover:bg-emerald-500"
                  >
                    View All Products
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

export default AquaDynamicCategoryComponent;
