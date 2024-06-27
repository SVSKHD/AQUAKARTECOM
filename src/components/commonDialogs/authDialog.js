import { useState } from "react";
import AquaResponsiveDialog from "../reusables/dialog";
import useDialog from "@/utils/dialog";
import AquaSignin from "../auth/signin";
import AquaSignup from "../auth/signup";
import AquaSignupWithPhone from "../auth/signupwithphone";
import { useDispatch , useSelector} from "react-redux";


const AquaAuthDialog = () => {
  const { authDialog } = useSelector((state) => ({ ...state }));
  const {openAuthDialog , closeAuthDialog} = useDialog()    
  const {} = useSelector((state)=>({...state}))
  const dispatch = useDispatch()

  const handleConfirm = () => {
    console.log("Confirmed");
  };

  return (
    <div className="p-4">
      <AquaResponsiveDialog
        open={authDialog}
        close={()=>closeAuthDialog()}
        title="Auth"
        onConfirm={handleConfirm}
      >
        
      </AquaResponsiveDialog>
    </div>
  );
};
export default AquaAuthDialog;




