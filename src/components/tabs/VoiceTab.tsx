"use client";

import React, { useState } from "react";
import { AgentCard } from "../AgentCard";
import { VoiceCallInterface } from "../voice/VoiceCallInterface";
import { ParameterDrawer, VoiceParams } from "../ParameterDrawer";

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
      "You are a real estate lead qualification agent for a Saudi Arabian agency. Greet callers in Arabic or English based on their preference. Ask about their property requirements, budget, preferred location, and timeline. Capture their name and phone number. Be professional and friendly.",
    firstMessage:
      "Ahlan wa sahlan! This is Sarah from the real estate team. How can I assist you today? (أهلاً وسهلاً، أنا سارة من فريق العقارات. كيف يمكنني مساعدتك؟)",
    voice: "sarah",
    language: "bilingual",
    maxDuration: 5,
  },
  retell: {
    systemPrompt:
      "You are a professional inbound voice agent for a real estate agency. Qualify leads by asking about their requirements. Be friendly and professional in Arabic or English.",
    firstMessage: "Hello! Thank you for calling. I'm your AI real estate assistant. How can I help you today?",
    voice: "ryan",
    language: "bilingual",
    maxDuration: 5,
  },
  elevenlabs: {
    systemPrompt:
      "You are a helpful BridgeFlow AI assistant showcasing voice AI capabilities. Explain what BridgeFlow builds — voice agents, WhatsApp bots, and automation. Be engaging and natural.",
    firstMessage: "Hi there! I'm an AI voice agent built by BridgeFlow. Go ahead and ask me anything!",
    voice: "sarah",
    language: "english",
    maxDuration: 5,
  },
};

export function VoiceTab({ onOpenDrawer }: VoiceTabProps) {
  const [selectedAgent, setSelectedAgent] = useState<"vapi" | "retell" | "elevenlabs" | null>(null);

  // In-memory state for voice overrides
  const [params, setParams] = useState<Record<string, VoiceParams>>({
    vapi: { ...DEFAULT_VOICE_PARAMS.vapi },
    retell: { ...DEFAULT_VOICE_PARAMS.retell },
    elevenlabs: { ...DEFAULT_VOICE_PARAMS.elevenlabs },
  });

  const voiceAgents = [
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

  const handleOpenDrawer = (agentKey: "vapi" | "retell" | "elevenlabs", agentName: string) => {
    onOpenDrawer(
      "voice",
      agentName,
      params[agentKey],
      (newParams: VoiceParams) => {
        setParams((prev) => ({
          ...prev,
          [agentKey]: newParams,
        }));
      },
      () => {
        setParams((prev) => ({
          ...prev,
          [agentKey]: { ...DEFAULT_VOICE_PARAMS[agentKey] },
        }));
      }
    );
  };

  const activeAgentConfig = voiceAgents.find((a) => a.key === selectedAgent);

  return (
    <div className="space-y-6">
      {/* 3 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {voiceAgents.map((agent) => (
          <AgentCard
            key={agent.key}
            name={agent.name}
            platform={agent.platform}
            description={agent.description}
            tags={agent.tags}
            isSelected={selectedAgent === agent.key}
            onSelect={() => setSelectedAgent(agent.key)}
          />
        ))}
      </div>

      {/* Voice Call Interface Pane */}
      {selectedAgent && activeAgentConfig && (
        <VoiceCallInterface
          key={selectedAgent} // Recreate on agent change to clean state
          agentName={activeAgentConfig.name}
          platform={activeAgentConfig.platform}
          agentId={activeAgentConfig.agentId}
          parameters={params[selectedAgent]}
          onOpenParameters={() => handleOpenDrawer(selectedAgent, activeAgentConfig.name)}
        />
      )}
    </div>
  );
}
