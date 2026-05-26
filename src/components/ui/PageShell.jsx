import React from "react";

const PageShell = React.forwardRef(
  (
    {
      as: Component = "div",
      children,
      className = "",
      withTopPadding = false,
      ...props
    },
    ref,
  ) => {
    return (
      <Component
        ref={ref}
        className={[
          "min-h-screen bg-white text-slate-950",
          withTopPadding ? "pt-8" : "",
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

PageShell.displayName = "PageShell";

export default PageShell;
