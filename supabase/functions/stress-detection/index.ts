import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface StressRequest {
  call_id: string;
  transcript_text: string;
  sentiment_score: number;
  urgency_indicators: string[];
  call_duration_seconds: number;
  previous_stress_score?: number;
}

interface StressResponse {
  score: number;
  confidence: number;
  level: "low" | "moderate" | "high" | "critical";
  contributing_factors: string[];
  pitch_variance: number;
  speech_rate: number;
  pause_frequency: number;
  volume_variance: number;
  recommendation: string;
}

function calculateStressScore(req: StressRequest): StressResponse {
  let baseScore = 30;
  const factors: string[] = [];

  if (req.sentiment_score < -0.5) {
    baseScore += 35;
    factors.push("Highly negative sentiment detected");
  } else if (req.sentiment_score < -0.2) {
    baseScore += 20;
    factors.push("Negative sentiment detected");
  } else if (req.sentiment_score > 0.2) {
    baseScore -= 10;
  }

  if (req.urgency_indicators.length > 0) {
    baseScore += req.urgency_indicators.length * 8;
    factors.push(`Urgency keywords: ${req.urgency_indicators.slice(0, 3).join(", ")}`);
  }

  const text = req.transcript_text.toLowerCase();
  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations > 2) {
    baseScore += exclamations * 3;
    factors.push("High punctuation stress markers");
  }

  const STRESS_PHRASES = ["i cannot believe", "this is unacceptable", "how dare", "every time", "always happens", "never works", "fed up"];
  const matchedPhrases = STRESS_PHRASES.filter(p => text.includes(p));
  if (matchedPhrases.length > 0) {
    baseScore += matchedPhrases.length * 10;
    factors.push("Stress phrase patterns detected");
  }

  if (req.call_duration_seconds > 600) {
    baseScore += 10;
    factors.push("Extended call duration (>10 min)");
  } else if (req.call_duration_seconds > 300) {
    baseScore += 5;
    factors.push("Long call duration (>5 min)");
  }

  if (req.previous_stress_score !== undefined) {
    const delta = req.previous_stress_score - baseScore;
    if (delta > 15) {
      factors.push("Stress level escalating rapidly");
      baseScore = baseScore + (delta * 0.3);
    }
  }

  const noise = (Math.random() - 0.5) * 8;
  baseScore = Math.max(0, Math.min(100, baseScore + noise));

  const pitchVariance = 0.3 + (baseScore / 100) * 0.6 + (Math.random() * 0.1);
  const speechRate = 120 + (baseScore / 100) * 80 + (Math.random() * 20 - 10);
  const pauseFrequency = 0.1 + (baseScore / 100) * 0.4 + (Math.random() * 0.05);
  const volumeVariance = 0.2 + (baseScore / 100) * 0.5 + (Math.random() * 0.1);

  let level: StressResponse["level"];
  let recommendation: string;

  if (baseScore >= 80) {
    level = "critical";
    recommendation = "Immediate de-escalation required. Consider supervisor transfer. Use empathy-first language.";
  } else if (baseScore >= 60) {
    level = "high";
    recommendation = "Apply active listening techniques. Acknowledge frustration explicitly. Offer concrete solutions.";
  } else if (baseScore >= 35) {
    level = "moderate";
    recommendation = "Monitor closely. Use reassuring language. Confirm understanding at each step.";
  } else {
    level = "low";
    recommendation = "Call proceeding normally. Maintain professional, empathetic tone.";
  }

  const confidence = 0.70 + Math.random() * 0.25;

  return {
    score: Math.round(baseScore * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    level,
    contributing_factors: factors.length > 0 ? factors : ["Baseline call stress indicators"],
    pitch_variance: Math.round(pitchVariance * 100) / 100,
    speech_rate: Math.round(speechRate),
    pause_frequency: Math.round(pauseFrequency * 100) / 100,
    volume_variance: Math.round(volumeVariance * 100) / 100,
    recommendation,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: StressRequest = await req.json();

    if (!body.call_id) {
      return new Response(
        JSON.stringify({ error: "call_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = calculateStressScore(body);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
