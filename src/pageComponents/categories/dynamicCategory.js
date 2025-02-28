import AquaLayout from "@/components/Layout/Layout";
import AquaProductCard from "@/components/cards/ProductCardTwo";
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
    url: `${process.env.NEXT_PUBLIC_URL}${router.asPath}`,
    keywords: `${category.keywords}`,
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.asPath} `,
    photos: `${category?.photos?.[0]?.secure_url}`,
    follow: true,
  };

  useEffect(() => {
    if (id) {
      CategoryServiceOperations.CategoyByTitle(id)
        .then((res) => {
          setCategory(res.data.data);
          setRelated(res.data.relatedProducts);
        })
        .catch((err) => {
          console.error("Error fetching category:", err);
        });
    }
  }, [id]);

  return (
    <>
      <AquaLayout categoryData={seo}>
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

            {category?.photos?.[0]?.secure_url && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 p-4">
                {/* Image Section */}
                <div className="p-2 flex justify-center">
                  <div className="w-4/5 max-w-sm sm:max-w-md md:max-w-lg flex justify-center items-center bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      alt={category?.title}
                      src={category.photos[0].secure_url}
                      className="w-full h-auto object-cover rounded-lg"
                    />
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-2 flex flex-col justify-center space-y-4 text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {category?.title}
                  </h3>
                  <p className="text-gray-700">
                    {category?.description ||
                      "Explore our exclusive category to discover premium products."}
                  </p>
                  <div>
                    <a
                      href="/categories"
                      className="px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 inline-block"
                    >
                      Browse Categories →
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6 lg:gap-8">
              {/* Category Image */}

              {/* Related Products */}
              <div className="sm:col-span-2">
                <h1 className="text-xl font-bold tracking-tight text-gray-900 mb-4">
                  Related Products
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  {related.map((r, i) => (
                    <>
                      <div key={i}>
                        <AquaProductCard product={r} />
                      </div>
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
