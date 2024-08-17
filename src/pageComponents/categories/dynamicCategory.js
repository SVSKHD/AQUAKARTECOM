import AquaLayout from "@/components/Layout/Layout";
import AquaProductCard from "@/components/cards/productCard";
import CategoryServiceOperations from "@/services/category";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const AquaDynamicCategoryComponent = () => {
  const [category, setCategory] = useState({});
  const [related, setRelated] = useState([]);
  const router = useRouter();

  const { id } = router.query;

  const seo = {
    title: `Aquakart | ${category.title || "Category"}`,
    description: `Aquakart - ${category.description}`,
    image: `${category?.photos?.[0]?.secure_url}`,
    keywords: `${category.keywords}`,
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.asPath} `,
  };

  useEffect(() => {
    if (id) {
      CategoryServiceOperations.CategoryById(id)
        .then((res) => {
          setCategory(res.data.data);
          setRelated(res.data.relatedProducts);
          console.log(res);
        })
        .catch((err) => {
          console.error("Error fetching category:", err);
        });
    }
  }, [id]);

  return (
    <>
      <AquaLayout seo={seo}>
        <div className="bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="sm:flex sm:items-baseline sm:justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Shop by Category
              </h2>
              <a
                href="/categories"
                className="hidden text-sm font-semibold text-indigo-600 hover:text-indigo-500 sm:block"
              >
                Browse all categories
                <span aria-hidden="true"> &rarr;</span>
              </a>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6 lg:gap-8">
              {/* Category Image */}
              {category?.photos?.[0]?.secure_url && (
                <div className="group aspect-h-1 aspect-w-2 overflow-hidden rounded-lg sm:aspect-h-1 sm:aspect-w-1 sm:col-span-1 sm:row-span-2">
                  <img
                    alt={category?.title}
                    src={category.photos[0].secure_url}
                    className="object-cover object-center group-hover:opacity-75"
                  />
                  <div
                    aria-hidden="true"
                    className="bg-gradient-to-b from-transparent to-black opacity-50"
                  />
                  <div className="flex items-end p-6">
                    <div>
                      <h3 className="font-semibold text-white">
                        <a href="#">
                          <span className="absolute inset-0" />
                          {category?.title}
                        </a>
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              {/* Related Products */}
              <div className="sm:col-span-2">
                <h1 className="text-xl font-bold tracking-tight text-gray-900 mb-4">
                  Related Products
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {related.map((r, i) => (
                    <>
                      <div key={i}>
                        <AquaProductCard product={r} />
                      </div>

                      {/* <div
          key={i}
          className="group aspect-h-1 aspect-w-2 overflow-hidden rounded-lg sm:aspect-none sm:relative sm:h-full"
        >
          <img
            alt={r.title}
            src={
              r?.photos?.[0]?.secure_url ||
              "https://via.placeholder.com/300"
            }
            className="object-cover object-center group-hover:opacity-75 sm:absolute sm:inset-0 sm:h-full sm:w-full"
          />
          <div
            aria-hidden="true"
            className="bg-gradient-to-b from-transparent to-black opacity-50 sm:absolute sm:inset-0"
          />
          <div className="flex items-end p-6 sm:absolute sm:inset-0">
            <div>
              <h3 className="font-semibold text-white">
                <a href={`/product/${r._id}`}>
                  <span className="absolute inset-0" />
                  {r.title}
                </a>
              </h3>
              <p aria-hidden="true" className="mt-1 text-sm text-white">
                Shop now
              </p>
            </div>
          </div>
        </div> */}
                    </>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 sm:hidden">
              <a
                href="#"
                className="block text-sm font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Browse all categories
                <span aria-hidden="true"> &rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </AquaLayout>
    </>
  );
};

export default AquaDynamicCategoryComponent;
