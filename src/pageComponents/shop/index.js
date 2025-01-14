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
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [clearAll, setClearAll] = useState(false);

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
    <AquaLayout seo={SeoData}>
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <AquaSpinner color="blue" size="lg" />
        </div>
      ) : (
        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="grid grid-cols-12 gap-x-6">
              {/* Sidebar */}
              <aside className="col-span-12 lg:col-span-3">
                <div className="sticky top-4 space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                    Filters
                  </h2>

                  <div className="p-4">
                    <AquaCombobox
                      data={categories}
                      label="Category"
                      onSelect={handleCategorySelect}
                      clear={clearAll} // ✅ Pass clear state to AquaCombobox
                    />
                  </div>

                  {selectedCategory && (
                    <button
                      onClick={handleClearFilter}
                      className="mt-4 bg-gray-200 text-black px-4 py-2 rounded-md hover:bg-gray-300 transition"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </aside>

              {/* Products Section */}
              <section className="col-span-12 lg:col-span-9">
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                    Products
                  </h2>
                </div>

                {productsLoading ? (
                  <div className="flex items-center justify-center h-60">
                    <AquaSpinner color="blue" size="lg" />
                  </div>
                ) : (
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
                    {products.length > 0 ? (
                      products.map((product) => (
                        <div key={product.id}>
                          <AquaProductCard product={product} />
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No products found.</p>
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </AquaLayout>
  );
};

export default AquaShopComponent;
