import { useSelector } from "react-redux";
import AquaReuseDrawer from "../reusables/drawer";
import useDrawer from "@/utils/drawer";

const AquafavDrawer = () => {
  const { openFavDrawer, closeFavDrawer } = useDrawer();
  const { favDrawer } = useSelector((state) => ({ ...state }));
  return (
    <AquaReuseDrawer
      open={favDrawer}
      close={() => closeFavDrawer()}
      title="Favourites"
    ></AquaReuseDrawer>
  );
};
export default AquafavDrawer;
