"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp, Trash2, Settings } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { TranscriptPanel } from "../TranscriptPanel";
import { Toast } from "../ui/Toast";
import { logSession } from "@/lib/analytics";

interface ChatInterfaceProps {
  agentName: string;
  agentKey: string;
  onOpenParameters: () => void;
  systemContext: string;
  setSystemContext: (ctx: string) => void;
}

export function ChatInterface({
  agentName,
  agentKey,
  onOpenParameters,
  systemContext,
  setSystemContext,
}: ChatInterfaceProps) {
  const chat = useChat(agentKey);
  const [inputText, setInputText] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isToastOpen, setIsToastOpen] = useState(false);

  // Sync parent parameters down to the hook
  useEffect(() => {
    chat.setSystemContext(systemContext);
  }, [systemContext, chat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || chat.isLoading) return;

    if (chat.messages.length === 0) {
      await logSession("chat", agentName, "n8n");
    }

    const textToSend = inputText;
    setInputText("");

    await chat.sendMessage(textToSend, (err) => {
      setToastMessage(err);
      setIsToastOpen(true);
    });
  };

  const handleClear = () => {
    chat.clearMessages();
  };

  const CHAR_LIMIT = 500;

  return (
    <div className="w-full glass rounded-xl p-8 mt-12 fade-up shadow-sm flex flex-col space-y-6">
      <Toast
        message={toastMessage}
        isOpen={isToastOpen}
        onClose={() => setIsToastOpen(false)}
      />

      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-accent-dim text-accent">
            N8N WORKFLOW
          </span>
          <h2 className="text-[17px] font-semibold text-t1 tracking-[-0.02em]">
            {agentName}
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          {chat.messages.length > 0 && (
            <button
              onClick={handleClear}
              className="text-[13px] font-medium text-t4 hover:text-error transition-colors duration-150 flex items-center space-x-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}

          <button
            onClick={onOpenParameters}
            disabled={chat.isLoading}
            className="text-[13px] font-medium text-t3 hover:text-t1 disabled:opacity-40 transition-colors duration-150"
          >
            ⚙ Parameters
          </button>
        </div>
      </div>

      {/* Transcript Room */}
      <div className="flex-grow flex flex-col space-y-4">
        <span className="label">Conversation</span>
        
        <div className="relative border border-white/[0.06] bg-black/[0.15] rounded-lg p-4 min-h-[260px] flex flex-col justify-between">
          <div className="flex-1 overflow-y-auto">
            <TranscriptPanel
              messages={chat.messages}
              placeholderText="Start a conversation →"
            />
          </div>

          {chat.isLoading && (
            <div className="flex items-center space-x-1 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg w-max rounded-tl-none mt-2 self-start">
              <span className="w-1 h-1 rounded-full bg-t3 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full bg-t3 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 rounded-full bg-t3 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSend} className="space-y-2">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            maxLength={CHAR_LIMIT}
            onChange={(e) => setInputText(e.target.value)}
            disabled={chat.isLoading}
            placeholder={chat.isLoading ? "Waiting..." : "Type your message..."}
            className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-accent disabled:opacity-50 rounded-lg pl-4 pr-12 py-3 text-[13px] text-t1 placeholder:text-t4 focus:outline-none transition-all duration-200"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || chat.isLoading}
            className="absolute right-3 w-7 h-7 rounded-full bg-accent hover:opacity-90 flex items-center justify-center text-white disabled:opacity-20 transition-all duration-150 active:scale-95"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>

        {/* Footnote */}
        <div className="flex items-center justify-between px-1 text-[11px] font-sans text-t4">
          <span>Powered by n8n webhook orchestration engines.</span>
          <span>
            {inputText.length} / {CHAR_LIMIT}
          </span>
        </div>
      </form>
    </div>
  );
}
