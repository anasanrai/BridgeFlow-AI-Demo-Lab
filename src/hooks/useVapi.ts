"use client";

import Vapi from "@vapi-ai/web";
import { useState, useRef, useEffect } from "react";

export function useVapi() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ role: string; content: string; timestamp: Date }>>([]);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);
      vapiRef.current = vapiInstance;

      const handleCallStart = () => {
        setIsCallActive(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
      };

      const handleCallEnd = () => {
        setIsCallActive(false);
        setCallDuration(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      const handleMessage = (msg: any) => {
        if (msg.type === "transcript" && msg.transcriptType === "final") {
          setTranscript((prev) => [
            ...prev,
            {
              role: msg.role === "user" ? "user" : "assistant",
              content: msg.transcript,
              timestamp: new Date(),
            },
          ]);
        }
      };

      vapiInstance.on("call-start", handleCallStart);
      vapiInstance.on("call-end", handleCallEnd);
      vapiInstance.on("message", handleMessage);

      return () => {
        vapiInstance.stop();
        vapiInstance.off("call-start", handleCallStart);
        vapiInstance.off("call-end", handleCallEnd);
        vapiInstance.off("message", handleMessage);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, []);

  const startCall = async (assistantId: string, overrides?: any) => {
    if (vapiRef.current) {
      setTranscript([]);
      // Prepare assistant overrides from parameters if specified
      let finalOverrides = overrides || {};
      
      // Greet first message override if applicable
      await vapiRef.current.start(assistantId, finalOverrides);
    }
  };

  const stopCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
  };

  const toggleMute = () => {
    if (vapiRef.current) {
      const nextMuted = !isMuted;
      vapiRef.current.setMuted(nextMuted);
      setIsMuted(nextMuted);
    }
  };

  return {
    isCallActive,
    isMuted,
    transcript,
    callDuration,
    startCall,
    stopCall,
    toggleMute,
  };
}
