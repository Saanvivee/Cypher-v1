import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ScoringRequest {
  call_id: string;
  stress_score: number;
  stress_confidence: number;
  sentiment_score: number;
  urgency_indicators: string[];
  call_duration_seconds: number;
  claim_amount?: number;
  claim_type?: string;
  keywords: string[];
  intent: string;
}

interface ScoringResponse {
  stress: number;
  urgency: number;
  confidence: number;
  priority_score: number;
  urgency_level: "critical" | "high" | "medium" | "low";
  escalate: boolean;
  escalation_reason?: string;
  agent_guidance: string[];
  queue_position_weight: number;
}

const CLAIM_TYPE_WEIGHTS: Record<string, number> = {
  life: 1.0,
  health: 0.9,
  commercial: 0.8,
  home: 0.7,
  auto: 0.6,
  liability: 0.5,
};

const HIGH_PRIORITY_INTENTS = ["escalation_request", "appeal_denial", "file_claim"];
const CRITICAL_KEYWORDS = ["death", "hospital", "emergency", "injury", "homeless", "fire", "flood"];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: ScoringRequest = await req.json();

    const stressNorm = body.stress_score / 100;
    const sentimentNorm = ((-body.sentiment_score) + 1) / 2;
    const urgencyKeywordScore = Math.min(body.urgency_indicators.length / 5, 1.0);
    const claimTypeWeight = CLAIM_TYPE_WEIGHTS[body.claim_type || "auto"] || 0.6;
    const durationFactor = Math.min(body.call_duration_seconds / 900, 1.0);
    const intentBoost = HIGH_PRIORITY_INTENTS.includes(body.intent) ? 0.15 : 0;
    const criticalKeywordBoost = body.keywords.some(k => CRITICAL_KEYWORDS.includes(k)) ? 0.2 : 0;

    const urgency = Math.min(100, Math.round(
      (stressNorm * 0.3 +
        sentimentNorm * 0.2 +
        urgencyKeywordScore * 0.2 +
        claimTypeWeight * 0.1 +
        durationFactor * 0.1 +
        intentBoost +
        criticalKeywordBoost) * 100
    ));

    const stress = Math.round(body.stress_score);
    const confidence = Math.round((body.stress_confidence * 0.6 + 0.4) * 100);

    const priorityScore = Math.round(
      (urgency * 0.4 + stress * 0.35 + confidence * 0.15 + (claimTypeWeight * 100) * 0.1)
    );

    let urgencyLevel: ScoringResponse["urgency_level"];
    if (priorityScore >= 80) urgencyLevel = "critical";
    else if (priorityScore >= 60) urgencyLevel = "high";
    else if (priorityScore >= 35) urgencyLevel = "medium";
    else urgencyLevel = "low";

    const escalate = priorityScore >= 75 || body.intent === "escalation_request" || stress >= 85;
    let escalationReason: string | undefined;
    if (escalate) {
      if (body.intent === "escalation_request") escalationReason = "Customer explicitly requested supervisor";
      else if (stress >= 85) escalationReason = "Critical stress level detected";
      else escalationReason = "High priority score threshold exceeded";
    }

    const guidance: string[] = [];
    if (stress >= 70) guidance.push("Acknowledge frustration: 'I completely understand why you're upset, and I'm going to help you resolve this.'");
    if (urgency >= 60) guidance.push("Prioritize resolution speed – offer concrete next steps with specific timeframes.");
    if (body.intent === "appeal_denial") guidance.push("Review denial reasons carefully. Offer to initiate formal appeal process.");
    if (body.claim_type === "health" || body.claim_type === "life") guidance.push("Apply maximum empathy – this involves personal wellbeing.");
    if (durationFactor > 0.6) guidance.push("Call is running long – summarize progress and set clear expectations.");
    if (guidance.length === 0) guidance.push("Maintain professional and empathetic tone. Gather all necessary claim details.");

    const queueWeight = priorityScore / 100 + (urgencyLevel === "critical" ? 0.5 : 0);

    const response: ScoringResponse = {
      stress,
      urgency,
      confidence,
      priority_score: priorityScore,
      urgency_level: urgencyLevel,
      escalate,
      escalation_reason: escalationReason,
      agent_guidance: guidance,
      queue_position_weight: Math.round(queueWeight * 100) / 100,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
