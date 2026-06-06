"use client";
import React, { useState } from "react";

const PLATFORM_CONFIG: Record<string, { label: string; color: string }> = {
  vapi:        { label: "Vapi",        color: "#3B82F6" },
  retell:      { label: "Retell AI",   color: "#06B6D4" },
  elevenlabs:  { label: "ElevenLabs",  color: "#F97316" },
  n8n:         { label: "n8n",         color: "#EA4899" },
  rag:         { label: "RAG",         color: "#10B981" },
};

interface AgentCardProps {
  name: string;
  platform: string;
  description: string;
  tags: string[];
  isSelected: boolean;
  onSelect: () => void;
}

export function AgentCard({ name, platform, description, tags, isSelected, onSelect }: AgentCardProps) {
  const [hovered, setHovered] = useState(false);
  const cfg = PLATFORM_CONFIG[platform] || { label: platform, color: "#6366F1" };

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full text-left transition-all duration-200 active:scale-[0.99] select-none"
      style={{
        background: isSelected
          ? "rgba(99,102,241,0.08)"
          : hovered
            ? "rgba(255,255,255,0.04)"
            : "rgba(255,255,255,0.02)",
        border: isSelected
          ? "1px solid rgba(99,102,241,0.35)"
          : "1px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: isSelected
          ? "0 0 0 1px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-5">
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-[6px]"
          style={{
            color: cfg.color,
            background: `${cfg.color}18`,
            letterSpacing: "0.02em",
          }}
        >
          {cfg.label}
        </span>
        <div className="flex items-center gap-1.5">
          <div
            className="w-[5px] h-[5px] rounded-full pulse-dot animate-pulse-dot"
            style={{ background: isSelected ? "#6366F1" : "#30D158" }}
          />
          <span className="text-[11px] text-t4 font-semibold uppercase tracking-wider font-sans">
            {isSelected ? "Active" : "Live"}
          </span>
        </div>
      </div>

      {/* Name */}
      <h3 className="text-[17px] font-semibold text-t1 tracking-[-0.02em] mb-2 leading-tight">
        {name}
      </h3>

      {/* Description */}
      <p className="text-[13px] text-t3 leading-relaxed mb-5 font-normal">
        {description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-[11px] font-medium text-t4 px-2.5 py-1 rounded-[6px]"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div
        className="flex items-center gap-1.5 text-[13px] font-medium transition-colors duration-150"
        style={{ color: isSelected ? "#6366F1" : "#8E8EA0" }}
      >
        {isSelected ? "Session Active" : "Test Live"}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7H11.5M7.5 3L11.5 7L7.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </button>
  );
}
