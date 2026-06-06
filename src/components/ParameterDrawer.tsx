"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw } from "lucide-react";

export interface VoiceParams {
  systemPrompt: string;
  firstMessage: string;
  voice: string;
  language: string;
  maxDuration: number;
}

export interface ChatParams {
  systemContext: string;
  temperature: number;
  language: string;
}

export interface RAGParams {
  systemPrompt: string;
  chunkCount: number;
  threshold: number;
}

export type AgentParams = VoiceParams | ChatParams | RAGParams;

interface ParameterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  agentType: "voice" | "chat" | "rag";
  agentName: string;
  initialParams: AgentParams;
  onSave: (params: any) => void;
  onReset: () => void;
}

export function ParameterDrawer({
  isOpen,
  onClose,
  agentType,
  agentName,
  initialParams,
  onSave,
  onReset,
}: ParameterDrawerProps) {
  const [localParams, setLocalParams] = useState<any>(initialParams);

  // Sync state with props when opening
  useEffect(() => {
    if (isOpen) {
      setLocalParams(initialParams);
    }
  }, [isOpen, initialParams]);

  const handleChange = (field: string, value: any) => {
    setLocalParams((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localParams);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80"
          />

          {/* Drawer Body */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[400px] bg-black/85 backdrop-blur-[24px] border-l border-white/[0.08] shadow-2xl flex flex-col p-[28px] pl-6 pr-6 justify-between select-none"
          >
            {/* Drawer Header */}
            <div>
              <div className="flex items-start justify-between mb-8">
                <div>
                  <span className="label">Parameters</span>
                  <h2 className="text-[17px] font-semibold text-t1 tracking-[-0.02em] mt-1">
                    {agentName}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-t4 hover:text-t1 transition-colors duration-150"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content */}
              <div className="space-y-6">
                {agentType === "voice" && (
                  <>
                    {/* System Prompt */}
                    <div className="space-y-2">
                      <label className="block text-2xs font-semibold text-t3 uppercase tracking-wide">
                        System Prompt
                      </label>
                      <textarea
                        value={(localParams as VoiceParams).systemPrompt || ""}
                        onChange={(e) => handleChange("systemPrompt", e.target.value)}
                        rows={5}
                        className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-accent/40 rounded-[10px] px-3 py-2.5 text-[13px] text-t2 placeholder:text-t4 focus:outline-none transition-all duration-200 resize-none font-sans leading-relaxed"
                        placeholder="Enter the AI persona and context..."
                      />
                    </div>

                    {/* First Message */}
                    <div className="space-y-2">
                      <label className="block text-2xs font-semibold text-t3 uppercase tracking-wide">
                        First Message
                      </label>
                      <input
                        type="text"
                        value={(localParams as VoiceParams).firstMessage || ""}
                        onChange={(e) => handleChange("firstMessage", e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-accent/40 rounded-[10px] px-3 py-2 text-[13px] text-t2 placeholder:text-t4 focus:outline-none transition-all duration-200 font-sans"
                        placeholder="What the AI says first..."
                      />
                    </div>

                    {/* Voice Selector */}
                    <div className="space-y-2">
                      <label className="block text-2xs font-semibold text-t3 uppercase tracking-wide">
                        Voice Model
                      </label>
                      <select
                        value={(localParams as VoiceParams).voice || ""}
                        onChange={(e) => handleChange("voice", e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-accent/40 rounded-[10px] px-3 py-2.5 text-[13px] text-t2 focus:outline-none transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201L5%205L9%201%22%20stroke%3D%22%238E8EA0%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_12px_center] bg-no-repeat"
                      >
                        <option value="sarah">Sarah (Female - Professional)</option>
                        <option value="ryan">Ryan (Male - Friendly)</option>
                        <option value="jennifer">Jennifer (Female - Warm)</option>
                        <option value="mark">Mark (Male - Deep)</option>
                      </select>
                    </div>

                    {/* Language */}
                    <div className="space-y-2">
                      <label className="block text-2xs font-semibold text-t3 uppercase tracking-wide">
                        Language
                      </label>
                      <select
                        value={(localParams as VoiceParams).language || ""}
                        onChange={(e) => handleChange("language", e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-accent/40 rounded-[10px] px-3 py-2.5 text-[13px] text-t2 focus:outline-none transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201L5%205L9%201%22%20stroke%3D%22%238E8EA0%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_12px_center] bg-no-repeat"
                      >
                        <option value="bilingual">Bilingual (English / Arabic)</option>
                        <option value="english">English Only</option>
                        <option value="arabic">Arabic Only</option>
                      </select>
                    </div>

                    {/* Max Duration */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-2xs font-semibold text-t3 uppercase tracking-wide">
                        <span>Max Call Duration</span>
                        <span className="text-accent">{(localParams as VoiceParams).maxDuration} min</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="range"
                          min="1"
                          max="15"
                          step="1"
                          value={(localParams as VoiceParams).maxDuration || 5}
                          onChange={(e) => handleChange("maxDuration", parseInt(e.target.value))}
                          className="w-full h-1 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-accent"
                        />
                      </div>
                    </div>
                  </>
                )}

                {agentType === "chat" && (
                  <>
                    {/* System Context */}
                    <div className="space-y-2">
                      <label className="block text-2xs font-semibold text-t3 uppercase tracking-wide">
                        System Context
                      </label>
                      <textarea
                        value={(localParams as ChatParams).systemContext || ""}
                        onChange={(e) => handleChange("systemContext", e.target.value)}
                        rows={6}
                        className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-accent/40 rounded-[10px] px-3 py-2.5 text-[13px] text-t2 placeholder:text-t4 focus:outline-none transition-all duration-200 resize-none font-sans leading-relaxed"
                        placeholder="Enter prompt instructions for n8n..."
                      />
                    </div>

                    {/* Temperature */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-2xs font-semibold text-t3 uppercase tracking-wide">
                        <span>Temperature</span>
                        <span className="text-accent">{(localParams as ChatParams).temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={(localParams as ChatParams).temperature === undefined ? 0.5 : (localParams as ChatParams).temperature}
                        onChange={(e) => handleChange("temperature", parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-accent"
                      />
                    </div>

                    {/* Language */}
                    <div className="space-y-2">
                      <label className="block text-2xs font-semibold text-t3 uppercase tracking-wide">
                        Language
                      </label>
                      <select
                        value={(localParams as ChatParams).language || ""}
                        onChange={(e) => handleChange("language", e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-accent/40 rounded-[10px] px-3 py-2.5 text-[13px] text-t2 focus:outline-none transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201L5%205L9%201%22%20stroke%3D%22%238E8EA0%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_12px_center] bg-no-repeat"
                      >
                        <option value="bilingual">Bilingual (English / Arabic)</option>
                        <option value="english">English Only</option>
                        <option value="arabic">Arabic Only</option>
                      </select>
                    </div>
                  </>
                )}

                {agentType === "rag" && (
                  <>
                    {/* System Prompt */}
                    <div className="space-y-2">
                      <label className="block text-2xs font-semibold text-t3 uppercase tracking-wide">
                        System Prompt
                      </label>
                      <textarea
                        value={(localParams as RAGParams).systemPrompt || ""}
                        onChange={(e) => handleChange("systemPrompt", e.target.value)}
                        rows={6}
                        className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-accent/40 rounded-[10px] px-3 py-2.5 text-[13px] text-t2 placeholder:text-t4 focus:outline-none transition-all duration-200 resize-none font-sans leading-relaxed"
                        placeholder="Enter the AI persona and instructions..."
                      />
                    </div>

                    {/* Chunk Count */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-2xs font-semibold text-t3 uppercase tracking-wide">
                        <span>Source Chunks Limit</span>
                        <span className="text-accent">{(localParams as RAGParams).chunkCount} chunks</span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="10"
                        step="1"
                        value={(localParams as RAGParams).chunkCount || 5}
                        onChange={(e) => handleChange("chunkCount", parseInt(e.target.value))}
                        className="w-full h-1 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-accent"
                      />
                    </div>

                    {/* Similarity Threshold */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-2xs font-semibold text-t3 uppercase tracking-wide">
                        <span>Similarity Threshold</span>
                        <span className="text-accent">{(localParams as RAGParams).threshold}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={(localParams as RAGParams).threshold === undefined ? 0.3 : (localParams as RAGParams).threshold}
                        onChange={(e) => handleChange("threshold", parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-accent"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleSave}
                className="w-full py-2.5 rounded-pill text-[13px] font-medium text-white transition-all duration-150 hover:opacity-95 active:scale-98"
                style={{ background: "#6366F1" }}
              >
                Save Parameters
              </button>
              
              <button
                type="button"
                onClick={() => {
                  onReset();
                  onClose();
                }}
                className="w-full py-2 rounded-lg text-[12px] font-medium text-t4 hover:text-t3 flex items-center justify-center space-x-1.5 transition-all duration-150"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset to Defaults</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
