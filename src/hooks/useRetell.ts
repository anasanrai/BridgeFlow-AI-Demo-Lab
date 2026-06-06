"use client";

import { RetellWebClient } from "retell-client-js-sdk";
import { useState, useRef, useEffect } from "react";

export function useRetell() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ role: string; content: string; timestamp: Date }>>([]);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const retellClientRef = useRef<RetellWebClient | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const client = new RetellWebClient();
      retellClientRef.current = client;

      const handleCallStarted = () => {
        setIsCallActive(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
      };

      const handleCallEnded = () => {
        setIsCallActive(false);
        setCallDuration(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      const handleUpdate = (update: any) => {
        if (update.transcript) {
          const formatted = update.transcript.map((t: any) => ({
            role: t.role === "user" ? "user" : "assistant",
            content: t.content,
            timestamp: new Date(),
          }));
          setTranscript(formatted);
        }
      };

      client.on("call_started", handleCallStarted);
      client.on("call_ended", handleCallEnded);
      client.on("update", handleUpdate);

      return () => {
        client.stopCall();
        client.off("call_started", handleCallStarted);
        client.off("call_ended", handleCallEnded);
        client.off("update", handleUpdate);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, []);

  const startCall = async (agentId: string) => {
    if (!retellClientRef.current) {
      throw new Error("Retell client is not ready");
    }
    
    setTranscript([]);
    const res = await fetch("/api/retell/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to create Retell web call token");
    }

    const { accessToken } = await res.json();
    await retellClientRef.current.startCall({ accessToken });
  };

  const stopCall = () => {
    if (retellClientRef.current) {
      retellClientRef.current.stopCall();
    }
  };

  return { isCallActive, transcript, callDuration, startCall, stopCall };
}
