"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  agentKey: string;
  agentName: string;
  systemContext?: string;
  placeholder?: string;
}

export function ChatInterface({ agentKey, agentName, systemContext, placeholder }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || isLoading) return;

    setInput("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsg: Message = { role: "user", content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentKey,
          message: content,
          sessionId,
          systemContext: systemContext || "",
          source: "bridgeflow-demo-lab",
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || data.error || "No response.",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection error. Check that the n8n webhook is active.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: "#0A0A0A",
        border: "1px solid rgba(255,255,255,0.08)",
        height: "580px",
      }}
    >
      {/* Header — WhatsApp style */}
      <div
        className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#111111" }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-semibold text-white flex-shrink-0"
          style={{ background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.3)" }}
        >
          {agentName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-white leading-none mb-0.5 truncate">
            {agentName}
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-[5px] h-[5px] rounded-full bg-live" />
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              Online · n8n powered
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-[11px] transition-colors duration-150"
            style={{ color: "rgba(255,255,255,0.2)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,68,58,0.8)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.015) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Date separator */}
        <div className="flex justify-center mb-4">
          <span
            className="text-[11px] px-3 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}
          >
            {dateStr}
          </span>
        </div>

        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <div className="flex justify-center mt-6">
            <div
              className="max-w-xs text-center px-6 py-5 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-[13px] text-t3 mb-1">Start a conversation</p>
              <p className="text-[12px] text-t4">
                {placeholder || `Ask ${agentName} anything`}
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex mb-1 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[75%] px-4 py-2.5 rounded-2xl"
              style={
                msg.role === "user"
                  ? { background: "#6366F1", borderBottomRightRadius: "4px" }
                  : {
                      background: "#1C1C1E",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderBottomLeftRadius: "4px",
                    }
              }
            >
              <p
                className="text-[14px] leading-relaxed whitespace-pre-wrap"
                style={{ color: msg.role === "user" ? "white" : "rgba(255,255,255,0.85)" }}
              >
                {msg.content}
              </p>
              <div
                className={`flex items-center mt-1 gap-1 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <span
                  className="text-[10px]"
                  style={{
                    color: msg.role === "user" ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)",
                  }}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                {msg.role === "user" && (
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                    ✓✓
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start mb-1">
            <div
              className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
              style={{
                background: "#1C1C1E",
                border: "1px solid rgba(255,255,255,0.07)",
                borderBottomLeftRadius: "4px",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.3)",
                    animation: `wave 1.2s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 flex items-end gap-3 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "#111111" }}
      >
        <div
          className="flex-1"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "22px",
            padding: "8px 16px",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Message…"}
            rows={1}
            className="w-full bg-transparent text-[14px] resize-none outline-none leading-6"
            style={{
              color: "rgba(255,255,255,0.85)",
              maxHeight: "120px",
              overflow: "hidden auto",
            }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
            }}
          />
        </div>

        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: "#6366F1" }}
        >
          <Send size={16} color="white" />
        </button>
      </div>
    </div>
  );
}
