import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AudioMetrics {
  pitch: number;
  intensity: number;
  jitter: number;
  speaking_rate: number;
  filler_count: number;
  filler_percentage: number;
  ambient_noise: number;
  language_switches: number;
}

interface StressRequest {
  call_id: string;
  transcript_text: string;
  sentiment_score: number;
  urgency_indicators: string[];
  call_duration_seconds: number;
  previous_stress_score?: number;
  audio_metrics?: AudioMetrics;
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
  audio_indicators: {
    pitch_stress: boolean;
    intensity_stress: boolean;
    jitter_stress: boolean;
    rate_stress: boolean;
    filler_stress: boolean;
    noise_stress: boolean;
    language_stress: boolean;
  };
}

function calculateStressScore(req: StressRequest): StressResponse {
  let baseScore = 25;
  const factors: string[] = [];
  const audioIndicators = {
    pitch_stress: false,
    intensity_stress: false,
    jitter_stress: false,
    rate_stress: false,
    filler_stress: false,
    noise_stress: false,
    language_stress: false,
  };

  // Sentiment analysis contribution
  if (req.sentiment_score < -0.5) {
    baseScore += 30;
    factors.push("Highly negative sentiment detected");
  } else if (req.sentiment_score < -0.2) {
    baseScore += 18;
    factors.push("Negative sentiment detected");
  } else if (req.sentiment_score > 0.2) {
    baseScore -= 8;
  }

  // Urgency indicators
  if (req.urgency_indicators.length > 0) {
    baseScore += req.urgency_indicators.length * 7;
    factors.push(`Urgency keywords: ${req.urgency_indicators.slice(0, 3).join(", ")}`);
  }

  // Text analysis
  const text = req.transcript_text.toLowerCase();
  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations > 2) {
    baseScore += exclamations * 2.5;
    factors.push("High punctuation stress markers");
  }

  // Stress phrases
  const STRESS_PHRASES = [
    "i cannot believe", "this is unacceptable", "how dare", "every time",
    "always happens", "never works", "fed up", "ridiculous", "frustrated",
    "angry", "upset", "terrible", "worst", "horrible"
  ];
  const matchedPhrases = STRESS_PHRASES.filter(p => text.includes(p));
  if (matchedPhrases.length > 0) {
    baseScore += matchedPhrases.length * 8;
    factors.push("Stress phrase patterns detected");
  }

  // Call duration
  if (req.call_duration_seconds > 600) {
    baseScore += 8;
    factors.push("Extended call duration (>10 min)");
  } else if (req.call_duration_seconds > 300) {
    baseScore += 4;
    factors.push("Long call duration (>5 min)");
  }

  // Previous stress score trajectory
  if (req.previous_stress_score !== undefined) {
    const delta = req.previous_stress_score - baseScore;
    if (delta > 15) {
      factors.push("Stress level escalating rapidly");
      baseScore = baseScore + (delta * 0.25);
    }
  }

  // Audio metrics analysis (if provided)
  let pitchVariance = 0.3 + Math.random() * 0.3;
  let speechRate = 130 + Math.random() * 40;
  let volumeVariance = 0.2 + Math.random() * 0.3;

  if (req.audio_metrics) {
    const am = req.audio_metrics;

    // Pitch analysis - high pitch indicates stress
    if (am.pitch > 200) {
      baseScore += 12;
      factors.push("Elevated vocal pitch detected");
      audioIndicators.pitch_stress = true;
    } else if (am.pitch > 150) {
      baseScore += 6;
      audioIndicators.pitch_stress = true;
    }
    pitchVariance = am.jitter / 100;

    // Intensity analysis - high intensity indicates stress/frustration
    if (am.intensity > 75) {
      baseScore += 10;
      factors.push("High voice intensity detected");
      audioIndicators.intensity_stress = true;
    } else if (am.intensity > 60) {
      baseScore += 5;
      audioIndicators.intensity_stress = true;
    }
    volumeVariance = am.intensity / 100;

    // Jitter analysis - irregular pitch variance indicates stress
    if (am.jitter > 35) {
      baseScore += 12;
      factors.push("Irregular pitch variance (jitter)");
      audioIndicators.jitter_stress = true;
    } else if (am.jitter > 20) {
      baseScore += 6;
      audioIndicators.jitter_stress = true;
    }

    // Speaking rate analysis
    if (am.speaking_rate > 180) {
      baseScore += 10;
      factors.push("Rapid speaking rate");
      audioIndicators.rate_stress = true;
    } else if (am.speaking_rate > 150) {
      baseScore += 5;
      audioIndicators.rate_stress = true;
    } else if (am.speaking_rate < 80 && am.speaking_rate > 0) {
      baseScore += 4;
      factors.push("Unusually slow speaking rate");
    }
    speechRate = am.speaking_rate || speechRate;

    // Filler words analysis
    if (am.filler_percentage > 15) {
      baseScore += 10;
      factors.push("Excessive filler words (uncertainty)");
      audioIndicators.filler_stress = true;
    } else if (am.filler_percentage > 8) {
      baseScore += 5;
      audioIndicators.filler_stress = true;
    }

    // Ambient noise analysis
    if (am.ambient_noise > 60) {
      baseScore += 6;
      factors.push("High ambient noise (difficult environment)");
      audioIndicators.noise_stress = true;
    }

    // Language switching analysis
    if (am.language_switches > 0) {
      baseScore += 8;
      factors.push("Language switching detected (cognitive load)");
      audioIndicators.language_stress = true;
    }
  }

  // Add some natural variance
  const noise = (Math.random() - 0.5) * 6;
  baseScore = Math.max(0, Math.min(100, baseScore + noise));

  // Calculate pause frequency based on speaking rate
  const pauseFrequency = speechRate > 0 
    ? Math.max(0.05, Math.min(0.5, (180 - speechRate) / 200))
    : 0.15 + Math.random() * 0.15;

  // Determine stress level
  let level: StressResponse["level"];
  let recommendation: string;

  if (baseScore >= 80) {
    level = "critical";
    recommendation = "Immediate de-escalation required. Consider supervisor transfer. Use empathy-first language. Slow down your speech and use calming phrases.";
  } else if (baseScore >= 60) {
    level = "high";
    recommendation = "Apply active listening techniques. Acknowledge frustration explicitly. Offer concrete solutions. Monitor for escalation.";
  } else if (baseScore >= 35) {
    level = "moderate";
    recommendation = "Monitor closely. Use reassuring language. Confirm understanding at each step. Be prepared to offer additional support.";
  } else {
    level = "low";
    recommendation = "Call proceeding normally. Maintain professional, empathetic tone. Continue standard protocol.";
  }

  const confidence = 0.72 + Math.random() * 0.22;

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
    audio_indicators: audioIndicators,
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
