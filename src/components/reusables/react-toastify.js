import { toast } from "sonner";

const AquaToast = ({ message, type }) => {
  const getToastType = () => {
    switch (type) {
      case "success":
        return toast.success(message, { duration: 2000 });
      case "error":
        return toast.error(message, { duration: 2000 });
      case "info":
        return toast.info(message, { duration: 2000 });
      case "warning":
        return toast.warning(message, { duration: 2000 });
      default:
        return toast(message, { duration: 2000 });
    }
  };

  return getToastType();
};

export default AquaToast;
