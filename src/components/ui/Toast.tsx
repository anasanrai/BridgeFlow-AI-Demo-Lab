"use client";

import React, { useEffect } from "react";
import { X, AlertCircle } from "lucide-react";

interface ToastProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, isOpen, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed top-6 right-6 z-[9999] flex items-center space-x-3 px-4 py-3 rounded-xl shadow-2xl max-w-sm"
      style={{
        background: "#111111",
        border: "1px solid rgba(255,69,58,0.3)",
        color: "#FFFFFF",
      }}
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: "#FF453A" }} />
      <p className="text-[13px] font-medium pr-2 flex-1">{message}</p>
      <button
        onClick={onClose}
        className="p-1 rounded-lg transition-colors duration-150"
        style={{ color: "#8E8EA0" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#8E8EA0")}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
