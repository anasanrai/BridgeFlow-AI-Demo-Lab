"use client";

import React from "react";

interface WaveVisualizerProps {
  isActive: boolean;
  duration: number; // in seconds
  colorClass?: string;
}

export function WaveVisualizer({ isActive, duration }: WaveVisualizerProps) {
  // Format seconds as MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-2">
      {/* Monospace Timer */}
      <div className="font-mono text-[32px] font-light text-t1 tracking-[-0.04em] tabular-nums">
        {formatTime(duration)}
      </div>

      {/* 32px height waveform container */}
      <div className="flex items-end justify-center space-x-1 h-8">
        {isActive ? (
          <>
            <span className="wave-bar" style={{ animationDuration: "1.2s", height: "100%" }} />
            <span className="wave-bar" style={{ animationDuration: "1.6s", height: "100%" }} />
            <span className="wave-bar" style={{ animationDuration: "1.4s", height: "100%" }} />
            <span className="wave-bar" style={{ animationDuration: "1.8s", height: "100%" }} />
            <span className="wave-bar" style={{ animationDuration: "1.3s", height: "100%" }} />
          </>
        ) : (
          <>
            <span className="w-[2px] h-2 bg-t4 rounded-full opacity-40" />
            <span className="w-[2px] h-2 bg-t4 rounded-full opacity-40" />
            <span className="w-[2px] h-2 bg-t4 rounded-full opacity-40" />
            <span className="w-[2px] h-2 bg-t4 rounded-full opacity-40" />
            <span className="w-[2px] h-2 bg-t4 rounded-full opacity-40" />
          </>
        )}
      </div>
    </div>
  );
}
