import AquaCartDrawer from "../common/commonDrawers/cartDrawer";
import AquafavDrawer from "../common/commonDrawers/favDrawer";
import AquaToast from "../reusables/toast";
import AquaFooter from "./Footer";
import AquaHeader from "./Header";
import AquaSeo from "./seo/seo";
import AquaUserDataDrawer from "../common/commonDrawers/userDataDrawer";
import AquaUserAuthDialog from "../common/commonDialogs/authDialog";
import AquaCartAddressDialog from "../common/commonDialogs/cartAddress";
import AquaTailwindToast from "../toast/TailwindToast";
import useNetworkStatus from "@/utils/connectivity";
import { useEffect } from "react";

const AquaLayout = (props) => {
  const Status = useNetworkStatus();
  const handleRetry = () => {
    window.location.reload(); // This reloads the page
  };
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
          <AquaTailwindToast/>
          <AquaToast />

          <main className="bg-white min-h-screen">{props.children}</main>

          <AquaFooter />
        </>
      ) : (
        <>
          <AquaHeader />
          <main className="bg-white min-h-screen flex flex-col justify-center items-center">
            <div className="text-center p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                Network Error
              </h1>
              <p className="text-gray-600">
                Please check your internet connection and try again.
              </p>
              <button
                onClick={handleRetry}
                className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700 transition duration-300"
              >
                Retry
              </button>
            </div>
          </main>
          <AquaFooter />
        </>
      )}
    </>
  );
};

export default AquaLayout;
