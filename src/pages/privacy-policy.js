import AquaPrivacyPolicyComponent from "@/pageComponents/privacypolicy";
import { createManagedSeoStaticProps } from "@/services/seo";

const AquaPrivacyPolicy = () => {
  return <AquaPrivacyPolicyComponent />;
};

export const getStaticProps = createManagedSeoStaticProps("privacy-policy");

export default AquaPrivacyPolicy;
