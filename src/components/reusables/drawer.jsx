import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const drawerWidths = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
};

export default function AquaReuseDrawer({
  open,
  close,
  title,
  description,
  eyebrow = "Aquakart",
  children,
  footer,
  size = "md",
}) {
  return (
    <Dialog className="relative z-[80]" open={open} onClose={close}>
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-md transition duration-300 ease-out data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="flex h-full items-end justify-center p-2.5 sm:items-stretch sm:justify-end sm:p-5 lg:p-7">
          <DialogPanel
            transition
            className={`pointer-events-auto relative flex max-h-[calc(100dvh-1.25rem)] w-full flex-col overflow-hidden rounded-[1.75rem] border border-white/75 bg-[rgba(248,252,251,0.94)] shadow-[0_32px_100px_rgba(2,6,23,0.3)] ring-1 ring-slate-900/5 backdrop-blur-3xl transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-[closed]:translate-y-[calc(100%+1rem)] data-[closed]:scale-[0.98] data-[closed]:opacity-0 sm:h-full sm:max-h-full sm:translate-y-0 sm:rounded-[2rem] sm:data-[closed]:translate-x-[calc(100%+2rem)] sm:data-[closed]:translate-y-0 ${drawerWidths[size] || drawerWidths.md}`}
          >
            <div className="pointer-events-none absolute inset-x-10 top-0 h-28 rounded-full bg-emerald-300/20 blur-3xl" />

            <div className="relative flex shrink-0 items-start justify-between gap-5 border-b border-white/80 bg-white/55 px-5 py-5 sm:px-6 sm:py-6">
              <div className="min-w-0">
                {eyebrow ? (
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                    {eyebrow}
                  </p>
                ) : null}
                <DialogTitle className="text-xl font-black tracking-[-0.04em] text-slate-950 sm:text-2xl">
                  {title}
                </DialogTitle>
                {description ? (
                  <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
                    {description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white/85 text-slate-500 shadow-sm transition hover:-rotate-6 hover:border-slate-300 hover:text-slate-900 active:scale-90"
                onClick={close}
                aria-label={`Close ${title || "panel"}`}
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
              {children}
            </div>

            {footer ? (
              <div className="relative shrink-0 border-t border-white/80 bg-white/70 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:p-5">
                {footer}
              </div>
            ) : null}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
