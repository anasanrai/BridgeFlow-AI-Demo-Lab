"use client";

import React, { useState } from "react";
import { Mic, MicOff, PhoneOff, Phone, RefreshCw, Calendar } from "lucide-react";
import { AgentCard } from "@/components/AgentCard";
import { useVapi } from "@/hooks/useVapi";
import { useRetell } from "@/hooks/useRetell";
import { useElevenLabs } from "@/hooks/useElevenLabs";
import type { VoiceParams } from "@/components/ParameterDrawer";

interface VoiceTabProps {
  onOpenDrawer: (
    agentType: "voice" | "chat" | "rag",
    agentName: string,
    initialParams: any,
    onSave: (params: any) => void,
    onReset: () => void
  ) => void;
}

const DEFAULT_VOICE_PARAMS: Record<string, VoiceParams> = {
  vapi: {
    systemPrompt:
      "You are a real estate lead qualification agent for a Saudi Arabian agency. Greet callers in Arabic or English based on their preference. Ask about their property requirements, budget, preferred location, and timeline. Be professional and friendly.",
    firstMessage:
      "Ahlan wa sahlan! This is Sarah from the real estate team. How can I assist you today?",
    voice: "sarah",
    language: "bilingual",
    maxDuration: 5,
  },
  retell: {
    systemPrompt:
      "You are a professional inbound voice agent for a real estate agency. Qualify leads by asking about their requirements. Be friendly and professional.",
    firstMessage: "Hello! Thank you for calling. I'm your AI real estate assistant. How can I help you today?",
    voice: "ryan",
    language: "bilingual",
    maxDuration: 5,
  },
  elevenlabs: {
    systemPrompt:
      "You are a helpful BridgeFlow AI assistant showcasing voice AI capabilities. Be engaging and natural.",
    firstMessage: "Hi there! I'm an AI voice agent built by BridgeFlow. Go ahead and ask me anything!",
    voice: "sarah",
    language: "english",
    maxDuration: 5,
  },
};

const PLATFORM_COLOR: Record<string, string> = {
  vapi: "#3B82F6",
  retell: "#06B6D4",
  elevenlabs: "#F97316",
};

const VOICE_AGENTS = [
  {
    key: "vapi" as const,
    name: "Real Estate Lead Qualifier",
    platform: "vapi" as const,
    agentId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID_REAL_ESTATE || "",
    description: "Qualifies real estate leads. Ask about your requirements and it books a viewing.",
    tags: ["Arabic", "English", "Real Estate", "Vapi"],
  },
  {
    key: "retell" as const,
    name: "Retell Inbound Agent",
    platform: "retell" as const,
    agentId: process.env.NEXT_PUBLIC_RETELL_AGENT_ID || "",
    description: "Inbound voice agent for real estate. Handles incoming calls and captures lead info.",
    tags: ["Inbound", "Real Estate", "Retell AI"],
  },
  {
    key: "elevenlabs" as const,
    name: "ElevenLabs Conversational AI",
    platform: "elevenlabs" as const,
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "",
    description: "High-quality conversational voice agent powered by ElevenLabs WebRTC.",
    tags: ["Natural Voice", "ElevenLabs", "WebRTC"],
  },
];

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function WaveBar({ active }: { active: boolean }) {
  if (!active) {
    return (
      <div className="flex items-center justify-center gap-1 h-8">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="w-[2px] h-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
        ))}
      </div>
    );
  }
  return (
    <div className="flex items-end justify-center gap-1 h-8">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="wave-bar"
          style={{ height: "100%", animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

export function VoiceTab({ onOpenDrawer }: VoiceTabProps) {
  const [selectedAgent, setSelectedAgent] = useState<"vapi" | "retell" | "elevenlabs" | null>(null);
  const [params, setParams] = useState<Record<string, VoiceParams>>({
    vapi: { ...DEFAULT_VOICE_PARAMS.vapi },
    retell: { ...DEFAULT_VOICE_PARAMS.retell },
    elevenlabs: { ...DEFAULT_VOICE_PARAMS.elevenlabs },
  });

  // All three hooks always mounted — required by React rules
  const vapi = useVapi();
  const retell = useRetell();
  const elevenlabs = useElevenLabs();

  const getHook = (key: "vapi" | "retell" | "elevenlabs") => {
    if (key === "vapi") return vapi;
    if (key === "retell") return retell;
    return elevenlabs;
  };

  const activeAgent = VOICE_AGENTS.find((a) => a.key === selectedAgent);
  const activeHook = selectedAgent ? getHook(selectedAgent) : null;

  const callState = activeHook?.callState ?? "idle";
  const transcript = activeHook?.transcript ?? [];
  const callDuration = activeHook?.callDuration ?? 0;
  const errorMsg = activeHook?.errorMsg ?? "";

  const isActive = callState === "active";
  const isConnecting = callState === "connecting" || callState === "requesting";
  const isEnded = callState === "ended";
  const isError = callState === "error";

  const handleStart = async () => {
    if (!selectedAgent || !activeAgent) return;
    const p = params[selectedAgent];
    if (selectedAgent === "vapi") {
      await vapi.startCall(activeAgent.agentId, {
        model: { systemPrompt: p.systemPrompt },
        variableValues: { firstMessage: p.firstMessage },
      });
    } else if (selectedAgent === "retell") {
      await retell.startCall(activeAgent.agentId);
    } else {
      await elevenlabs.startSession(activeAgent.agentId);
    }
  };

  const handleStop = async () => {
    if (!selectedAgent) return;
    if (selectedAgent === "vapi") await vapi.stopCall();
    else if (selectedAgent === "retell") await retell.stopCall();
    else await elevenlabs.stopSession();
  };

  const handleReset = () => {
    if (!selectedAgent) return;
    if (selectedAgent === "vapi") vapi.resetCall();
    else if (selectedAgent === "retell") retell.resetCall();
    else elevenlabs.resetCall();
  };

  const handleSelectAgent = (key: "vapi" | "retell" | "elevenlabs") => {
    if (selectedAgent && selectedAgent !== key && isActive) {
      handleStop();
    }
    setSelectedAgent(key);
  };

  const handleOpenDrawer = (key: "vapi" | "retell" | "elevenlabs", name: string) => {
    onOpenDrawer(
      "voice",
      name,
      params[key],
      (newParams: VoiceParams) => setParams((prev) => ({ ...prev, [key]: newParams })),
      () => setParams((prev) => ({ ...prev, [key]: { ...DEFAULT_VOICE_PARAMS[key] } }))
    );
  };

  const platformColor = activeAgent ? (PLATFORM_COLOR[activeAgent.platform] ?? "#6366F1") : "#6366F1";

  return (
    <div className="space-y-6">
      {/* Agent selection cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {VOICE_AGENTS.map((agent) => (
          <AgentCard
            key={agent.key}
            name={agent.name}
            platform={agent.platform}
            description={agent.description}
            tags={agent.tags}
            isSelected={selectedAgent === agent.key}
            onSelect={() => handleSelectAgent(agent.key)}
          />
        ))}
      </div>

      {/* Call Dashboard */}
      {selectedAgent && activeAgent && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-[6px]"
                style={{ color: platformColor, background: `${platformColor}18` }}
              >
                {activeAgent.platform.toUpperCase()}
              </span>
              <span className="text-[15px] font-semibold text-white tracking-tight">
                {activeAgent.name}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isActive && (
                <div className="flex items-center gap-1.5">
                  <div className="w-[5px] h-[5px] rounded-full bg-red-500 pulse-dot" />
                  <span className="text-[11px] text-red-400 font-semibold uppercase tracking-wider">Live</span>
                </div>
              )}
              <button
                onClick={() => handleOpenDrawer(selectedAgent, activeAgent.name)}
                disabled={isActive}
                className="text-[12px] font-medium text-t3 hover:text-t1 disabled:opacity-30 transition-colors duration-150"
              >
                ⚙ Params
              </button>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* LEFT: Phone call UI */}
            <div
              className="flex flex-col items-center justify-center py-14 px-8"
              style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-5 transition-all duration-500"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${platformColor}40 0%, ${platformColor}20 100%)`
                    : "rgba(255,255,255,0.04)",
                  border: isActive
                    ? `2px solid ${platformColor}60`
                    : "2px solid rgba(255,255,255,0.07)",
                  boxShadow: isActive ? `0 0 32px ${platformColor}25` : "none",
                }}
              >
                <span className="text-2xl font-semibold text-white">
                  {activeAgent.name.charAt(0)}
                </span>
              </div>

              {/* Name */}
              <p className="text-[16px] font-semibold text-white mb-1 tracking-tight text-center">
                {activeAgent.name}
              </p>

              {/* Status */}
              <p className="text-[12px] mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
                {callState === "idle" && "Ready to connect"}
                {callState === "requesting" && "Requesting microphone…"}
                {callState === "connecting" && "Connecting…"}
                {callState === "active" && "Call in progress"}
                {callState === "ended" && "Call ended"}
                {callState === "error" && "Connection failed"}
              </p>

              {/* Timer */}
              <div
                className="font-mono text-[44px] font-light tracking-[-0.04em] tabular-nums mb-3"
                style={{ color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.15)" }}
              >
                {formatTime(callDuration)}
              </div>

              {/* Wave */}
              <div className="mb-8">
                <WaveBar active={isActive} />
              </div>

              {/* Error */}
              {isError && errorMsg && (
                <div
                  className="mb-6 px-4 py-3 rounded-xl text-[13px] text-center max-w-xs leading-relaxed"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#FCA5A5",
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {/* Controls */}
              {!isEnded && !isError && (
                <div className="flex items-center gap-5">
                  {/* Mute — Vapi only when active */}
                  {isActive && selectedAgent === "vapi" && (
                    <button
                      onClick={vapi.toggleMute}
                      className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95"
                      style={{
                        background: vapi.isMuted ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.07)",
                        border: vapi.isMuted
                          ? "1px solid rgba(239,68,68,0.3)"
                          : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {vapi.isMuted ? (
                        <MicOff size={16} color="#EF4444" />
                      ) : (
                        <Mic size={16} color="rgba(255,255,255,0.6)" />
                      )}
                    </button>
                  )}

                  {/* Main call button */}
                  <button
                    onClick={isActive ? handleStop : handleStart}
                    disabled={isConnecting}
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: isActive ? "#EF4444" : isConnecting ? "rgba(99,102,241,0.3)" : "#6366F1",
                      boxShadow: isActive
                        ? "0 4px 24px rgba(239,68,68,0.35)"
                        : isConnecting
                        ? "none"
                        : "0 4px 24px rgba(99,102,241,0.35)",
                    }}
                  >
                    {isActive ? (
                      <PhoneOff size={26} color="white" />
                    ) : isConnecting ? (
                      <div
                        className="w-5 h-5 rounded-full border-2 animate-spin"
                        style={{ borderColor: "rgba(255,255,255,0.25)", borderTopColor: "white" }}
                      />
                    ) : (
                      <Phone size={26} color="white" />
                    )}
                  </button>
                </div>
              )}

              {/* Post-call */}
              {(isEnded || isError) && (
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-[13px] transition-colors duration-150"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                  >
                    <RefreshCw size={13} />
                    Call again
                  </button>
                  {isEnded && (
                    <a
                      href="https://calendly.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-medium text-white transition-all duration-150 active:scale-95"
                      style={{ background: "#6366F1" }}
                    >
                      <Calendar size={14} />
                      Book a real call →
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: Live Transcript */}
            <div className="flex flex-col" style={{ minHeight: "400px" }}>
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="label">Live Transcript</span>
                {isActive && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-[5px] h-[5px] rounded-full bg-accent pulse-dot animate-pulse-dot" />
                    <span className="text-[10px] text-accent font-semibold uppercase tracking-wider">
                      Listening
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {transcript.length === 0 ? (
                  <div className="h-full flex items-center justify-center py-12">
                    <p className="text-[13px] text-t4">
                      {isActive ? "Listening…" : "Transcript will appear here"}
                    </p>
                  </div>
                ) : (
                  transcript.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className="max-w-[85%] px-4 py-2.5 rounded-2xl"
                        style={
                          msg.role === "user"
                            ? {
                                background: "rgba(99,102,241,0.15)",
                                border: "1px solid rgba(99,102,241,0.25)",
                                borderBottomRightRadius: "4px",
                              }
                            : {
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderBottomLeftRadius: "4px",
                              }
                        }
                      >
                        <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                          {msg.content}
                        </p>
                        <p
                          className="text-[10px] mt-1"
                          style={{ color: "rgba(255,255,255,0.2)" }}
                        >
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
