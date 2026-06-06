import React from "react";

interface LoadingSpinnerProps {
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ label, size = "md" }: LoadingSpinnerProps) {
  const sizeMap = { sm: "20px", md: "32px", lg: "48px" };
  const dim = sizeMap[size];

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className="animate-spin rounded-full"
        style={{
          width: dim,
          height: dim,
          border: `2px solid rgba(99,102,241,0.12)`,
          borderTopColor: "#6366F1",
        }}
      />
      {label && (
        <span className="mt-3 text-[11px] font-mono text-t3 tracking-wide uppercase">
          {label}
        </span>
      )}
    </div>
  );
}
