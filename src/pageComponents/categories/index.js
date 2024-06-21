import AquaLayout from "@/components/layouts/layout";
import { useEffect, useState } from "react";
import CategoryServiceOperations from "@/services/categories";
import AquaCategoryCard from "@/components/cards/categoryCard";
import SkeletonCategoryCard from "@/components/cards/skeltons/categorycard";

const AquaCategoriesIndexComponent = () => {
    const seo = {
        title: "categories"
    };
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        CategoryServiceOperations.Allcategories().then((res) => {
            setCategories(res.data.data);
            setTimeout(() => {
                setLoading(false);
            }, 3000); // Keep the loading state for an additional 3 seconds
        });
    }, []);

    return (
        <>
            <AquaLayout seo={seo}>
                <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-8">All Categories</h2>
                    <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-3">
                        {loading
                            ? Array.from({ length: categories.length || 6 }).map((_, index) => (
                                <SkeletonCategoryCard key={index} />
                              ))
                            : categories.map((category) => (
                                <AquaCategoryCard key={category._id} category={category} />
                              ))}
                    </div>
                </div>
            </AquaLayout>
        </>
    );
};

export default AquaCategoriesIndexComponent;
