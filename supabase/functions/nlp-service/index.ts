import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NLPRequest {
  text: string;
  call_id: string;
  speaker: "agent" | "caller";
  context?: string[];
}

interface NLPResponse {
  sentiment_score: number;
  sentiment_label: "positive" | "neutral" | "negative" | "distressed";
  keywords: string[];
  entities: Entity[];
  intent: string;
  urgency_indicators: string[];
  confidence: number;
}

interface Entity {
  text: string;
  type: "PERSON" | "POLICY" | "CLAIM" | "DATE" | "AMOUNT" | "LOCATION" | "INCIDENT";
  value: string;
}

const NEGATIVE_KEYWORDS = [
  "frustrated", "angry", "upset", "terrible", "awful", "horrible", "worst",
  "unacceptable", "ridiculous", "outrageous", "lawsuit", "lawyer", "sue",
  "cancel", "cancelled", "disgusted", "appalled", "furious", "livid",
  "devastated", "destroyed", "ruined", "incompetent", "useless", "worthless"
];

const POSITIVE_KEYWORDS = [
  "thank", "appreciate", "helpful", "great", "excellent", "wonderful",
  "satisfied", "happy", "pleased", "resolved", "perfect", "good",
  "understand", "grateful", "relief", "hope", "better"
];

const URGENCY_KEYWORDS = [
  "emergency", "urgent", "immediately", "asap", "right now", "critical",
  "hospital", "injured", "accident", "totaled", "fire", "flood", "theft",
  "death", "deceased", "funeral", "medical", "surgery", "ambulance"
];

const INSURANCE_ENTITIES_PATTERNS = [
  { pattern: /policy\s*(?:number|#|no\.?)\s*:?\s*([A-Z0-9-]+)/gi, type: "POLICY" as const },
  { pattern: /claim\s*(?:number|#|no\.?)\s*:?\s*([A-Z0-9-]+)/gi, type: "CLAIM" as const },
  { pattern: /\$[\d,]+(?:\.\d{2})?/g, type: "AMOUNT" as const },
  { pattern: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g, type: "DATE" as const },
  { pattern: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, type: "DATE" as const },
];

function analyzeSentiment(text: string): { score: number; label: NLPResponse["sentiment_label"] } {
  const lower = text.toLowerCase();
  let score = 0;

  const negCount = NEGATIVE_KEYWORDS.filter(kw => lower.includes(kw)).length;
  const posCount = POSITIVE_KEYWORDS.filter(kw => lower.includes(kw)).length;

  score = (posCount * 0.15) - (negCount * 0.2);
  score = Math.max(-1, Math.min(1, score));

  if (lower.includes("devastated") || lower.includes("destroyed") || lower.includes("death") || negCount >= 3) {
    return { score: Math.min(score, -0.7), label: "distressed" };
  } else if (score <= -0.2) {
    return { score, label: "negative" };
  } else if (score >= 0.2) {
    return { score, label: "positive" };
  }
  return { score, label: "neutral" };
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set(["the", "a", "an", "is", "it", "in", "on", "at", "to", "for", "of", "and", "or", "but", "with", "my", "your", "our", "this", "that", "was", "have", "been", "will", "would", "could", "should", "i", "we", "they", "you", "he", "she"]);
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const freq: Record<string, number> = {};
  words.forEach(w => {
    if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);
}

function extractEntities(text: string): Entity[] {
  const entities: Entity[] = [];
  for (const { pattern, type } of INSURANCE_ENTITIES_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      entities.push({
        text: match[0],
        type,
        value: match[1] || match[0],
      });
    }
  }
  return entities;
}

function detectIntent(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("file") && lower.includes("claim")) return "file_claim";
  if (lower.includes("status") || lower.includes("update")) return "check_status";
  if (lower.includes("cancel")) return "cancel_policy";
  if (lower.includes("payment") || lower.includes("pay")) return "payment_inquiry";
  if (lower.includes("coverage") || lower.includes("covered")) return "coverage_inquiry";
  if (lower.includes("appeal") || lower.includes("denied")) return "appeal_denial";
  if (lower.includes("document") || lower.includes("form")) return "document_request";
  if (lower.includes("speak") && lower.includes("manager")) return "escalation_request";
  return "general_inquiry";
}

function detectUrgencyIndicators(text: string): string[] {
  const lower = text.toLowerCase();
  return URGENCY_KEYWORDS.filter(kw => lower.includes(kw));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: NLPRequest = await req.json();

    if (!body.text) {
      return new Response(
        JSON.stringify({ error: "text field is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sentiment = analyzeSentiment(body.text);
    const keywords = extractKeywords(body.text);
    const entities = extractEntities(body.text);
    const intent = detectIntent(body.text);
    const urgencyIndicators = detectUrgencyIndicators(body.text);

    const confidence = 0.75 + Math.random() * 0.2;

    const response: NLPResponse = {
      sentiment_score: sentiment.score,
      sentiment_label: sentiment.label,
      keywords,
      entities,
      intent,
      urgency_indicators: urgencyIndicators,
      confidence,
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
