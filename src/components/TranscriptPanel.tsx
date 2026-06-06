"use client";

import React, { useEffect, useRef } from "react";

interface TranscriptMessage {
  role: string; // 'user' | 'assistant'
  content: string;
  timestamp: Date;
}

interface TranscriptPanelProps {
  messages: TranscriptMessage[];
  placeholderText?: string;
}

export function TranscriptPanel({
  messages,
  placeholderText = "Start a conversation →",
}: TranscriptPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTimestamp = (date: Date) => {
    try {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div
      ref={panelRef}
      className="max-h-80 overflow-y-auto bg-transparent space-y-4 scroll-smooth min-h-[220px] flex flex-col pr-1"
    >
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
          <span className="text-[13px] font-normal text-t4">
            {placeholderText}
          </span>
        </div>
      ) : (
        messages.map((msg, index) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={index}
              className={`flex flex-col max-w-[85%] ${
                isUser ? "self-end items-end" : "self-start items-start"
              }`}
            >
              {/* Message Content Bubble */}
              <div
                className={`px-4 py-2.5 rounded-lg text-[13px] leading-relaxed transition-all duration-200 ${
                  isUser
                    ? "bg-accent-dim border border-accent/20 text-t1 rounded-tr-none"
                    : "bg-white/[0.03] border border-white/[0.06] text-t1 rounded-tl-none"
                }`}
              >
                <div className="whitespace-pre-line tracking-[-0.01em]">{msg.content}</div>
              </div>

              {/* Timestamp */}
              <span className="text-[10px] font-sans text-t4 mt-1 px-1">
                {formatTimestamp(msg.timestamp)}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
