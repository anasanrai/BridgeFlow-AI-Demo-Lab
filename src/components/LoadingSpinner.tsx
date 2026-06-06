import React from "react";

interface LoadingSpinnerProps {
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ label, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className={`animate-spin rounded-full border-t-purple border-r-transparent border-b-transparent border-l-transparent ${sizeClasses[size]}`}
        style={{ borderColor: "rgba(124, 58, 237, 0.1)", borderTopColor: "#7C3AED" }}
      />
      {label && (
        <span className="mt-3 text-xs font-mono text-text-secondary tracking-wide uppercase">
          {label}
        </span>
      )}
    </div>
  );
}
