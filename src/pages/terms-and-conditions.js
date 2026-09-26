import AquaTermsAndConditionsComponent from "@/pageComponents/termsAndConditons";

const AquaTermsAndConditons = () => {
  return <AquaTermsAndConditionsComponent />;
};

export const getStaticProps = createManagedSeoStaticProps(
  "terms-and-conditions",
);

export default AquaTermsAndConditons;
