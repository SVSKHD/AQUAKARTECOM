import React from "react";
import Button from "./Button";
import Card from "./Card";

const EmptyState = ({
  icon: Icon,
  title = "Nothing here yet",
  description,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <Card className={["text-center", className].filter(Boolean).join(" ")}>
      {Icon && (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Icon aria-hidden="true" className="h-7 w-7" />
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </Card>
  );
};

export default EmptyState;
