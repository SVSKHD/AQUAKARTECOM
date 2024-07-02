import {useState} from "react"
import AquaHomeComponent from "@/pageComponents/home";

const AquaHomePage = () => {
  const [show , setShow] = useState(false)

const Toast = ({ message, onClose }) => {
  return (
    <div className="fixed bottom-5 right-5 bg-white border border-gray-300 rounded-lg shadow-lg p-4 flex items-center space-x-4">
      <div className="text-sm text-gray-700">
        {message}
      </div>
      <button
        onClick={onClose}
        className="bg-blue-500 text-white px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
      >
        Close
      </button>
    </div>
  );
};

const handleShowToast = () => {
  setShow(true);
  setTimeout(() => setShow(false), 3000); // Auto-hide toast after 3 seconds
};
  return (
    <>
    <div className="flex items-center justify-center h-screen">
      <button
        onClick={handleShowToast}
        className="bg-green-500 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
      >
        Show Toast
      </button>

      {show && (
        <Toast 
          message="This is a toast notification!" 
          onClose={() => setShow(false)}
        />
      )}
    </div>
      <AquaHomeComponent />
    </>
  );
};
export default AquaHomePage;
