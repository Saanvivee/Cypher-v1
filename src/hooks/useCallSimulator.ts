import { useCallback, useRef } from "react";
import { supabase, callEdgeFunction } from "../lib/supabase";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import type {
  Call, Transcript, StressMetric, SuggestedQuestion,
  NLPResult, StressResult, ScoringResult, ClaimType,
} from "../types";
import {
  CALLER_NAMES, CALLER_PHONES, CLAIM_TYPES, getRandomScript,
} from "../lib/mockData";

let transcriptIdCounter = 0;
let stressIdCounter = 0;
let questionIdCounter = 0;

export function useCallSimulator() {
  const { dispatch, notify } = useApp();
  const { agent } = useAuth();
  const simulatorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scriptRef = useRef<string[][]>([]);
  const scriptIndexRef = useRef(0);
  const callIdRef = useRef<string | null>(null);
  const durationRef2 = useRef(0);

  const stopSimulator = useCallback(() => {
    if (simulatorRef.current) clearInterval(simulatorRef.current);
    if (durationRef.current) clearInterval(durationRef.current);
    simulatorRef.current = null;
    durationRef.current = null;
  }, []);

  const processTranscriptChunk = useCallback(async (
    callId: string,
    text: string,
    speaker: "agent" | "caller",
    prevStress?: number
  ) => {
    dispatch({ type: "SET_PROCESSING", payload: true });

    try {
      const nlp = await callEdgeFunction<NLPResult>("nlp-service", {
        call_id: callId,
        text,
        speaker,
      });
      dispatch({ type: "SET_NLP_RESULT", payload: nlp });

      const stressRes = await callEdgeFunction<StressResult>("stress-detection", {
        call_id: callId,
        transcript_text: text,
        sentiment_score: nlp.sentiment_score,
        urgency_indicators: nlp.urgency_indicators,
        call_duration_seconds: durationRef2.current,
        previous_stress_score: prevStress,
      });
      dispatch({ type: "SET_STRESS_RESULT", payload: stressRes });

      const scoring = await callEdgeFunction<ScoringResult>("scoring-engine", {
        call_id: callId,
        stress_score: stressRes.score,
        stress_confidence: stressRes.confidence,
        sentiment_score: nlp.sentiment_score,
        urgency_indicators: nlp.urgency_indicators,
        call_duration_seconds: durationRef2.current,
        keywords: nlp.keywords,
        intent: nlp.intent,
      });
      dispatch({ type: "SET_SCORING_RESULT", payload: scoring });
      dispatch({ type: "SET_AGENT_GUIDANCE", payload: scoring.agent_guidance });

      dispatch({
        type: "UPDATE_CALL_METRICS",
        payload: {
          stress_level: scoring.stress,
          urgency_score: scoring.urgency,
          confidence_score: scoring.confidence,
          sentiment: nlp.sentiment_label,
        },
      });

      const transcript: Transcript = {
        id: `t_${++transcriptIdCounter}`,
        call_id: callId,
        speaker,
        text,
        sentiment_score: nlp.sentiment_score,
        keywords: nlp.keywords,
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: "ADD_TRANSCRIPT", payload: transcript });

      const stress: StressMetric = {
        id: `s_${++stressIdCounter}`,
        call_id: callId,
        score: stressRes.score,
        confidence: stressRes.confidence,
        pitch_variance: stressRes.pitch_variance,
        speech_rate: stressRes.speech_rate,
        pause_frequency: stressRes.pause_frequency,
        volume_variance: stressRes.volume_variance,
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: "ADD_STRESS_METRIC", payload: stress });

      if (scoring.urgency_level === "critical" || scoring.escalate) {
        notify(`High stress detected — consider supervisor escalation`, "warning");
      }

      return { nlp, stressRes, scoring };
    } catch {
      return null;
    } finally {
      dispatch({ type: "SET_PROCESSING", payload: false });
    }
  }, [dispatch, notify]);

  const loadQuestions = useCallback(async (
    callId: string,
    claimType: string,
    nlp: NLPResult,
    stressLevel: StressResult["level"]
  ) => {
    try {
      const res = await callEdgeFunction<{ questions: Array<{ question: string; priority: number; category: string; reason: string }> }>(
        "question-generator",
        {
          call_id: callId,
          claim_type: claimType,
          intent: nlp.intent,
          keywords: nlp.keywords,
          urgency_indicators: nlp.urgency_indicators,
          stress_level: stressLevel,
          transcript_summary: "",
        }
      );
      const questions: SuggestedQuestion[] = res.questions.map(q => ({
        id: `q_${++questionIdCounter}`,
        call_id: callId,
        question: q.question,
        priority: q.priority,
        category: q.category as SuggestedQuestion["category"],
        reason: q.reason,
        is_answered: false,
        created_at: new Date().toISOString(),
      }));
      dispatch({ type: "SET_QUESTIONS", payload: questions });
    } catch {
      /* silent */
    }
  }, [dispatch]);

  const startCall = useCallback(async () => {
    const callerName = CALLER_NAMES[Math.floor(Math.random() * CALLER_NAMES.length)];
    const callerPhone = CALLER_PHONES[Math.floor(Math.random() * CALLER_PHONES.length)];
    const claimType = CLAIM_TYPES[Math.floor(Math.random() * CLAIM_TYPES.length)] as ClaimType;
    const script = getRandomScript(claimType);
    const callId = `demo_${Date.now()}`;

    scriptRef.current = script;
    scriptIndexRef.current = 0;
    callIdRef.current = callId;
    durationRef2.current = 0;

    const call: Call = {
      id: callId,
      agent_id: agent?.id ?? null,
      claim_id: null,
      caller_name: callerName,
      caller_phone: callerPhone,
      status: "active",
      stress_level: 25,
      urgency_score: 20,
      confidence_score: 80,
      sentiment: "neutral",
      duration_seconds: 0,
      resolution_notes: "",
      started_at: new Date().toISOString(),
      ended_at: null,
      created_at: new Date().toISOString(),
    };

    dispatch({ type: "SET_ACTIVE_CALL", payload: call });

    if (agent?.status !== "on_call") {
      await supabase.from("agents").update({ status: "on_call" }).eq("id", agent?.id ?? "").select();
    }

    durationRef.current = setInterval(() => {
      durationRef2.current += 1;
      dispatch({ type: "UPDATE_CALL_METRICS", payload: { duration_seconds: durationRef2.current } });
    }, 1000);

    let prevStress: number | undefined;

    const processNext = async () => {
      if (scriptIndexRef.current >= script.length) {
        stopSimulator();
        return;
      }
      const [speaker, text] = script[scriptIndexRef.current] as [string, string];
      scriptIndexRef.current += 1;

      const result = await processTranscriptChunk(
        callId,
        text,
        speaker as "agent" | "caller",
        prevStress
      );

      if (result) {
        prevStress = result.stressRes.score;
        if (scriptIndexRef.current === 2) {
          await loadQuestions(callId, claimType, result.nlp, result.stressRes.level);
        }
      }
    };

    await processNext();
    simulatorRef.current = setInterval(processNext, 4500);

    notify(`Incoming call from ${callerName} — ${claimType.toUpperCase()} claim`, "info");
  }, [agent, dispatch, notify, processTranscriptChunk, loadQuestions, stopSimulator]);

  const endCall = useCallback(async () => {
    stopSimulator();
    dispatch({ type: "END_CALL" });

    if (agent?.id) {
      await supabase.from("agents").update({ status: "available" }).eq("id", agent.id).select();
    }

    notify("Call ended. Summary saved.", "success");
  }, [agent, dispatch, notify, stopSimulator]);

  return { startCall, endCall };
}
