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
    <div className="fixed top-6 right-6 z-[9999] flex items-center space-x-3 bg-bg-card border border-status-error/30 text-text-primary px-4 py-3 rounded-xl shadow-2xl animate-slide-up max-w-sm">
      <AlertCircle className="h-5 w-5 text-status-error flex-shrink-0" />
      <p className="text-sm font-medium pr-2">{message}</p>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-all duration-200"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
