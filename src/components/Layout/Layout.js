import AquaCartDrawer from "../common/commonDrawers/cartDrawer";
import AquafavDrawer from "../common/commonDrawers/favDrawer";
import AquaToast from "../reusables/toast";
import AquaFooter from "./Footer";
import AquaHeader from "./Header";
import AquaSeo from "./seo/seo";
import AquaUserDataDrawer from "../common/commonDrawers/userDataDrawer";
import AquaUserAuthDialog from "../common/commonDialogs/authDialog";
import AquaCartAddressDialog from "../common/commonDialogs/cartAddress";
import useNetworkStatus from "@/utils/connectivity";
import { useEffect } from "react";

const AquaLayout = (props) => {
  const Status = useNetworkStatus();
  return (
    <>
      {Status ? (
        <>
          <AquaSeo seo={props.seo} />
          <AquaCartAddressDialog />
          <AquaUserDataDrawer />
          <AquaUserAuthDialog />
          <AquaHeader />
          <AquaCartDrawer />
          <AquafavDrawer />
          <AquaToast />

          <main className="bg-white min-h-screen">{props.children}</main>

          <AquaFooter />
        </>
      ) : (
        <>
          <AquaHeader />
          <main className="bg-white min-h-screen">
            <h1>Network Error</h1>
          </main>
          <AquaFooter />
        </>
      )}
    </>
  );
};
export default AquaLayout;
