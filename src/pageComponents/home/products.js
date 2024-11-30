import ReusableProductCard from "@/components/cards/ProductCard2";
import ProductServiceOperations from "@/services/products";
import { useEffect, useState } from "react";
import AquaSpinner from "@/components/common/spinner";

const AquaProducts = () => {
  const [products, setProducts] = useState([]);
  const [loadind, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    ProductServiceOperations.ProductbyNumber(4).then((res) => {
      setProducts(res.data.data);
      setTimeout(() => {
        setLoading(false);
      }, 2000); // 2000ms delay
    });
  }, []);

  return (
    <>
      {loadind ? (
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
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-0">
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

            <div className="relative mt-8">
              <div className="relative w-full overflow-x-auto">
                <ul
                  role="list"
                  className="mx-4 inline-flex space-x-8 sm:mx-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-x-8 lg:space-x-0"
                >
                  {products.map((product) => (
                    <li
                      key={product.id}
                      className="inline-flex w-64 flex-col text-center lg:w-auto"
                    >
                      {/* <AquaProductCard product={product} /> */}
                      <ReusableProductCard product={product} />
                    </li>
                  ))}
                </ul>
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
        </section>
      )}
    </>
  );
};
export default AquaProducts;
