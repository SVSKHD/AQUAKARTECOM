import React from "react";

const variantClasses = {
  primary:
    "bg-slate-950 text-white hover:bg-slate-800 active:bg-slate-900 border-transparent",
  secondary:
    "bg-white text-slate-900 border-slate-200 hover:bg-slate-50 active:bg-slate-100",
  ghost:
    "bg-transparent text-slate-700 border-transparent hover:bg-slate-100 active:bg-slate-200",
  danger:
    "bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 border-transparent",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

const Button = React.forwardRef(
  (
    {
      children,
      type = "button",
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      disabled = false,
      className = "",
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-full border font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant] || variantClasses.primary,
          sizeClasses[size] || sizeClasses.md,
          fullWidth ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {loading && (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
