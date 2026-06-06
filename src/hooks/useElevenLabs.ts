"use client";

import { useConversation } from "@elevenlabs/react";
import { useState, useCallback, useRef, useEffect } from "react";
import type { CallState, TranscriptMessage } from "./useVapi";

export function useElevenLabs() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [callState, setCallState] = useState<CallState>("idle");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      setCallState("active");
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    },
    onDisconnect: () => {
      setCallState((prev) => (prev === "error" ? "error" : "ended"));
      if (timerRef.current) clearInterval(timerRef.current);
    },
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
    onError: (message: string) => {
      const msg = typeof message === "string" ? message : "ElevenLabs connection failed";
      setErrorMsg(msg);
      setCallState("error");
      if (timerRef.current) clearInterval(timerRef.current);
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startSession = useCallback(
    async (agentId: string) => {
      try {
        setErrorMsg("");
        setTranscript([]);
        setCallDuration(0);

        if (!agentId || agentId === "REPLACE_WITH_ELEVENLABS_AGENT_ID" || agentId === "placeholder") {
          throw new Error("ElevenLabs agent not configured yet.");
        }

        setCallState("requesting");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());

        setCallState("connecting");
        await conversation.startSession({ agentId });
      } catch (err: any) {
        const msg = err?.message || "ElevenLabs connection failed";
        setErrorMsg(msg);
        setCallState("error");
      }
    },
    [conversation]
  );

  const stopSession = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {}
    setCallState("ended");
    if (timerRef.current) clearInterval(timerRef.current);
  }, [conversation]);

  const resetCall = useCallback(() => {
    setCallState("idle");
    setTranscript([]);
    setCallDuration(0);
    setErrorMsg("");
  }, []);

  return {
    callState,
    transcript,
    callDuration,
    errorMsg,
    isSpeaking: conversation.isSpeaking,
    startSession,
    stopSession,
    resetCall,
  };
}
