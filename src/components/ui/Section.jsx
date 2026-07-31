import React from "react";

const spacingClasses = {
  sm: "py-6",
  md: "py-10",
  lg: "py-16",
};

const Section = React.forwardRef(
  (
    {
      as: Component = "section",
      eyebrow,
      title,
      description,
      children,
      spacing = "md",
      className = "",
      contentClassName = "",
      ...props
    },
    ref,
  ) => {
    return (
      <Component
        ref={ref}
        className={[
          "bg-white",
          spacingClasses[spacing] || spacingClasses.md,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        <div
          className={[
            "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
            contentClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {(eyebrow || title || description) && (
            <div className="mb-8 max-w-3xl">
              {eyebrow && (
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                  {description}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </Component>
    );
  },
);

Section.displayName = "Section";

export default Section;
