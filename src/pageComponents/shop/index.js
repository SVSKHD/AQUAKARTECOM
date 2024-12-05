import { useEffect, useState } from "react";
import AquaLayout from "@/components/Layout/Layout";
import ProductServiceOperations from "@/services/products";
import AquaProductCard from "@/components/cards/productCard";
import { useRouter } from "next/router";
import AquaToast from "@/components/reusables/react-toastify";
import AquaSpinner from "@/components/common/spinner";
import AquaCombobox from "@/components/dropdown/dropdown";
import CategoryServiceOperations from "@/services/category";


const AquaShopComponent = () => {
  const router = useRouter();
  const SeoData = {
    title: "Aquakart | Shop",
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.asPath}`,
    keywords: `Aquakart, Sand-filters, iron-filters, ro-purifiers, geysers`,
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([])


  useEffect(() => { 
    CategoryServiceOperations.Allcategories()
    .then((res) => {
      setCategories(res.data.data)
    })
    .catch(() => {
      AquaToast({ message: "Failed to fetch categories", type: "error" });
    });
  })

  // const categories = [
  //   { id: 1, name: "Category 1" },
  //   { id: 2, name: "Category 2" },
  //   { id: 3, name: "Category 3" },
  // ];

  const handleCategorySelect = (selectedCategory) => {
    console.log("Selected Category:", selectedCategory);
    // Handle category filter logic
  };

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
        AquaToast({ message: "Failed to fetch products", type: "error" });
      });
  }, []);

  return (
    <AquaLayout seo={SeoData}>
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <AquaSpinner color="blue" size="lg" />
        </div>
      ) : (
        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="grid grid-cols-12 gap-x-6">
              {/* Filter Section */}
              <aside className="col-span-12 lg:col-span-3">
                <div className="sticky top-4 space-y-6">
                  <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-2xl sm:tracking-tight">
                    Filters
                  </h2>
                  <AquaCombobox
                    data={categories}
                    label="Category"
                    onSelect={handleCategorySelect}
                  />
                </div>
              </aside>

              {/* Products Section */}
              <section className="col-span-12 lg:col-span-9">
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                    Products
                  </h2>
                </div>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
                  {products.map((product) => (
                    <div key={product.id}>
                      <AquaProductCard product={product} />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </AquaLayout>
  );
};

export default AquaShopComponent;