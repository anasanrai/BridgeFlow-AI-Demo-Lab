"use client";

import { useState, useEffect } from "react";

export interface RAGMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
}

export function useRAG() {
  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  );
  const [messages, setMessages] = useState<RAGMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "ready" | "error">("idle");
  const [uploadInfo, setUploadInfo] = useState<{ filename: string; chunks: number } | null>(null);
  const [isDefaultLoaded, setIsDefaultLoaded] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful AI assistant for BridgeFlow AI Agency. Answer questions clearly and concisely based on the available context."
  );

  // Seed default data on mount
  useEffect(() => {
    const seedDefault = async () => {
      try {
        const res = await fetch("/api/rag/seed-default", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (res.ok) {
          setIsDefaultLoaded(true);
          setUploadStatus("ready");
          setUploadInfo({ filename: "BridgeFlow Services (Default)", chunks: 0 });
        } else {
          console.error("Failed to seed default database.");
        }
      } catch (err) {
        console.error("Error seeding default RAG:", err);
      }
    };
    seedDefault();
  }, [sessionId]);

  const uploadFile = async (file: File, onError?: (err: string) => void) => {
    setUploadStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId);

    try {
      setUploadStatus("processing");
      const res = await fetch("/api/rag/ingest", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUploadStatus("ready");
        setUploadInfo({ filename: data.filename, chunks: data.chunks });
        setMessages([]); // Clear messages when new data loaded
      } else {
        const errMsg = data.error || "Failed to ingest file.";
        setUploadStatus("error");
        if (onError) {
          onError(errMsg);
        }
      }
    } catch (err: any) {
      setUploadStatus("error");
      if (onError) {
        onError(err.message || "Failed to connect to ingestion server.");
      }
    }
  };

  const sendMessage = async (
    question: string,
    chunkCount = 5,
    threshold = 0.3,
    onError?: (err: string) => void
  ) => {
    if (!question.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: question, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          sessionId,
          systemPrompt,
          chunkCount,
          threshold,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "RAG query failure");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || "I couldn't find an answer in the provided context.",
          sources: data.sources || [],
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      const errMsg = err.message || "Error querying the vector database.";
      if (onError) {
        onError(errMsg);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error: ${errMsg}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefault = async (onError?: (err: string) => void) => {
    setMessages([]);
    setUploadStatus("processing");
    try {
      const res = await fetch("/api/rag/seed-default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        setUploadStatus("ready");
        setUploadInfo({ filename: "BridgeFlow Services (Default)", chunks: 0 });
      } else {
        setUploadStatus("error");
        if (onError) {
          onError("Failed to re-seed default dataset.");
        }
      }
    } catch {
      setUploadStatus("error");
      if (onError) {
        onError("Network error when re-seeding default database.");
      }
    }
  };

  return {
    messages,
    isLoading,
    uploadStatus,
    uploadInfo,
    isDefaultLoaded,
    systemPrompt,
    setSystemPrompt,
    uploadFile,
    sendMessage,
    resetToDefault,
  };
}
