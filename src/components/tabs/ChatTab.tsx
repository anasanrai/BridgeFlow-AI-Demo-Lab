"use client";

import React, { useState } from "react";
import { AgentCard } from "../AgentCard";
import { ChatInterface } from "../chat/ChatInterface";
import { ParameterDrawer, ChatParams } from "../ParameterDrawer";

interface ChatTabProps {
  onOpenDrawer: (
    agentType: "voice" | "chat" | "rag",
    agentName: string,
    initialParams: any,
    onSave: (params: any) => void,
    onReset: () => void
  ) => void;
}

const DEFAULT_CHAT_PARAMS: Record<string, ChatParams> = {
  "islamic-bot": {
    systemContext:
      "You are an expert Islamic family law consultant. Answer queries regarding marriage, divorce, inheritance, and child custody in a compassionate and legally accurate manner (based on Islamic jurisprudence). You support both English and Arabic.",
    temperature: 0.2,
    language: "bilingual",
  },
  "clinic-bot": {
    systemContext:
      "You are a helpful receptionist AI for a private clinic. Assist users in booking appointments, checking operating hours, and listing services. Greet in both Arabic and English.",
    temperature: 0.3,
    language: "bilingual",
  },
  "axis-agent": {
    systemContext:
      "You are the AXIS AI Command Agent, an advanced business assistant. Help with task planning, automation logic, and custom commands. Be direct, logical, and concise.",
    temperature: 0.5,
    language: "english",
  },
};

export function ChatTab({ onOpenDrawer }: ChatTabProps) {
  const [selectedAgent, setSelectedAgent] = useState<"islamic-bot" | "clinic-bot" | "axis-agent" | null>(null);

  // In-memory parameters overrides
  const [params, setParams] = useState<Record<string, ChatParams>>({
    "islamic-bot": { ...DEFAULT_CHAT_PARAMS["islamic-bot"] },
    "clinic-bot": { ...DEFAULT_CHAT_PARAMS["clinic-bot"] },
    "axis-agent": { ...DEFAULT_CHAT_PARAMS["axis-agent"] },
  });

  const chatAgents = [
    {
      key: "islamic-bot" as const,
      name: "Islamic Family Bot",
      platform: "n8n" as const,
      description: "Islamic family law Q&A bot. Ask questions in Arabic or English.",
      tags: ["Arabic", "Islamic Law", "WhatsApp Bot Logic"],
    },
    {
      key: "clinic-bot" as const,
      name: "Clinic Appointment Bot",
      platform: "n8n" as const,
      description: "Book clinic appointments, get info about services and timings.",
      tags: ["Clinic", "Booking", "Arabic/English"],
    },
    {
      key: "axis-agent" as const,
      name: "AXIS AI Command Agent",
      platform: "n8n" as const,
      description: "General-purpose AI command agent. Ask anything, get intelligent responses.",
      tags: ["General AI", "Commands", "Automation"],
    },
  ];

  const handleOpenDrawer = (agentKey: "islamic-bot" | "clinic-bot" | "axis-agent", agentName: string) => {
    onOpenDrawer(
      "chat",
      agentName,
      params[agentKey],
      (newParams: ChatParams) => {
        setParams((prev) => ({
          ...prev,
          [agentKey]: newParams,
        }));
      },
      () => {
        setParams((prev) => ({
          ...prev,
          [agentKey]: { ...DEFAULT_CHAT_PARAMS[agentKey] },
        }));
      }
    );
  };

  const activeAgentConfig = chatAgents.find((a) => a.key === selectedAgent);

  return (
    <div className="space-y-6">
      {/* 3 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {chatAgents.map((agent) => (
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

      {/* Chat Interface Panel */}
      {selectedAgent && activeAgentConfig && (
        <ChatInterface
          key={selectedAgent} // Recreate on agent change to clean state
          agentName={activeAgentConfig.name}
          agentKey={activeAgentConfig.key}
          systemContext={params[selectedAgent].systemContext}
          setSystemContext={(ctx) =>
            setParams((prev) => ({
              ...prev,
              [selectedAgent]: {
                ...prev[selectedAgent],
                systemContext: ctx,
              },
            }))
          }
          onOpenParameters={() => handleOpenDrawer(selectedAgent, activeAgentConfig.name)}
        />
      )}
    </div>
  );
}
