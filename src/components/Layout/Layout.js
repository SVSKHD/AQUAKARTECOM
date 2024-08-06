import { useSelector } from "react-redux";
import AquaCartDrawer from "../common/commonDrawers/cartDrawer";
import AquafavDrawer from "../common/commonDrawers/favDrawer";
import AquaToast from "../reusables/toast";
import AquaFooter from "./Footer";
import AquaHeader from "./Header";
import AquaSeo from "./seo/seo";
import AquaUserDataDrawer from "../common/commonDrawers/userDataDrawer";
import AquaUserAuthDialog from "../common/commonDialogs/authDialog";
import AquaCartAddressDialog from "../common/commonDialogs/cartAddress";

const AquaLayout = (props) => {
  return (
    <>
      <AquaSeo seo={props.seo} />
      <AquaCartAddressDialog />
      <AquaUserDataDrawer />
      <AquaUserAuthDialog />
      <AquaHeader />
      <AquaCartDrawer />
      <AquafavDrawer />
      <AquaToast />
      <main className="bg-white">{props.children}</main>
      <AquaFooter />
    </>
  );
};
export default AquaLayout;
