import AquaCategoryCard from "@/components/cards/categoryCard";
import AquaLayout from "@/components/Layout/Layout";
import CategoryServiceOperations from "@/services/category";
import { useEffect, useState } from "react";

const AquaAllCategoriesComponent = () => {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    CategoryServiceOperations.Allcategories().then((res) => {
      setCategories(res.data.data);
    });
  }, []);
  const products = [
    {
      id: 1,
      name: "Machined Pen",
      color: "Black",
      price: "$35",
      href: "#",
      imageSrc:
        "https://tailwindui.com/img/ecommerce-images/home-page-02-product-01.jpg",
      imageAlt:
        "Black machined steel pen with hexagonal grip and small white logo at top.",
      availableColors: [
        { name: "Black", colorBg: "#111827" },
        { name: "Brass", colorBg: "#FDE68A" },
        { name: "Chrome", colorBg: "#E5E7EB" },
      ],
    },
    // More products...
  ];
  return (
    <>
      <AquaLayout>
      <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
      <div className="min-w-0 flex-1">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Categories
        </h2>
      </div>

        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {categories.map((category) => (
            <div key={category} className="group relative">
              <AquaCategoryCard category={category}/>
            </div>
          ))}
        </div>
      </div>
    </div>
      </AquaLayout>
    </>
  );
};
export default AquaAllCategoriesComponent;
