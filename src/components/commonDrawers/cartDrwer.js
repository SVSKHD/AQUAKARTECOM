import { useSelector } from "react-redux";
import AquaReuseDrawer from "../reusables/drawer";
import useDrawer from "@/utils/drawer";

const AquaCartDrawer = () => {
  const { cartDrawer } = useSelector((state) => ({ ...state }));
  const { closeCartDrawer } = useDrawer();
  return (
    <AquaReuseDrawer
      open={cartDrawer}
      close={() => closeCartDrawer()}
      title="Cart"
    ></AquaReuseDrawer>
  );
};
export default AquaCartDrawer;
