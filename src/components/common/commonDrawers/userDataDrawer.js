import { useSelector, useDispatch } from "react-redux";
import AquaReuseDrawer from "../../reusables/drawer";

const AquaUserDataDrawer = () => {
  const dispatch = useDispatch();
  const { userDataDrawer } = useSelector((state) => ({ ...state }));
  return (
    <AquaReuseDrawer
      open={userDataDrawer}
      close={() =>
        dispatch({
          type: "SET_USER_DATA_DRAWER",
          payload: false,
        })
      }
      title="User"
    ></AquaReuseDrawer>
  );
};
export default AquaUserDataDrawer;
