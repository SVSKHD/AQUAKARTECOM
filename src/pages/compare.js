import AquaCompareComponent from "@/pageComponents/compare";
import { createManagedSeoStaticProps } from "@/services/seo";

const AquaCompare = () => {
  return (
    <>
      <AquaCompareComponent />
    </>
  );
};

export const getStaticProps = createManagedSeoStaticProps("compare");

export default AquaCompare;
