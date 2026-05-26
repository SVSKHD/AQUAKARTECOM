import React from "react";

const variantClasses = {
  default: "border-slate-200 bg-white",
  muted: "border-slate-100 bg-slate-50",
  dark: "border-slate-800 bg-slate-950 text-white",
};

const paddingClasses = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const Card = React.forwardRef(
  (
    {
      as: Component = "div",
      children,
      variant = "default",
      padding = "md",
      interactive = false,
      className = "",
      ...props
    },
    ref,
  ) => {
    return (
      <Component
        ref={ref}
        className={[
          "rounded-3xl border transition-all duration-200",
          variantClasses[variant] || variantClasses.default,
          paddingClasses[padding] || paddingClasses.md,
          interactive ? "hover:-translate-y-0.5 hover:border-slate-300" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Card.displayName = "Card";

export default Card;
