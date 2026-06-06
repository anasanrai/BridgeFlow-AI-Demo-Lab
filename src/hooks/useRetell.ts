"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { CallState, TranscriptMessage } from "./useVapi";

export function useRetell() {
  const clientRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [callState, setCallState] = useState<CallState>("idle");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const getClient = useCallback(async () => {
    if (clientRef.current) return clientRef.current;

    const { RetellWebClient } = await import("retell-client-js-sdk");
    const client = new RetellWebClient();
    clientRef.current = client;

    client.on("call_started", () => {
      setCallState("active");
      setCallDuration(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    });

    client.on("call_ended", () => {
      setCallState("ended");
      if (timerRef.current) clearInterval(timerRef.current);
    });

    client.on("error", (err: any) => {
      const msg = err?.message || (typeof err === "string" ? err : "Retell connection failed");
      setErrorMsg(msg);
      setCallState("error");
      if (timerRef.current) clearInterval(timerRef.current);
    });

    client.on("update", (update: any) => {
      if (update?.transcript && Array.isArray(update.transcript)) {
        setTranscript(
          update.transcript.map((t: any) => ({
            role: t.role === "agent" ? "assistant" : "user",
            content: t.content,
            timestamp: new Date(),
          }))
        );
      }
    });

    return client;
  }, []);

  const startCall = useCallback(
    async (agentId: string) => {
      try {
        setErrorMsg("");
        setTranscript([]);
        setCallDuration(0);

        setCallState("requesting");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());

        setCallState("connecting");

        const res = await fetch("/api/retell/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `Retell token request failed (${res.status})`);
        }

        const { accessToken } = await res.json();
        if (!accessToken) throw new Error("No access token returned from Retell");

        const client = await getClient();
        await client.startCall({ accessToken });
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to start Retell call");
        setCallState("error");
      }
    },
    [getClient]
  );

  const stopCall = useCallback(async () => {
    try {
      if (clientRef.current) clientRef.current.stopCall();
    } catch {}
    setCallState("ended");
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const resetCall = useCallback(() => {
    setCallState("idle");
    setTranscript([]);
    setCallDuration(0);
    setErrorMsg("");
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (clientRef.current) {
        try {
          clientRef.current.stopCall();
        } catch {}
      }
    };
  }, []);

  return { callState, transcript, callDuration, errorMsg, startCall, stopCall, resetCall };
}
