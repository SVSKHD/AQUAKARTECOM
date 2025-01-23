import AquaResponsiveDialog from "@/components/reusables/dialog";

const AquaPromptDialog = ({ open, close, handleOk, handleCancel, title }) => {
  return (
    <AquaResponsiveDialog open={open} close={close}>
      <h4 className="font-bold text-xl text-gray-900 mb-5">{title}</h4>
      <div className="text-center">
        <span className="isolate inline-flex rounded-md shadow-sm">
          <button
            type="button"
            className="relative inline-flex items-center rounded-l-md bg-red-600 px-2 py-2 text-white ring-1 ring-inset ring-red-600 hover:bg-red-700 focus:z-10"
            onClick={handleOk}
          >
            Delete
          </button>
          <button
            type="button"
            className="relative -ml-px inline-flex items-center rounded-r-md bg-white px-2 py-2 text-gray-600 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
            onClick={handleCancel}
          >
            Don't Delete
          </button>
        </span>
      </div>
    </AquaResponsiveDialog>
  );
};
export default AquaPromptDialog;
