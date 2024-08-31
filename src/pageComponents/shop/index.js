import { useEffect, useState } from "react";
import AquaLayout from "@/components/Layout/Layout";
import ProductServiceOperations from "@/services/products";
import AquaProductCard from "@/components/cards/productCard";
import { useRouter } from "next/router";
import AquaToast from "@/components/reusables/react-toastify";
import AquaSpinner from "@/components/common/spinner";

const AquaShopComponent = () => {
  const router = useRouter();
  const SeoData = {
    title: "Aquakart | Shop",
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.asPath}`,
    keywords: `Aquakart, Sand-filters , iron-filters, ro-purifiers, geysers,`,
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    ProductServiceOperations.AllProducts()
      .then((res) => {
        setProducts(res.data.data);
        setTimeout(() => {
          setLoading(false);
        }, 2000); // 2000ms delay
      })
      .catch(() => {
        AquaToast({ message: "failed to fetch products", type: "error" });
      });
  }, []);
  return (
    <AquaLayout seo={SeoData}>
      {loading ? (
        <>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <AquaSpinner color="blue" />
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white">
          <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                Products
              </h2>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
              {products.map((product) => (
                <div key={product.id}>
                  <AquaProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AquaLayout>
  );
};
export default AquaShopComponent;
