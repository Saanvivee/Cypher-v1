import { useCallback, useRef, useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { callEdgeFunction } from "../lib/supabase";
import type { 
  Transcript, StressMetric, SuggestedQuestion, 
  NLPResult, StressResult, ScoringResult, ClaimType 
} from "../types";

// Filler words to detect
const FILLER_WORDS = [
  "um", "uh", "like", "you know", "actually", "basically", "literally",
  "so", "well", "i mean", "right", "okay so", "hmm", "ah", "er"
];

// Language patterns to detect switching
const LANGUAGE_PATTERNS = {
  english: /^[a-zA-Z\s.,!?'-]+$/,
  spanish: /[ñáéíóú¿¡]/i,
  french: /[àâäéèêëîïôùûüÿç]/i,
};

export interface AudioMetrics {
  pitch: number;
  intensity: number;
  jitter: number;
  speakingRate: number; // words per minute
  fillerCount: number;
  fillerPercentage: number;
  ambientNoise: number;
  languageSwitches: number;
  stressIndicators: string[];
}

export interface LiveAudioState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  interimTranscript: string;
  audioMetrics: AudioMetrics;
  error: string | null;
}

let transcriptIdCounter = 1000;
let stressIdCounter = 1000;
let questionIdCounter = 1000;

export function useAudioAnalysis() {
  const { dispatch, notify } = useApp();
  const [state, setState] = useState<LiveAudioState>({
    isRecording: false,
    isProcessing: false,
    transcript: "",
    interimTranscript: "",
    audioMetrics: {
      pitch: 0,
      intensity: 0,
      jitter: 0,
      speakingRate: 0,
      fillerCount: 0,
      fillerPercentage: 0,
      ambientNoise: 0,
      languageSwitches: 0,
      stressIndicators: [],
    },
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wordTimestampsRef = useRef<number[]>([]);
  const previousPitchRef = useRef<number[]>([]);
  const languageHistoryRef = useRef<string[]>([]);
  const totalWordsRef = useRef<number>(0);
  const fillerWordsRef = useRef<number>(0);
  const callIdRef = useRef<string | null>(null);
  const claimTypeRef = useRef<ClaimType>("auto");

  // Detect fillers in text
  const countFillers = useCallback((text: string): number => {
    const lowerText = text.toLowerCase();
    let count = 0;
    FILLER_WORDS.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, "gi");
      const matches = lowerText.match(regex);
      if (matches) count += matches.length;
    });
    return count;
  }, []);

  // Detect language of text segment
  const detectLanguage = useCallback((text: string): string => {
    if (LANGUAGE_PATTERNS.spanish.test(text)) return "spanish";
    if (LANGUAGE_PATTERNS.french.test(text)) return "french";
    return "english";
  }, []);

  // Process transcript and generate questions
  const processTranscript = useCallback(async (
    text: string,
    speaker: "agent" | "caller",
    metrics: AudioMetrics
  ) => {
    if (!callIdRef.current || !text.trim()) return;

    setState(prev => ({ ...prev, isProcessing: true }));
    dispatch({ type: "SET_PROCESSING", payload: true });

    try {
      // Call NLP service
      const nlp = await callEdgeFunction<NLPResult>("nlp-service", {
        call_id: callIdRef.current,
        text,
        speaker,
      });
      dispatch({ type: "SET_NLP_RESULT", payload: nlp });

      // Enhanced stress detection with audio metrics
      const stressRes = await callEdgeFunction<StressResult>("stress-detection", {
        call_id: callIdRef.current,
        transcript_text: text,
        sentiment_score: nlp.sentiment_score,
        urgency_indicators: nlp.urgency_indicators,
        call_duration_seconds: 0,
        // Enhanced audio metrics
        audio_metrics: {
          pitch: metrics.pitch,
          intensity: metrics.intensity,
          jitter: metrics.jitter,
          speaking_rate: metrics.speakingRate,
          filler_count: metrics.fillerCount,
          filler_percentage: metrics.fillerPercentage,
          ambient_noise: metrics.ambientNoise,
          language_switches: metrics.languageSwitches,
        },
      });
      dispatch({ type: "SET_STRESS_RESULT", payload: stressRes });

      // Scoring engine
      const scoring = await callEdgeFunction<ScoringResult>("scoring-engine", {
        call_id: callIdRef.current,
        stress_score: stressRes.score,
        stress_confidence: stressRes.confidence,
        sentiment_score: nlp.sentiment_score,
        urgency_indicators: nlp.urgency_indicators,
        call_duration_seconds: 0,
        keywords: nlp.keywords,
        intent: nlp.intent,
      });
      dispatch({ type: "SET_SCORING_RESULT", payload: scoring });
      dispatch({ type: "SET_AGENT_GUIDANCE", payload: scoring.agent_guidance });

      // Update call metrics
      dispatch({
        type: "UPDATE_CALL_METRICS",
        payload: {
          stress_level: scoring.stress,
          urgency_score: scoring.urgency,
          confidence_score: scoring.confidence,
          sentiment: nlp.sentiment_label,
        },
      });

      // Add transcript
      const transcript: Transcript = {
        id: `t_${++transcriptIdCounter}`,
        call_id: callIdRef.current,
        speaker,
        text,
        sentiment_score: nlp.sentiment_score,
        keywords: nlp.keywords,
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: "ADD_TRANSCRIPT", payload: transcript });

      // Add stress metric with enhanced audio data
      const stressMetric: StressMetric = {
        id: `s_${++stressIdCounter}`,
        call_id: callIdRef.current,
        score: stressRes.score,
        confidence: stressRes.confidence,
        pitch_variance: metrics.jitter,
        speech_rate: metrics.speakingRate,
        pause_frequency: stressRes.pause_frequency,
        volume_variance: metrics.intensity / 100,
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: "ADD_STRESS_METRIC", payload: stressMetric });

      // Generate questions based on transcript
      const questionsRes = await callEdgeFunction<{
        questions: Array<{ question: string; priority: number; category: string; reason: string }>;
      }>("question-generator", {
        call_id: callIdRef.current,
        claim_type: claimTypeRef.current,
        intent: nlp.intent,
        keywords: nlp.keywords,
        urgency_indicators: nlp.urgency_indicators,
        stress_level: stressRes.level,
        transcript_summary: text,
      });

      const questions: SuggestedQuestion[] = questionsRes.questions.map(q => ({
        id: `q_${++questionIdCounter}`,
        call_id: callIdRef.current!,
        question: q.question,
        priority: q.priority,
        category: q.category as SuggestedQuestion["category"],
        reason: q.reason,
        is_answered: false,
        created_at: new Date().toISOString(),
      }));
      dispatch({ type: "SET_QUESTIONS", payload: questions });

      // Notify on high stress
      if (scoring.urgency_level === "critical" || scoring.escalate) {
        notify("High stress detected - consider supervisor escalation", "warning");
      }

    } catch (err) {
      console.error("[v0] Error processing transcript:", err);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
      dispatch({ type: "SET_PROCESSING", payload: false });
    }
  }, [dispatch, notify]);

  // Analyze audio stream for metrics
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeData = new Float32Array(bufferLength);

    const analyze = () => {
      analyser.getByteFrequencyData(dataArray);
      analyser.getFloatTimeDomainData(timeData);

      // Calculate intensity (RMS)
      let sum = 0;
      for (let i = 0; i < timeData.length; i++) {
        sum += timeData[i] * timeData[i];
      }
      const rms = Math.sqrt(sum / timeData.length);
      const intensity = Math.min(100, rms * 200);

      // Estimate pitch using autocorrelation
      let pitch = 0;
      const sampleRate = audioContextRef.current?.sampleRate || 44100;
      let maxCorrelation = 0;
      let bestLag = 0;

      for (let lag = 20; lag < 500; lag++) {
        let correlation = 0;
        for (let i = 0; i < timeData.length - lag; i++) {
          correlation += timeData[i] * timeData[i + lag];
        }
        if (correlation > maxCorrelation) {
          maxCorrelation = correlation;
          bestLag = lag;
        }
      }

      if (bestLag > 0 && maxCorrelation > 0.1) {
        pitch = sampleRate / bestLag;
        if (pitch < 50 || pitch > 500) pitch = 0;
      }

      // Calculate jitter (pitch variance)
      let jitter = 0;
      if (pitch > 0) {
        previousPitchRef.current.push(pitch);
        if (previousPitchRef.current.length > 10) {
          previousPitchRef.current.shift();
        }
        if (previousPitchRef.current.length > 1) {
          const pitches = previousPitchRef.current;
          const avgPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length;
          const variance = pitches.reduce((a, b) => a + Math.pow(b - avgPitch, 2), 0) / pitches.length;
          jitter = Math.min(100, Math.sqrt(variance) / avgPitch * 100);
        }
      }

      // Estimate ambient noise from low frequencies
      let ambientSum = 0;
      for (let i = 0; i < 10; i++) {
        ambientSum += dataArray[i];
      }
      const ambientNoise = Math.min(100, ambientSum / 10 / 2.55);

      // Calculate speaking rate
      const now = Date.now();
      const recentWords = wordTimestampsRef.current.filter(t => now - t < 60000);
      const speakingRate = recentWords.length;

      // Calculate filler percentage
      const fillerPercentage = totalWordsRef.current > 0 
        ? (fillerWordsRef.current / totalWordsRef.current) * 100 
        : 0;

      // Build stress indicators
      const stressIndicators: string[] = [];
      if (pitch > 200) stressIndicators.push("Elevated pitch");
      if (jitter > 30) stressIndicators.push("Irregular pitch variance");
      if (intensity > 70) stressIndicators.push("High voice intensity");
      if (speakingRate > 180) stressIndicators.push("Rapid speaking rate");
      if (fillerPercentage > 10) stressIndicators.push("Frequent filler words");
      if (languageHistoryRef.current.length > 1) {
        const uniqueLangs = new Set(languageHistoryRef.current);
        if (uniqueLangs.size > 1) stressIndicators.push("Language switching detected");
      }
      if (ambientNoise > 50) stressIndicators.push("High ambient noise");

      setState(prev => ({
        ...prev,
        audioMetrics: {
          pitch: Math.round(pitch),
          intensity: Math.round(intensity),
          jitter: Math.round(jitter * 10) / 10,
          speakingRate,
          fillerCount: fillerWordsRef.current,
          fillerPercentage: Math.round(fillerPercentage * 10) / 10,
          ambientNoise: Math.round(ambientNoise),
          languageSwitches: new Set(languageHistoryRef.current).size - 1,
          stressIndicators,
        },
      }));

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  }, []);

  // Start recording
  const startRecording = useCallback(async (callId: string, claimType: ClaimType = "auto") => {
    callIdRef.current = callId;
    claimTypeRef.current = claimType;
    wordTimestampsRef.current = [];
    previousPitchRef.current = [];
    languageHistoryRef.current = ["english"];
    totalWordsRef.current = 0;
    fillerWordsRef.current = 0;

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      streamRef.current = stream;

      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Start audio analysis loop
      analyzeAudio();

      // Set up speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error("Speech recognition not supported in this browser");
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
            
            // Track words for speaking rate
            const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);
            const now = Date.now();
            words.forEach(() => wordTimestampsRef.current.push(now));
            totalWordsRef.current += words.length;
            
            // Track fillers
            const newFillers = countFillers(transcript);
            fillerWordsRef.current += newFillers;

            // Detect language
            const lang = detectLanguage(transcript);
            if (lang !== languageHistoryRef.current[languageHistoryRef.current.length - 1]) {
              languageHistoryRef.current.push(lang);
            }
          } else {
            interim += transcript;
          }
        }

        setState(prev => ({
          ...prev,
          interimTranscript: interim,
        }));

        if (final) {
          setState(prev => ({
            ...prev,
            transcript: prev.transcript + " " + final,
          }));
          
          // Process the final transcript
          processTranscript(final, "caller", state.audioMetrics);
        }
      };

      recognition.onerror = (event) => {
        console.error("[v0] Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          setState(prev => ({ ...prev, error: `Speech recognition error: ${event.error}` }));
        }
      };

      recognition.onend = () => {
        // Restart if still recording
        if (state.isRecording && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            // Already started, ignore
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

      setState(prev => ({
        ...prev,
        isRecording: true,
        error: null,
        transcript: "",
        interimTranscript: "",
      }));

      notify("Live audio recording started", "info");

    } catch (err) {
      console.error("[v0] Error starting recording:", err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to start recording",
      }));
      notify("Failed to start audio recording", "error");
    }
  }, [analyzeAudio, countFillers, detectLanguage, notify, processTranscript, state.audioMetrics, state.isRecording]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    analyserRef.current = null;
    callIdRef.current = null;

    setState(prev => ({
      ...prev,
      isRecording: false,
    }));

    notify("Audio recording stopped", "info");
  }, [notify]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
  };
}

// Add SpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
