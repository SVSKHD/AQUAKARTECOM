import AquaLayout from "@/components/layouts/layout";
import CategoryServiceOperations from "@/services/categories";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

const AquaDynamicCategoryIndexComponent = () => {
  const router = useRouter();
  const { id } = router.query;
  const seo = {
    title: "Category",
  };
  const [category, setCategory] = useState({});

  useEffect(() => {
    const fetchCategoryByTitle = () => {
      if (id) {
        CategoryServiceOperations.CategoyByTitle(id)
          .then((res) => {
            setCategory(res.data.data);
          })
          .catch((error) => {
            console.error("Failed to fetch category:", error);
          });
      }
    };
    fetchCategoryByTitle();
  }, [id]); // Adding dependency array to avoid repeated calls

  return (
    <>
      <AquaLayout seo={seo}>
        {id ? JSON.stringify(id) : "Loading..."}
        {/* {JSON.stringify(category)} */}
      </AquaLayout>
    </>
  );
};

export default AquaDynamicCategoryIndexComponent;
