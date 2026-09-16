import AquaContactComponent from "@/pageComponents/contactus";
import { createManagedSeoStaticProps } from "@/services/seo";

const AquaContact = () => {
  return (
    <>
      <AquaContactComponent />
    </>
  );
};

export const getStaticProps = createManagedSeoStaticProps("contact-us");

export default AquaContact;
