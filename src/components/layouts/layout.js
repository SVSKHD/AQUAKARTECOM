import AquaCartDrawer from "../commonDrawers/cartDrwer";
import AquafavDrawer from "../commonDrawers/favDrawer";
import AquaFooter from "./footer";
import AquaSeo from "./head/seo";
import AquaHeader from "./header";

const AquaLayout = (props) => {
  return (
    <>
      <AquaSeo seo={props.seo} />
      <AquaHeader />
      <AquaCartDrawer />
      <AquafavDrawer />
      {props.children}
      <AquaFooter />
    </>
  );
};
export default AquaLayout;
