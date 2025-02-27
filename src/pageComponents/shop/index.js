import { useEffect, useState } from "react";
import AquaLayout from "@/components/Layout/Layout";
import ProductServiceOperations from "@/services/products";
import AquaProductCard from "@/components/cards/productCard";
import { useRouter } from "next/router";
import AquaToast from "@/components/reusables/react-toastify";
import AquaSpinner from "@/components/common/spinner";
import AquaCombobox from "@/components/dropdown/dropdown";
import CategoryServiceOperations from "@/services/category";
import ReusableProductCard from "@/components/cards/ProductCardTwo";

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
          <div className="bg-white">
            <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
              <h2 className="text-xl font-bold text-gray-900">
                Customers also bought
              </h2>

              <div className="mt-8 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
                {products.map((product) => (
                  <div key={product._id}>
                    <ReusableProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AquaLayout>
  );
};

export default AquaShopComponent;
