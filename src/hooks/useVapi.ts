"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface TranscriptMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export type CallState = "idle" | "requesting" | "connecting" | "active" | "ended" | "error";

export function useVapi() {
  const vapiRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const getVapi = useCallback(async () => {
    if (vapiRef.current) return vapiRef.current;

    const { default: Vapi } = await import("@vapi-ai/web");
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) throw new Error("NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set");

    const instance = new Vapi(publicKey);
    vapiRef.current = instance;

    instance.on("call-start", () => {
      setCallState("active");
      setCallDuration(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    });

    instance.on("call-end", () => {
      setCallState("ended");
      if (timerRef.current) clearInterval(timerRef.current);
    });

    instance.on("error", (err: any) => {
      const msg =
        err?.message ||
        err?.error?.message ||
        (typeof err === "string" ? err : "Connection failed. Check your Vapi assistant ID.");
      setErrorMsg(msg);
      setCallState("error");
      if (timerRef.current) clearInterval(timerRef.current);
    });

    instance.on("message", (msg: any) => {
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
    });

    return instance;
  }, []);

  const startCall = useCallback(
    async (assistantId: string, overrides?: any) => {
      try {
        setErrorMsg("");
        setTranscript([]);
        setCallDuration(0);

        if (!assistantId || assistantId === "REPLACE_WITH_VAPI_ASSISTANT_ID") {
          throw new Error("Vapi assistant ID not configured");
        }

        setCallState("requesting");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());

        setCallState("connecting");
        const vapi = await getVapi();
        await vapi.start(assistantId, overrides || {});
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to start call");
        setCallState("error");
      }
    },
    [getVapi]
  );

  const stopCall = useCallback(async () => {
    try {
      if (vapiRef.current) await vapiRef.current.stop();
    } catch {}
    setCallState("ended");
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const toggleMute = useCallback(() => {
    if (!vapiRef.current) return;
    const next = !isMuted;
    vapiRef.current.setMuted(next);
    setIsMuted(next);
  }, [isMuted]);

  const resetCall = useCallback(() => {
    setCallState("idle");
    setTranscript([]);
    setCallDuration(0);
    setErrorMsg("");
    setIsMuted(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch {}
      }
    };
  }, []);

  return {
    callState,
    isMuted,
    transcript,
    callDuration,
    errorMsg,
    startCall,
    stopCall,
    toggleMute,
    resetCall,
  };
}
