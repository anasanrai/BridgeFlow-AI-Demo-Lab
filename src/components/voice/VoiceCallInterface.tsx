"use client";

import React, { useEffect, useState, useRef } from "react";
import { Mic, Square, Settings, Calendar, CheckCircle, Volume2, VolumeX, Loader2 } from "lucide-react";
import { useVapi } from "@/hooks/useVapi";
import { useRetell } from "@/hooks/useRetell";
import { useElevenLabs } from "@/hooks/useElevenLabs";
import { WaveVisualizer } from "../WaveVisualizer";
import { TranscriptPanel } from "../TranscriptPanel";
import { logSession } from "@/lib/analytics";

interface VoiceCallInterfaceProps {
  agentName: string;
  platform: "vapi" | "retell" | "elevenlabs";
  agentId: string;
  onOpenParameters: () => void;
  parameters: {
    systemPrompt: string;
    firstMessage: string;
    voice: string;
    language: string;
    maxDuration: number;
  };
}

const PLATFORM_COLORS: Record<string, string> = {
  vapi: "#3B82F6",
  retell: "#06B6D4",
  elevenlabs: "#F97316",
};

export function VoiceCallInterface({
  agentName,
  platform,
  agentId,
  onOpenParameters,
  parameters,
}: VoiceCallInterfaceProps) {
  const vapi = useVapi();
  const retell = useRetell();
  const elevenlabs = useElevenLabs();

  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Active state based on platform
  const isCallActive =
    platform === "vapi"
      ? vapi.isCallActive
      : platform === "retell"
      ? retell.isCallActive
      : elevenlabs.isCallActive;

  const duration =
    platform === "vapi"
      ? vapi.callDuration
      : platform === "retell"
      ? retell.callDuration
      : elevenlabs.callDuration;

  const transcript =
    platform === "vapi"
      ? vapi.transcript
      : platform === "retell"
      ? retell.transcript
      : elevenlabs.transcript;

  const prevIsCallActive = useRef(false);
  useEffect(() => {
    if (prevIsCallActive.current && !isCallActive) {
      setShowSessionComplete(true);
    }
    prevIsCallActive.current = isCallActive;
  }, [isCallActive]);

  const requestMicPermission = async (): Promise<boolean> => {
    try {
      setMicError(null);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (err: any) {
      console.error("Mic permission denied:", err);
      setMicError("Microphone access is required to make voice calls.");
      return false;
    }
  };

  const handleStartCall = async () => {
    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      return;
    }

    setShowSessionComplete(false);
    await logSession("voice", agentName, platform);

    try {
      if (platform === "vapi") {
        const overrides = {
          variableValues: {
            firstMessage: parameters.firstMessage,
          },
          model: {
            systemPrompt: parameters.systemPrompt,
          },
        };
        await vapi.startCall(agentId, overrides);
      } else if (platform === "retell") {
        await retell.startCall(agentId);
      } else if (platform === "elevenlabs") {
        await elevenlabs.startSession(agentId);
      }
    } catch (err: any) {
      console.error("Failed to start call:", err);
      setMicError(err.message || "Failed to establish call.");
    }
  };

  const handleEndCall = () => {
    if (platform === "vapi") {
      vapi.stopCall();
    } else if (platform === "retell") {
      retell.stopCall();
    } else if (platform === "elevenlabs") {
      elevenlabs.stopSession();
    }
  };

  const platformColor = PLATFORM_COLORS[platform] || "#6366F1";

  return (
    <div className="w-full glass rounded-xl p-8 mt-12 fade-up shadow-sm">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-5 mb-8">
        <div className="flex items-center gap-3">
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-[4px]"
            style={{
              color: platformColor,
              background: `${platformColor}18`,
            }}
          >
            {platform.toUpperCase()}
          </span>
          <h2 className="text-[17px] font-semibold text-t1 tracking-[-0.02em]">
            {agentName}
          </h2>
        </div>

        <button
          onClick={onOpenParameters}
          disabled={isCallActive}
          className="text-[13px] font-medium text-t3 hover:text-t1 disabled:opacity-40 disabled:hover:text-t3 transition-colors duration-150"
        >
          ⚙ Parameters
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        
        {/* Left Column (60%): Wave visualizer & call control */}
        <div className="lg:col-span-6 flex flex-col justify-center items-center py-6 space-y-6">
          <WaveVisualizer isActive={isCallActive} duration={duration} />

          {/* Call Trigger Circle (64px) */}
          <div className="flex flex-col items-center space-y-3">
            {isCallActive ? (
              <button
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-error hover:opacity-90 active:scale-95 transition-all duration-150 shadow-lg"
              >
                <Square className="h-6 w-6 text-white fill-white" />
              </button>
            ) : (
              <button
                onClick={handleStartCall}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-white hover:bg-neutral-200 active:scale-95 transition-all duration-150 shadow-lg"
              >
                <Mic className="h-6 w-6 text-black" />
              </button>
            )}
            <span className="text-[12px] text-t3 font-medium tracking-tight">
              {isCallActive ? "End Session" : "Start Session"}
            </span>
          </div>

          {/* Vapi Mute Control */}
          {platform === "vapi" && isCallActive && (
            <button
              onClick={vapi.toggleMute}
              className="px-4 py-1.5 rounded-pill border border-white/[0.08] hover:bg-white/[0.04] text-[12px] font-medium text-t2 transition-all duration-150 flex items-center space-x-1.5"
            >
              {vapi.isMuted ? (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-error" />
                  <span>Unmute Mic</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-live" />
                  <span>Mute Mic</span>
                </>
              )}
            </button>
          )}

          {micError && (
            <p className="text-[11px] font-mono text-error mt-2">
              {micError}
            </p>
          )}
        </div>

        {/* Right Column (40%): Live Transcript stream */}
        <div className="lg:col-span-4 flex flex-col space-y-4 border-t lg:border-t-0 lg:border-l border-white/[0.06] pt-6 lg:pt-0 lg:pl-8">
          <div className="flex items-center justify-between pb-2">
            <span className="label">Live Transcript</span>
            {isCallActive && (
              <div className="flex items-center gap-1">
                <div className="w-[5px] h-[5px] rounded-full bg-accent pulse-dot animate-pulse-dot" />
                <span className="text-[10px] text-accent font-semibold uppercase tracking-wider">Listening</span>
              </div>
            )}
          </div>

          <TranscriptPanel
            messages={transcript}
            placeholderText="Microphone transcript stream will display here..."
          />
        </div>
      </div>

      {/* Session Complete Banner */}
      {showSessionComplete && (
        <div className="border-t border-white/[0.06] mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-up">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-[15px] font-semibold text-t1">
                Session Complete!
              </h4>
              <p className="text-[13px] text-t3 mt-0.5 leading-normal">
                You have successfully completed your voice test session. Let's talk about building one for you.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => setShowSessionComplete(false)}
              className="w-full sm:w-auto px-4 py-2 text-[13px] font-medium text-t4 hover:text-t3 transition-colors duration-150"
            >
              Dismiss
            </button>
            <a
              href="https://calendly.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto text-center flex items-center justify-center space-x-2 px-5 py-2 rounded-pill text-[13px] font-medium text-t1 transition-all duration-150 active:scale-95"
              style={{ background: "#6366F1" }}
            >
              <Calendar className="h-4 w-4" />
              <span>Book a Call</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
