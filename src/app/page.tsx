"use client";

import React, { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { VoiceTab } from "@/components/tabs/VoiceTab";
import { ChatTab } from "@/components/tabs/ChatTab";
import { RAGTab } from "@/components/tabs/RAGTab";
import { ParameterDrawer } from "@/components/ParameterDrawer";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"voice" | "chat" | "rag">("voice");

  // Drawer state management
  const [drawerState, setDrawerState] = useState<{
    isOpen: boolean;
    agentType: "voice" | "chat" | "rag";
    agentName: string;
    initialParams: any;
    onSave: (params: any) => void;
    onReset: () => void;
  }>({
    isOpen: false,
    agentType: "voice",
    agentName: "",
    initialParams: {},
    onSave: () => {},
    onReset: () => {},
  });

  const openDrawer = (
    agentType: "voice" | "chat" | "rag",
    agentName: string,
    initialParams: any,
    onSave: (params: any) => void,
    onReset: () => void
  ) => {
    setDrawerState({
      isOpen: true,
      agentType,
      agentName,
      initialParams,
      onSave,
      onReset,
    });
  };

  const closeDrawer = () => {
    setDrawerState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-base select-none">
      {/* Top Navbar */}
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Hero Section */}
      <section className="pt-40 pb-20 text-center px-6 fade-up">
        {/* Tag */}
        <div className="inline-flex items-center gap-2 mb-8">
          <div className="w-[5px] h-[5px] rounded-full bg-live pulse-dot animate-pulse-dot" />
          <span className="text-2xs font-medium text-t3 tracking-[0.12em] uppercase">
            Live Interactive Demo
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-[56px] sm:text-[72px] lg:text-[88px] font-semibold leading-[0.95] tracking-[-0.04em] text-t1 mb-6">
          Test AI agents.
          <br />
          <span style={{ color: "#6366F1" }}>Live.</span>
        </h1>

        {/* Subtext */}
        <p className="text-[17px] text-t3 font-normal max-w-[480px] mx-auto leading-relaxed mb-12 tracking-[-0.01em]">
          Pick an agent, edit the prompt, start a session.
          <br />
          No account. No demo calls. Real AI.
        </p>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {[
            { label: "Voice Agents", count: 3 },
            { label: "Chat Agents", count: 3 },
            { label: "RAG Engine", count: 1 },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-t3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "980px",
              }}
            >
              <span className="text-t1 font-semibold tabular-nums">{stat.count}</span>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Main showcase section */}
      <main className="flex-grow max-w-6xl mx-auto w-full px-6 pb-20 fade-up fade-up-1">
        {activeTab === "voice" && (
          <VoiceTab onOpenDrawer={openDrawer} />
        )}
        {activeTab === "chat" && (
          <ChatTab onOpenDrawer={openDrawer} />
        )}
        {activeTab === "rag" && (
          <RAGTab onOpenDrawer={openDrawer} />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-white/[0.06] mt-24 py-10 fade-up fade-up-2">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="text-[13px] text-t4 font-semibold">
              Built by <span className="text-t3 font-medium">BridgeFlow</span>
            </p>
            <p className="text-[12px] text-t4 mt-0.5 font-sans">Riyadh, Saudi Arabia</p>
          </div>
          <div className="flex items-center justify-center flex-wrap gap-6">
            {["n8n.io", "Vapi AI", "Retell AI", "ElevenLabs"].map((link) => (
              <a
                key={link}
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-t4 hover:text-t3 transition-colors duration-150 font-medium font-sans"
              >
                {link}
              </a>
            ))}
          </div>
          <a
            href="https://calendly.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 text-[13px] font-medium text-t1 rounded-pill transition-all duration-150 active:scale-95 text-center w-full sm:w-auto"
            style={{ background: "#6366F1" }}
          >
            Book a Discovery Call
          </a>
        </div>
      </footer>

      {/* Parameter Settings Drawer */}
      <ParameterDrawer
        isOpen={drawerState.isOpen}
        onClose={closeDrawer}
        agentType={drawerState.agentType}
        agentName={drawerState.agentName}
        initialParams={drawerState.initialParams}
        onSave={drawerState.onSave}
        onReset={drawerState.onReset}
      />
    </div>
  );
}
