import AquaLayout from "@/components/layouts/layout";
import AquaReuseDrawer from "@/components/reusables/drawer";
import { useState } from "react";

const AquaCompareIndexComponent = () => {
  const [openDraw, setOpenDraw] = useState(false);
  const seo = {
    title: "compare",
  };
  return (
    <AquaLayout seo={seo}>
      <AquaReuseDrawer open={openDraw} setOpen={() => setOpenDraw(!openDraw)} />
      <h1>Compare</h1>
      <button onClick={() => setOpenDraw(true)}>click</button>
    </AquaLayout>
  );
};
export default AquaCompareIndexComponent;
