"use client";
import React from "react";
import Link from "next/link";

interface NavBarProps {
  activeTab: "voice" | "chat" | "rag";
  onTabChange: (tab: "voice" | "chat" | "rag") => void;
}

export function NavBar({ activeTab, onTabChange }: NavBarProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3 select-none">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
            style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)" }}
          >
            B
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-t1 font-semibold text-[15px] tracking-tight">BridgeFlow</span>
            <span className="text-t4 text-[11px] font-medium tracking-wider uppercase">Demo</span>
          </div>
        </div>

        {/* Tab switcher — pill group */}
        <div
          className="flex items-center p-[3px] gap-[2px]"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "10px",
          }}
        >
          {(["voice", "chat", "rag"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className="relative px-4 py-1.5 text-[13px] font-medium capitalize transition-all duration-200"
              style={{
                borderRadius: "8px",
                color: activeTab === tab ? "#FFFFFF" : "#8E8EA0",
                background: activeTab === tab ? "rgba(255,255,255,0.10)" : "transparent",
              }}
            >
              {tab === "rag" ? "RAG" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-[5px] h-[5px] rounded-full bg-live pulse-dot animate-pulse-dot"
            />
            <span className="text-[12px] text-t3 font-medium font-sans">Live</span>
          </div>
          <a
            href="https://calendly.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 text-[13px] font-medium text-t1 rounded-pill transition-all duration-150 active:scale-95"
            style={{
              background: "#6366F1",
              letterSpacing: "-0.01em",
            }}
          >
            Book a Call
          </a>
        </div>
      </div>
    </header>
  );
}
