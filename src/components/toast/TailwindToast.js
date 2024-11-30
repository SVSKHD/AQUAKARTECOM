import { useSelector, useDispatch } from "react-redux";
import { hideToast } from "@/store/reducers/toastReducer";
import { Transition } from "@headlessui/react";

const AquaTailwindToast = () => {
  const dispatch = useDispatch();
  const { toasts } = useSelector((state) => ({...state}));

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {toasts?.map((toast) => (
        <Transition
          key={toast.id}
          show={true}
          enter="transform transition ease-in-out duration-300"
          enterFrom="translate-y-2 opacity-0"
          enterTo="translate-y-0 opacity-100"
          leave="transform transition ease-in-out duration-300"
          leaveFrom="translate-y-0 opacity-100"
          leaveTo="translate-y-2 opacity-0"
          className={`w-96 rounded-md border-l-4 p-4 shadow-lg ${
            {
              info: "bg-blue-100 text-blue-800 border-blue-500",
              success: "bg-green-100 text-green-800 border-green-500",
              error: "bg-red-100 text-red-800 border-red-500",
              warning: "bg-yellow-100 text-yellow-800 border-yellow-500",
            }[toast.messageType]
          }`}
        >
          <div className="flex justify-between items-center">
            <span>{toast.message}</span>
            <button
              onClick={() => dispatch(hideToast(toast.id))}
              className="ml-4 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </Transition>
      ))}
    </div>
  );
};

export default AquaTailwindToast;