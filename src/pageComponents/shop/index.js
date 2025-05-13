import { useEffect, useState } from "react";
import AquaLayout from "@/components/Layout/Layout";
import ProductServiceOperations from "@/services/products";
import { useRouter } from "next/router";
import AquaToast from "@/components/reusables/react-toastify";
import CategoryServiceOperations from "@/services/category";
import ReusableProductCard from "@/components/cards/ProductCardTwo";
import { Dialog } from "@headlessui/react";
import { XIcon } from "@heroicons/react/outline";
import AQ from "@/assests/logo-white.png";
import Image from "next/image";

const AquaShopComponent = () => {
  const router = useRouter();
  const SeoData = {
    title: "Aquakart | Shop",
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.asPath}`,
    keywords: `Aquakart, Sand-filters, iron-filters, ro-purifiers, geysers softeners aquakart`,
    keyphrases: `Aquakart, Sand-filters, iron-filters, ro-purifiers, geysers softeners aquakart`,
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [clearAll, setClearAll] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Fetch Categories (Runs Once)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await CategoryServiceOperations.Allcategories();
        setCategories(res.data.data);
      } catch (error) {
        AquaToast({ message: "Failed to fetch categories", type: "error" });
      }
    };
    fetchCategories();
  }, []);

  // Fetch All Products (Runs Once)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await ProductServiceOperations.AllProducts();
        setProducts(res.data.data);
        setClearAll(false);
      } catch (error) {
        AquaToast({ message: "Failed to fetch products", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Handle Category Selection
  const handleCategorySelect = async (selectedCategory) => {
    setSelectedCategory(selectedCategory);
    setProductsLoading(true);

    try {
      const res = await CategoryServiceOperations.CategoyByTitle(
        selectedCategory.title,
      );
      setProducts(res.data?.relatedProducts || []);
    } catch (error) {
      console.error("Error fetching category:", error);
    } finally {
      setTimeout(() => setProductsLoading(false), 1000); // Optional UX delay
    }
  };

  // Clear Category Filter
  const handleClearFilter = () => {
    setSelectedCategory(null);
    setProductsLoading(true);
    setClearAll(true); // ✅ Set clearAll to true before fetching products

    ProductServiceOperations.AllProducts()
      .then((res) => {
        setProducts(res.data.data);
      })
      .catch(() => {
        AquaToast({ message: "Failed to fetch products", type: "error" });
      })
      .finally(() => {
        setTimeout(() => {
          setProductsLoading(false);
          setClearAll(false); // ✅ Reset clearAll to false AFTER clearing
        }, 1000);
      });
  };

  return (
    <>
      <Dialog open={mobileFiltersOpen} onClose={setMobileFiltersOpen} className="fixed inset-0 z-40 flex lg:hidden">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <div className="relative bg-white w-3/4 max-w-xs h-full shadow-xl overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button onClick={() => setMobileFiltersOpen(false)}>
              <XIcon className="h-6 w-6 text-gray-700" />
            </button>
          </div>
          {/* Filters content (same as the aside) */}
          <aside className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
              <ul className="mt-4 space-y-2">
                {categories.map((cat) => (
                  <li
                    key={cat._id}
                    onClick={() => {
                      handleCategorySelect(cat);
                      setMobileFiltersOpen(false);
                    }}
                    className={`cursor-pointer px-3 py-2 rounded-md border ${
                      selectedCategory?._id === cat._id ? "bg-blue-100 border-blue-500" : "border-gray-300"
                    }`}
                  >
                    {cat.title}
                  </li>
                ))}
                <li
                  onClick={() => {
                    handleClearFilter();
                    setMobileFiltersOpen(false);
                  }}
                  className="cursor-pointer text-sm text-red-600 mt-2 underline"
                >
                  Clear Filter
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Price Range</h3>
              <div className="flex flex-col space-y-2 mt-4">
                <input type="range" min={0} max={10000} className="w-full" />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>₹0</span>
                  <span>₹10,000+</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </Dialog>

      <AquaLayout seo={SeoData}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-blue-300">
            <div className="animate-bounce">
              <Image src={AQ} alt="Loading..." width={80} height={80} className="rounded-full shadow-lg" />
            </div>
            <p className="mt-4 text-lg text-blue-900 font-medium animate-pulse">
              Loading amazing products just for you...
            </p>
          </div>
        ) : (
          <div className="bg-white">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
              <div className="lg:flex lg:space-x-8">
                {/* Left Filter Panel */}
                <aside className="w-full lg:w-1/4 space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
                    <ul className="mt-4 space-y-2">
                      {categories.map((cat) => (
                        <li
                          key={cat._id}
                          onClick={() => handleCategorySelect(cat)}
                          className={`cursor-pointer px-3 py-2 rounded-md border ${
                            selectedCategory?._id === cat._id ? "bg-blue-100 border-blue-500" : "border-gray-300"
                          }`}
                        >
                          {cat.title}
                        </li>
                      ))}
                      <li
                        onClick={handleClearFilter}
                        className="cursor-pointer text-sm text-red-600 mt-2 underline"
                      >
                        Clear Filter
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Price Range</h3>
                    <div className="flex flex-col space-y-2 mt-4">
                      <input type="range" min={0} max={10000} className="w-full" />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>₹0</span>
                        <span>₹10,000+</span>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Right Product Grid */}
                <div className="w-full lg:w-3/4">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Customers also bought
                  </h2>
                  <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-3 xl:gap-x-8">
                    {products.map((product) => (
                      <div key={product._id}>
                        <ReusableProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AquaLayout>
    </>
  );
};

export default AquaShopComponent;
