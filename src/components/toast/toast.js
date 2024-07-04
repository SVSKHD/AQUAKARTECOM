import React from "react";
import { useSelector, useDispatch } from "react-redux";
import AquaAlert from "@/components/toast/toast"; // Adjust the path as needed

const AquaToastNotification = () => {
  const dispatch = useDispatch();
  const { toastNotify } = useSelector((state) => state);

  return (
    <div>
      {toastNotify?.show && (
        <div className="fixed top-0 right-0 mt-4 mr-4">
          <AquaAlert
            type={toastNotify.messageType}
            title={toastNotify.messageType.toUpperCase()}
            message={toastNotify.description}
          />
        </div>
      )}
    </div>
  );
};

export default AquaToastNotification;
