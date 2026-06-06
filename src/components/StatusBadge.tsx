import React from "react";

export type StatusVariant = "live" | "calling" | "processing" | "standby" | "error";

interface StatusBadgeProps {
  variant: StatusVariant;
}

export function StatusBadge({ variant }: StatusBadgeProps) {
  const styles = {
    live: {
      bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-400",
      label: "Live",
      pulse: false,
    },
    calling: {
      bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      dot: "bg-amber-400",
      label: "Calling",
      pulse: true,
    },
    processing: {
      bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      dot: "bg-blue-400",
      label: "Processing",
      pulse: true,
    },
    standby: {
      bg: "bg-zinc-800 text-zinc-400 border-zinc-700",
      dot: "bg-zinc-500",
      label: "Standby",
      pulse: false,
    },
    error: {
      bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      dot: "bg-rose-400",
      label: "Error",
      pulse: false,
    },
  };

  const current = styles[variant] || styles.standby;

  return (
    <div className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-xs font-mono font-medium ${current.bg}`}>
      <span className="relative flex h-2 w-2">
        {current.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dot}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dot}`}></span>
      </span>
      <span>{current.label}</span>
    </div>
  );
}
