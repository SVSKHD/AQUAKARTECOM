import AquaAboutComponent from "@/pageComponents/about";
import { getStorefrontStatsServerSide } from "@/services/storefront";

const AquaAbout = ({ storefrontStats }) => (
  <AquaAboutComponent storefrontStats={storefrontStats} />
);

export async function getServerSideProps({ res }) {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=3600",
  );

  return {
    props: {
      storefrontStats: await getStorefrontStatsServerSide(),
    },
  };
}

export default AquaAbout;
