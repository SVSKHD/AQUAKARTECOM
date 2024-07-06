import {useState} from "react"
import AquaResponsiveDialog from "@/components/reusables/dialog";
import { useSelector, useDispatch } from "react-redux";
import AquaAuthForm from "./commonAuth/authFrom";
import AquaAuthMobileForm from "./commonAuth/mobileOtp";

const AquaUserAuthDialog = () => {
  const [mobile, setMobile] = useState(false)
  const dispatch = useDispatch();
  const { authDialog,  userSignupStatus } = useSelector((state) => ({ ...state }));
  return (
    <>
      <AquaResponsiveDialog
        open={authDialog}
        close={() =>
          dispatch({
            type: "SET_AUTH_DIALOG_VISIBLE",
            payload: false,
          })
        }
      >

{mobile ? <AquaAuthMobileForm signup={userSignupStatus}/> :<AquaAuthForm signup={userSignupStatus}/> }
       
            <p className="mt-10 text-center text-sm text-gray-500">
  Not a member?{' '}
  <span href="#" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
    Signup Now
  </span>
  <span className="mx-2">or</span>
  <span onClick={()=>setMobile(!mobile)} href="#" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
    {mobile ? "Signup with Email" : "Signup With Phone"}
  </span>
</p>

         
      </AquaResponsiveDialog>
    </>
  );
};
export default AquaUserAuthDialog;
