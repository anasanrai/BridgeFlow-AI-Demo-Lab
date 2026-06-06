"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, FileText, RefreshCw, ArrowUp, Settings, ChevronDown, ChevronUp, Database, Brain, Sparkles, Loader2, Check } from "lucide-react";
import { useRAG } from "@/hooks/useRAG";
import { Toast } from "../ui/Toast";
import { logSession } from "@/lib/analytics";
import { ParameterDrawer, RAGParams } from "../ParameterDrawer";

interface RAGTabProps {
  onOpenDrawer: (
    agentType: "voice" | "chat" | "rag",
    agentName: string,
    initialParams: any,
    onSave: (params: any) => void,
    onReset: () => void
  ) => void;
}

const DEFAULT_RAG_PARAMS: RAGParams = {
  systemPrompt:
    "You are a helpful AI assistant for BridgeFlow AI Agency. Answer questions clearly and concisely based on the available context.",
  chunkCount: 5,
  threshold: 0.3,
};

export function RAGTab({ onOpenDrawer }: RAGTabProps) {
  const rag = useRAG();

  const [params, setParams] = useState<RAGParams>({ ...DEFAULT_RAG_PARAMS });
  const [inputText, setInputText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [expandedSourceIndex, setExpandedSourceIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync parameter prompt changes with hook
  useEffect(() => {
    rag.setSystemPrompt(params.systemPrompt);
  }, [params.systemPrompt, rag]);

  // Scroll chat window to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [rag.messages, rag.isLoading]);

  const handleOpenDrawer = () => {
    onOpenDrawer(
      "rag",
      "RAG Knowledge Assistant",
      params,
      (newParams: RAGParams) => {
        setParams(newParams);
      },
      () => {
        setParams({ ...DEFAULT_RAG_PARAMS });
      }
    );
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "txt", "md"].includes(fileExtension || "")) {
      triggerToast("Invalid file format. Please upload .pdf, .txt, or .md");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      triggerToast("File is too large. Max size limit is 10MB.");
      return;
    }

    await logSession("rag", "RAG Knowledge Assistant", "rag");
    await rag.uploadFile(file, (err) => {
      triggerToast(err);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || rag.isLoading) return;

    if (rag.messages.length === 0) {
      await logSession("rag", "RAG Knowledge Assistant", "rag");
    }

    const question = inputText;
    setInputText("");

    await rag.sendMessage(question, params.chunkCount, params.threshold, (err) => {
      triggerToast(err);
    });
  };

  const handleReset = () => {
    rag.resetToDefault((err) => {
      triggerToast(err);
    });
  };

  return (
    <div className="w-full glass rounded-xl p-8 mt-12 fade-up shadow-sm">
      <Toast
        message={toastMessage}
        isOpen={isToastOpen}
        onClose={() => setIsToastOpen(false)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Data Source / Knowledge Base */}
        <div className="flex flex-col space-y-6">
          <div>
            <span className="label">Knowledge Base</span>
            <p className="text-[13px] text-t3 leading-relaxed mt-1">
              Select or upload context files. The AI extracts details dynamically to answer queries.
            </p>
          </div>

          {/* Preloaded Base Card */}
          <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-lg flex items-start space-x-3">
            <Brain className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-[15px] font-semibold text-t2 leading-tight">
                BridgeFlow Services
              </h4>
              <p className="text-[13px] text-t3 mt-1.5 leading-relaxed">
                Baked-in context answering agency pricing, services, tools, timelines, and FAQs.
              </p>
              <div className="mt-3.5 flex items-center space-x-1.5 text-[12px] text-live font-medium">
                <Check className="h-4 w-4" />
                <span>Default Context Active</span>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="space-y-4">
            <span className="label">Upload Document</span>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border border-dashed rounded-lg min-h-[120px] flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? "border-accent bg-accent-dim"
                  : "border-white/[0.12] hover:border-white/[0.2] bg-white/[0.01]"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.txt,.md"
                onChange={handleFileChange}
              />
              
              {rag.uploadStatus === "uploading" || rag.uploadStatus === "processing" ? (
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-6 w-6 text-accent animate-spin" />
                  <span className="text-[13px] text-t3">
                    {rag.uploadStatus === "uploading" ? "Uploading..." : "Chunking..."}
                  </span>
                </div>
              ) : (
                <div className="px-6 py-4">
                  <p className="text-[13px] text-t4 leading-normal">
                    Drag & drop file here or click to browse
                  </p>
                  <p className="text-[11px] text-t4 mt-1 font-mono">
                    PDF, TXT, MD up to 10MB
                  </p>
                </div>
              )}
            </div>

            {/* Current Loaded File Details */}
            {rag.uploadInfo && (
              <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <FileText className="h-4 w-4 text-t3 flex-shrink-0" />
                  <span className="text-[13px] font-medium text-t2 truncate" title={rag.uploadInfo.filename}>
                    {rag.uploadInfo.filename}
                  </span>
                </div>
                {rag.uploadInfo.chunks > 0 && (
                  <div className="flex items-center space-x-1 text-live text-[12px] font-medium flex-shrink-0">
                    <Check className="h-3.5 w-3.5" />
                    <span>{rag.uploadInfo.chunks} chunks</span>
                  </div>
                )}
              </div>
            )}

            <div className="text-[11px] text-t4 leading-relaxed font-sans">
              * Uploaded vectors are session-only and will clear on page reload.
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              disabled={rag.uploadStatus === "processing"}
              className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg border border-white/[0.08] bg-transparent hover:bg-white/[0.03] text-[13px] font-medium text-t3 hover:text-t1 disabled:opacity-40 transition-colors duration-150"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Context</span>
            </button>
          </div>
        </div>

        {/* Right Column: Chat Interface */}
        <div className="flex flex-col space-y-6 border-t lg:border-t-0 lg:border-l border-white/[0.06] pt-8 lg:pt-0 lg:pl-12">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-emerald-500/10 text-emerald-400">
                VECTOR INDEX
              </span>
              <h2 className="text-[17px] font-semibold text-t1 tracking-[-0.02em]">
                RAG Assistant
              </h2>
            </div>
            
            <button
              onClick={handleOpenDrawer}
              disabled={rag.isLoading}
              className="text-[13px] font-medium text-t3 hover:text-t1 disabled:opacity-40 transition-colors duration-150"
            >
              ⚙ RAG Settings
            </button>
          </div>

          {/* RAG Messages Room */}
          <div className="flex-grow flex flex-col space-y-4">
            <span className="label">Conversation</span>
            
            <div className="relative border border-white/[0.06] bg-black/[0.15] rounded-lg p-4 min-h-[260px] max-h-[300px] overflow-y-auto flex flex-col pr-2">
              {rag.messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
                  <span className="text-[13px] text-t4 leading-normal">
                    Ask questions about BridgeFlow Services or your uploaded document...
                  </span>
                </div>
              ) : (
                rag.messages.map((msg, index) => {
                  const isUser = msg.role === "user";

                  return (
                    <div
                      key={index}
                      className={`flex flex-col w-full ${
                        isUser ? "items-end" : "items-start"
                      }`}
                    >
                      {/* Chat Bubble */}
                      <div
                        className={`flex items-start space-x-2.5 px-4 py-2.5 rounded-lg border text-[13px] leading-relaxed max-w-[85%] ${
                          isUser
                            ? "bg-accent-dim border-accent/20 text-t1 rounded-tr-none"
                            : "bg-white/[0.03] border-white/[0.06] text-t1 rounded-tl-none"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="whitespace-pre-line tracking-[-0.01em]">{msg.content}</div>

                          {/* Collapsible Sources Section */}
                          {!isUser && msg.sources && msg.sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/[0.06]">
                              <button
                                onClick={() =>
                                  setExpandedSourceIndex(
                                    expandedSourceIndex === index ? null : index
                                  )
                                }
                                className="flex items-center space-x-1 text-[10px] font-mono font-medium text-accent hover:opacity-85 transition-all duration-200"
                              >
                                <span>Sources ({msg.sources.length})</span>
                                {expandedSourceIndex === index ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </button>

                              {expandedSourceIndex === index && (
                                <div className="mt-2 space-y-1.5">
                                  {msg.sources.map((src, sIdx) => (
                                    <div
                                      key={sIdx}
                                      className="p-2 rounded bg-black/40 border border-white/[0.05] text-[10px] font-mono text-t3 leading-relaxed whitespace-pre-line"
                                    >
                                      {src}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] font-sans text-t4 mt-1 px-1">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })
              )}

              {rag.isLoading && (
                <div className="flex items-center space-x-1 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg w-max rounded-tl-none mt-2 self-start">
                  <span className="w-1 h-1 rounded-full bg-t3 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-1 rounded-full bg-t3 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-1 rounded-full bg-t3 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSend} className="space-y-2">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={rag.isLoading}
                placeholder={rag.isLoading ? "Answering..." : "Query your knowledge base..."}
                className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-accent disabled:opacity-50 rounded-lg pl-4 pr-12 py-3 text-[13px] text-t1 placeholder:text-t4 focus:outline-none transition-all duration-200"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || rag.isLoading}
                className="absolute right-3 w-7 h-7 rounded-full bg-accent hover:opacity-90 flex items-center justify-center text-white disabled:opacity-20 transition-all duration-150 active:scale-95"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between px-1 text-2xs text-t4 uppercase">
              <span>Gemini 2.5 Flash · pgvector</span>
              <span>Overrides Active</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
