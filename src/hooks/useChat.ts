"use client";

import { useState } from "react";

export interface Message {
  role: string; // 'user' | 'assistant'
  content: string;
  timestamp: Date;
}

export function useChat(agentKey: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  );
  const [systemContext, setSystemContext] = useState("");

  const sendMessage = async (content: string, onError?: (err: string) => void) => {
    if (!content.trim()) return;

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
          systemContext,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        const errMsg = data.error || "Sorry, I had trouble responding.";
        if (onError) onError(errMsg);
        
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ Error: ${errMsg}`,
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply || "Sorry, I had trouble responding.",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err: any) {
      const errMsg = err.message || "Connection error. Make sure the n8n webhook is running.";
      if (onError) onError(errMsg);
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Connection error. Make sure the n8n webhook is running.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => setMessages([]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    systemContext,
    setSystemContext,
  };
}
