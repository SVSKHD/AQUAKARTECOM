import AquaLayout from "@/components/layouts/layout";
import CategoryServiceOperations from "@/services/categories";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

const AquaDynamicCategoryIndexComponent = () => {
  const router = useRouter();
  const { id } = router.query;
  const seo = {
    title: "category",
  };
  const [category, setCategory] = useState({});
  useEffect(() => {
    const fetCategoryByTitle = () => {
      CategoryServiceOperations.CategoyByTitle(id).then((res) => {
        setCategory(res.data.data);
      });
    };
    fetCategoryByTitle();
  });
  return (
    <>
      <AquaLayout seo={seo}>
        {JSON.stringify(id)}
        {/* {JSON.stringify(category)} */}
      </AquaLayout>
    </>
  );
};
export default AquaDynamicCategoryIndexComponent;
