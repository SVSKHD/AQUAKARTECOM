import { toast } from "react-hot-toast";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/20/solid";

const AquaToast = ({ message, type }) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <CheckCircleIcon
            className="h-6 w-6 text-green-500"
            aria-hidden="true"
          />
        );
      case "error":
        return (
          <ExclamationCircleIcon
            className="h-6 w-6 text-red-500"
            aria-hidden="true"
          />
        );
      case "info":
        return (
          <InformationCircleIcon
            className="h-6 w-6 text-blue-500"
            aria-hidden="true"
          />
        );
      default:
        return null;
    }
  };

  const getToastClass = () => {
    switch (type) {
      case "success":
        return "bg-green-100 ring-green-500";
      case "error":
        return "bg-red-100 ring-red-500";
      case "info":
        return "bg-blue-100 ring-blue-500";
      default:
        return "bg-white ring-gray-500";
    }
  };

  return toast.custom((t) => (
    <div
      className={`${
        t.visible ? "animate-enter" : "animate-leave"
      } max-w-md w-full ${getToastClass()} shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-opacity-5`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">{getIcon()}</div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Close
        </button>
      </div>
    </div>
  ));
};

export default AquaToast;
