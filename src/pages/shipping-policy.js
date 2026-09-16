import AquaShippingPolicyComponent from "@/pageComponents/shippingpolicy";
import { createManagedSeoStaticProps } from "@/services/seo";

const AquaShippingPolicy = () => {
  return <AquaShippingPolicyComponent />;
};

export const getStaticProps = createManagedSeoStaticProps("shipping-policy");

export default AquaShippingPolicy;
