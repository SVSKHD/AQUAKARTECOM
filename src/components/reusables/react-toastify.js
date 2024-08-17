// import { toast } from "react-hot-toast";
// import {
//   CheckCircleIcon,
//   ExclamationCircleIcon,
//   InformationCircleIcon,
// } from "@heroicons/react/20/solid";

// const AquaToast = ({ message, type }) => {
//   const getIcon = () => {
//     switch (type) {
//       case "success":
//         return (
//           <CheckCircleIcon
//             className="h-6 w-6 text-green-500"
//             aria-hidden="true"
//           />
//         );
//       case "error":
//         return (
//           <ExclamationCircleIcon
//             className="h-6 w-6 text-red-500"
//             aria-hidden="true"
//           />
//         );
//       case "info":
//         return (
//           <InformationCircleIcon
//             className="h-6 w-6 text-blue-500"
//             aria-hidden="true"
//           />
//         );
//       default:
//         return null;
//     }
//   };

//   const getToastClass = () => {
//     switch (type) {
//       case "success":
//         return "bg-green-100 ring-green-500";
//       case "error":
//         return "bg-red-100 ring-red-500";
//       case "info":
//         return "bg-blue-100 ring-blue-500";
//       default:
//         return "bg-white ring-gray-500";
//     }
//   };

//   return toast.custom(
//     (t) => (
//       <span>
//       Custom and <b>bold</b>
//       <button onClick={() => toast.dismiss(t.id)}>
//         Dismiss
//       </button>
//     </span>
//     )
//   );
// };

// export default AquaToast;

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AquaToast = ({ message, type }) => {
  return toast(message, {
    type: type || "default", // Sets type, fallback to 'default' if not provided
    autoClose: 2000, // Auto close after 2 seconds
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};

export default AquaToast;
