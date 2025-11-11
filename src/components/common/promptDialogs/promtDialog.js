import AquaResponsiveDialog from "@/components/reusables/dialog";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const AquaPromptDialog = ({
  open,
  close,
  handleOk,
  handleCancel,
  title,
  description = "This action cannot be undone. Are you sure you want to continue?",
  confirmLabel = "Delete",
  cancelLabel = "Don't Delete",
}) => {
  return (
    <AquaResponsiveDialog open={open} close={close}>
      <div className="w-full max-w-sm text-center px-2 pt-5 sm:px-4">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-inner">
            <ExclamationTriangleIcon className="h-7 w-7" aria-hidden="true" />
          </div>
          <h4 className="mt-4 text-xl font-semibold text-gray-900">{title}</h4>
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <button
            type="button"
            onClick={handleOk}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-white"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </AquaResponsiveDialog>
  );
};
export default AquaPromptDialog;
