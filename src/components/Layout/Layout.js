import AquaCartDrawer from "../common/commonDrawers/cartDrawer";
import AquafavDrawer from "../common/commonDrawers/favDrawer";
import AquaToastNotification from "../toast/toast";
import AquaFooter from "./Footer";
import AquaHeader from "./Header";

const AquaLayout = (props) => {
  return (
    <>
      <AquaHeader />
      <AquaCartDrawer />
      <AquafavDrawer />
      <AquaToastNotification/>
      <main>{props.children}</main>
      <AquaFooter />
    </>
  );
};
export default AquaLayout;
