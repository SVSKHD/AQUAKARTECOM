import { useState } from "react";
import AquaResponsiveDialog from "../reusables/dialog";
import { useSelector } from "react-redux";
import useDialog from "@/utils/dialog";

const AquaAuthDialog = () => {
  const { authDialog } = useSelector((state) => ({ ...state }));
  const {openAuthDialog , closeAuthDialog} = useDialog()    

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
        <p className="text-sm text-gray-500">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur
          amet labore.
        </p>
      </AquaResponsiveDialog>
    </div>
  );
};
export default AquaAuthDialog;
