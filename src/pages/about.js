import AquaAboutComponent from "@/pageComponents/about";
import { createManagedSeoStaticProps } from "@/services/seo";

const AquaAbout = () => {
  return (
    <>
      <AquaAboutComponent />
    </>
  );
};

export const getStaticProps = createManagedSeoStaticProps("about");

export default AquaAbout;
