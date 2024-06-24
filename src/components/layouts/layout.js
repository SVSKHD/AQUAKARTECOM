import AquaAuthDialog from "../commonDialogs/authDialog";
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
      <AquaAuthDialog />
      <div className="p-1">{props.children}</div>
      <AquaFooter />
    </>
  );
};
export default AquaLayout;
