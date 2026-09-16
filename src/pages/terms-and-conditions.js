import AquaTermsAndConditionsComponent from "@/pageComponents/termsAndConditons";
import { createManagedSeoStaticProps } from "@/services/seo";

const AquaTermsAndConditons = () => {
  return <AquaTermsAndConditionsComponent />;
};

export const getStaticProps = createManagedSeoStaticProps(
  "terms-and-conditions",
);

export default AquaTermsAndConditons;
