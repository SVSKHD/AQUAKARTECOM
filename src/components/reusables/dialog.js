import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

const AquaResponsiveDialog = ({
  open,
  close,
  title,
  children,
  onConfirm,
  actions,
}) => {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={close}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative mx-4 w-full max-w-lg transform overflow-hidden rounded-3xl bg-white px-5 pb-6 pt-6 text-left shadow-xl transition-all sm:mx-0 sm:my-8 sm:w-full sm:max-w-xl sm:px-8 sm:pb-8 sm:pt-8">
                <div className="absolute right-4 top-4">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-sm ring-1 ring-gray-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={close}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-6 sm:mt-4">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AquaResponsiveDialog;
