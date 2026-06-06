"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { CallState, TranscriptMessage } from "./useVapi";

export function useElevenLabs() {
  const conversationRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [callState, setCallState] = useState<CallState>("idle");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (conversationRef.current) {
        try {
          conversationRef.current.endSession();
        } catch {}
      }
    };
  }, []);

  const startSession = useCallback(async (agentId: string) => {
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

      // Use @elevenlabs/client imperatively — avoids useConversation hook SSR issues
      const { Conversation } = await import("@elevenlabs/client");

      const conv = await Conversation.startSession({
        agentId,
        onConnect: () => {
          setCallState("active");
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
        },
        onDisconnect: () => {
          setCallState((prev) => (prev === "error" ? "error" : "ended"));
          if (timerRef.current) clearInterval(timerRef.current);
        },
        onMessage: ({ message, source }: { message: string; source: "user" | "ai" }) => {
          setTranscript((prev) => [
            ...prev,
            {
              role: source === "user" ? "user" : "assistant",
              content: message,
              timestamp: new Date(),
            },
          ]);
        },
        onModeChange: ({ mode }: { mode: string }) => {
          setIsSpeaking(mode === "speaking");
        },
        onError: (msg: string) => {
          const errMsg = typeof msg === "string" ? msg : "ElevenLabs connection failed";
          setErrorMsg(errMsg);
          setCallState("error");
          if (timerRef.current) clearInterval(timerRef.current);
        },
      });

      conversationRef.current = conv;
    } catch (err: any) {
      const msg = err?.message || "ElevenLabs connection failed";
      setErrorMsg(msg);
      setCallState("error");
    }
  }, []);

  const stopSession = useCallback(async () => {
    try {
      if (conversationRef.current) {
        await conversationRef.current.endSession();
        conversationRef.current = null;
      }
    } catch {}
    setCallState("ended");
    setIsSpeaking(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const resetCall = useCallback(() => {
    setCallState("idle");
    setTranscript([]);
    setCallDuration(0);
    setErrorMsg("");
    setIsSpeaking(false);
  }, []);

  return {
    callState,
    transcript,
    callDuration,
    errorMsg,
    isSpeaking,
    startSession,
    stopSession,
    resetCall,
  };
}
