import React from "react";
import Button from "./Button";
import Card from "./Card";

const ErrorState = ({
  title = "Something went wrong",
  description = "Please try again.",
  retryLabel = "Try again",
  onRetry,
  className = "",
}) => {
  return (
    <Card
      className={["border-rose-100 bg-rose-50 text-center", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
        <svg
          aria-hidden="true"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m0 3.75h.007M10.29 3.86 1.82 18a2.25 2.25 0 0 0 1.93 3.38h16.5A2.25 2.25 0 0 0 22.18 18L13.71 3.86a2.25 2.25 0 0 0-3.42 0Z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-rose-800">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-rose-700">
          {description}
        </p>
      )}
      {onRetry && (
        <div className="mt-6">
          <Button variant="danger" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ErrorState;
