import { Phone, PhoneOff, Pause, Volume2, UserPlus, Clock, Mic, MicOff } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { formatDuration } from "../../lib/mockData";
import { useAudioAnalysis } from "../../hooks/useAudioAnalysis";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import type { Call, ClaimType } from "../../types";
import { CALLER_NAMES, CALLER_PHONES, CLAIM_TYPES } from "../../lib/mockData";

export default function CallControls() {
  const { state, dispatch, notify } = useApp();
  const { agent } = useAuth();
  const { call } = state.activeCall;
  const { isRecording, startRecording, stopRecording, audioMetrics } = useAudioAnalysis();
  const [isStartingCall, setIsStartingCall] = useState(false);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationCountRef = useRef(0);

  const startCall = useCallback(async () => {
    setIsStartingCall(true);
    
    const callerName = CALLER_NAMES[Math.floor(Math.random() * CALLER_NAMES.length)];
    const callerPhone = CALLER_PHONES[Math.floor(Math.random() * CALLER_PHONES.length)];
    const claimType = CLAIM_TYPES[Math.floor(Math.random() * CLAIM_TYPES.length)] as ClaimType;
    const callId = `live_${Date.now()}`;

    const newCall: Call = {
      id: callId,
      agent_id: agent?.id ?? null,
      claim_id: null,
      caller_name: callerName,
      caller_phone: callerPhone,
      status: "active",
      stress_level: 20,
      urgency_score: 15,
      confidence_score: 85,
      sentiment: "neutral",
      duration_seconds: 0,
      resolution_notes: "",
      started_at: new Date().toISOString(),
      ended_at: null,
      created_at: new Date().toISOString(),
    };

    dispatch({ type: "SET_ACTIVE_CALL", payload: newCall });

    if (agent?.status !== "on_call") {
      await supabase.from("agents").update({ status: "on_call" }).eq("id", agent?.id ?? "").select();
    }

    // Start duration timer
    durationCountRef.current = 0;
    durationRef.current = setInterval(() => {
      durationCountRef.current += 1;
      dispatch({ type: "UPDATE_CALL_METRICS", payload: { duration_seconds: durationCountRef.current } });
    }, 1000);

    // Start live audio recording
    try {
      await startRecording(callId, claimType);
      notify(`Live call started - Speak to begin transcription`, "info");
    } catch (err) {
      notify("Audio recording failed - using simulation mode", "warning");
    }

    setIsStartingCall(false);
  }, [agent, dispatch, notify, startRecording]);

  const endCall = useCallback(async () => {
    if (durationRef.current) {
      clearInterval(durationRef.current);
      durationRef.current = null;
    }

    stopRecording();
    dispatch({ type: "END_CALL" });

    if (agent?.id) {
      await supabase.from("agents").update({ status: "available" }).eq("id", agent.id).select();
    }

    notify("Call ended. Summary saved.", "success");
  }, [agent, dispatch, notify, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationRef.current) {
        clearInterval(durationRef.current);
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-3">
      {!call ? (
        <button
          onClick={startCall}
          disabled={isStartingCall}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2d6a4f] hover:bg-[#40916c] disabled:opacity-50 text-white font-semibold text-sm transition-all duration-150 shadow-lg shadow-[#2d6a4f]/30 hover:shadow-[#40916c]/40 hover:-translate-y-px active:translate-y-0"
        >
          <Phone className="w-4 h-4" />
          {isStartingCall ? "Starting..." : "Start Live Call"}
        </button>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700/50">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#95d5b2] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2d6a4f]" />
            </span>
            <span className="text-white text-sm font-medium">{call.caller_name}</span>
            <span className="text-slate-500 text-xs">·</span>
            <span className="text-slate-400 text-sm flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(call.duration_seconds)}
            </span>
          </div>

          {/* Recording indicator */}
          <div className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border ${
            isRecording 
              ? "bg-[#2d6a4f]/10 border-[#2d6a4f]/50" 
              : "bg-slate-800 border-slate-700/50"
          }`}>
            {isRecording ? (
              <>
                <Mic className="w-4 h-4 text-[#95d5b2] animate-pulse" />
                <span className="text-[#95d5b2] text-xs font-medium">Recording</span>
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400 text-xs">No Audio</span>
              </>
            )}
          </div>

          {/* Audio metrics display */}
          {isRecording && audioMetrics.speakingRate > 0 && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700/50">
              <span className="text-slate-400 text-xs">{audioMetrics.speakingRate} WPM</span>
              {audioMetrics.stressIndicators.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>
          )}

          <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white text-sm transition-all">
            <Volume2 className="w-4 h-4" />
          </button>

          <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white text-sm transition-all">
            <Pause className="w-4 h-4" />
          </button>

          <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white text-sm transition-all">
            <UserPlus className="w-4 h-4" />
            <span>Transfer</span>
          </button>

          <button
            onClick={endCall}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all duration-150 shadow-lg shadow-red-600/30 hover:shadow-red-500/40"
          >
            <PhoneOff className="w-4 h-4" />
            End Call
          </button>
        </div>
      )}
    </div>
  );
}
