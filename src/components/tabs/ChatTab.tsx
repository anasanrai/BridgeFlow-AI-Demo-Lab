"use client";

import React, { useState } from "react";
import { AgentCard } from "@/components/AgentCard";
import { ChatInterface } from "@/components/chat/ChatInterface";

interface ChatTabProps {
  onOpenDrawer?: (
    agentType: "voice" | "chat" | "rag",
    agentName: string,
    initialParams: any,
    onSave: (params: any) => void,
    onReset: () => void
  ) => void;
}

const CHAT_AGENTS = [
  {
    id: "islamic-bot" as const,
    name: "Islamic Family Bot",
    platform: "n8n" as const,
    description: "Islamic family law Q&A. Ask questions in Arabic or English.",
    tags: ["Arabic", "Islamic Law", "WhatsApp Bot Logic"],
    placeholder: "Ask about marriage, divorce, inheritance, child custody…",
    systemContext:
      "You are an expert Islamic family law consultant. Answer queries regarding marriage, divorce, inheritance, and child custody in a compassionate and legally accurate manner (based on Islamic jurisprudence). Support both English and Arabic.",
  },
  {
    id: "clinic-bot" as const,
    name: "Clinic Appointment Bot",
    platform: "n8n" as const,
    description: "Book clinic appointments, get service info and timings.",
    tags: ["Clinic", "Booking", "Arabic/English"],
    placeholder: "Book an appointment, ask about services or operating hours…",
    systemContext:
      "You are a helpful receptionist AI for a private clinic. Assist users with booking appointments, checking operating hours, and listing services. Greet in both Arabic and English.",
  },
  {
    id: "axis-agent" as const,
    name: "AXIS AI Command Agent",
    platform: "n8n" as const,
    description: "General-purpose AI command agent. Ask anything.",
    tags: ["General AI", "Commands", "Automation"],
    placeholder: "Ask anything — task planning, automation logic, commands…",
    systemContext:
      "You are the AXIS AI Command Agent, an advanced business assistant. Help with task planning, automation logic, and custom commands. Be direct, logical, and concise.",
  },
];

export function ChatTab({ onOpenDrawer }: ChatTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = CHAT_AGENTS.find((a) => a.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CHAT_AGENTS.map((agent) => (
          <AgentCard
            key={agent.id}
            name={agent.name}
            platform={agent.platform}
            description={agent.description}
            tags={agent.tags}
            isSelected={selectedId === agent.id}
            onSelect={() => setSelectedId(agent.id)}
          />
        ))}
      </div>

      {/* WhatsApp-style chat interface */}
      {selected && (
        <ChatInterface
          key={selected.id}
          agentKey={selected.id}
          agentName={selected.name}
          systemContext={selected.systemContext}
          placeholder={selected.placeholder}
        />
      )}
    </div>
  );
}
