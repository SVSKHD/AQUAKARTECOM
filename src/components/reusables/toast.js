import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Transition } from "@headlessui/react";
import { useSelector, useDispatch } from "react-redux";

const AquaToast = () => {
  const dispatch = useDispatch();
  const { toastNotify } = useSelector((state) => ({ ...state }));

  const getIconAndColor = (type) => {
    switch (type) {
      case "success":
        return {
          icon: (
            <CheckCircleIcon
              className="h-6 w-6 text-green-400"
              aria-hidden="true"
            />
          ),
          color: "bg-green-50 text-green-900",
        };
      case "danger":
        return {
          icon: (
            <ExclamationCircleIcon
              className="h-6 w-6 text-red-400"
              aria-hidden="true"
            />
          ),
          color: "bg-red-50 text-red-900",
        };
      case "info":
        return {
          icon: (
            <InformationCircleIcon
              className="h-6 w-6 text-blue-400"
              aria-hidden="true"
            />
          ),
          color: "bg-blue-50 text-blue-900",
        };
      default:
        return {
          icon: (
            <CheckCircleIcon
              className="h-6 w-6 text-gray-400"
              aria-hidden="true"
            />
          ),
          color: "bg-gray-50 text-gray-900",
        };
    }
  };

  const { icon, color } = getIconAndColor(toastNotify?.messageType);

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6"
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        <Transition
          show={toastNotify?.show ? toastNotify?.show : false}
          enter="transition ease-out duration-300"
          enterFrom="opacity-0 translate-y-2 sm:translate-y-0 sm:translate-x-2"
          enterTo="opacity-100 translate-y-0 sm:translate-x-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100 translate-y-0 sm:translate-x-0"
          leaveTo="opacity-0 translate-y-2 sm:translate-y-0 sm:translate-x-2"
        >
          <div
            className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 ${color}`}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">{icon}</div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium">{toastNotify?.message}</p>
                </div>
                <div className="ml-4 flex flex-shrink-0">
                  <button
                    type="button"
                    className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={() => dispatch({ type: "HIDE_NOTIFICATION" })}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  );
};

export default AquaToast;
