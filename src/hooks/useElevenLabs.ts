"use client";

import { useConversation } from "@elevenlabs/react";
import { useState, useEffect, useRef } from "react";

export function useElevenLabs() {
  const [transcript, setTranscript] = useState<Array<{ role: string; content: string; timestamp: Date }>>([]);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const conversation = useConversation({
    onMessage: ({ message, source }: { message: string; source: string }) => {
      setTranscript((prev) => [
        ...prev,
        {
          role: source === "user" ? "user" : "assistant",
          content: message,
          timestamp: new Date(),
        },
      ]);
    },
    onConnect: () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    },
    onDisconnect: () => {
      setCallDuration(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    },
    onError: (message: string, context?: any) => {
      console.error("ElevenLabs error:", message, context);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startSession = async (agentId: string) => {
    if (!agentId || agentId === "REPLACE_WITH_ELEVENLABS_AGENT_ID") {
      throw new Error("ElevenLabs agent not configured yet. Coming soon.");
    }
    setTranscript([]);
    setCallDuration(0);
    await conversation.startSession({ agentId });
  };

  const stopSession = async () => {
    await conversation.endSession();
    setCallDuration(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  return {
    isCallActive: conversation.status === "connected",
    transcript,
    callDuration,
    startSession,
    stopSession,
    isSpeaking: conversation.isSpeaking,
  };
}
