import AquaLayout from "@/components/layouts/layout";
import AquaReuseDrawer from "@/components/reusables/drawer";
import { useState } from "react";

const AquaCompareIndexComponent = () => {
  const seo = {
    title: "compare",
  };
  return (
    <AquaLayout seo={seo}>
      <h1>Compare</h1>
    </AquaLayout>
  );
};
export default AquaCompareIndexComponent;
