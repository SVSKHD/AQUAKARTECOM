import { useSelector } from "react-redux";
import AquaCartDrawer from "../common/commonDrawers/cartDrawer";
import AquafavDrawer from "../common/commonDrawers/favDrawer";
import AquaToast from "../reusables/toast";
import AquaFooter from "./Footer";
import AquaHeader from "./Header";

const AquaLayout = (props) => {
  return (
    <>
      <AquaHeader />
      <AquaCartDrawer />
      <AquafavDrawer />
      <AquaToast/>
      <main>{props.children}</main>
      <AquaFooter />
    </>
  );
};
export default AquaLayout;
