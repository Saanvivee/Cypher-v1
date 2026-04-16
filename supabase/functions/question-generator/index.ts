import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface QuestionRequest {
  call_id: string;
  claim_type: string;
  intent: string;
  keywords: string[];
  urgency_indicators: string[];
  stress_level: "low" | "moderate" | "high" | "critical";
  transcript_summary: string;
  missing_fields?: string[];
}

interface GeneratedQuestion {
  question: string;
  priority: number;
  category: string;
  reason: string;
}

const QUESTION_BANKS: Record<string, GeneratedQuestion[]> = {
  verification: [
    { question: "Can you please confirm your full name and date of birth for verification?", priority: 10, category: "verification", reason: "Identity verification required before proceeding" },
    { question: "What is the policy number associated with your account?", priority: 9, category: "verification", reason: "Policy lookup needed" },
    { question: "Can you confirm the address on file for your policy?", priority: 8, category: "verification", reason: "Address verification for claim processing" },
  ],
  auto: [
    { question: "Were there any injuries involved in the incident?", priority: 9, category: "incident", reason: "Injury assessment determines claim priority" },
    { question: "Do you have the other driver's insurance information?", priority: 8, category: "claim_details", reason: "Third-party information needed for liability assessment" },
    { question: "Has the vehicle been towed or is it still at the scene?", priority: 7, category: "incident", reason: "Vehicle location impacts immediate assistance" },
    { question: "Was a police report filed? If so, do you have the report number?", priority: 8, category: "documents", reason: "Police report required for auto claims" },
    { question: "Can you describe the damage to the vehicle in detail?", priority: 7, category: "claim_details", reason: "Damage assessment needed for estimate" },
    { question: "Are you currently in a safe location?", priority: 10, category: "incident", reason: "Customer safety is the immediate priority" },
  ],
  home: [
    { question: "Is the property currently habitable, or do you need emergency housing?", priority: 10, category: "incident", reason: "Displacement affects immediate assistance needed" },
    { question: "When did the damage occur and what caused it?", priority: 9, category: "incident", reason: "Date and cause determine coverage applicability" },
    { question: "Have you taken any emergency measures to prevent further damage?", priority: 8, category: "incident", reason: "Mitigation efforts affect claim assessment" },
    { question: "Do you have photos or videos of the damage?", priority: 7, category: "documents", reason: "Visual documentation strengthens the claim" },
    { question: "Have any contractors provided estimates yet?", priority: 6, category: "documents", reason: "Existing estimates speed up the claims process" },
  ],
  health: [
    { question: "What was the date of the medical procedure or treatment?", priority: 9, category: "claim_details", reason: "Date of service needed for coverage verification" },
    { question: "Do you have the Explanation of Benefits from your provider?", priority: 8, category: "documents", reason: "EOB required for health claim processing" },
    { question: "Was this treatment planned or an emergency?", priority: 8, category: "incident", reason: "Emergency vs. elective affects coverage assessment" },
    { question: "What is the name and NPI number of the treating physician?", priority: 7, category: "claim_details", reason: "Provider details needed for claim validation" },
    { question: "Have you received any prior authorization for this treatment?", priority: 8, category: "coverage", reason: "Prior auth status affects claim approval" },
  ],
  life: [
    { question: "I'm deeply sorry for your loss. Can you provide the date of passing?", priority: 10, category: "empathy", reason: "Compassionate acknowledgment and critical information" },
    { question: "Do you have a copy of the death certificate?", priority: 9, category: "documents", reason: "Death certificate is the primary required document" },
    { question: "Are you the named beneficiary on the policy?", priority: 9, category: "verification", reason: "Beneficiary confirmation required" },
    { question: "Would you like me to explain the claim timeline so you know what to expect?", priority: 7, category: "follow_up", reason: "Managing expectations reduces stress" },
  ],
  commercial: [
    { question: "What is the nature of your business and what was the extent of the interruption?", priority: 9, category: "claim_details", reason: "Business type affects coverage calculation" },
    { question: "Do you have financial records to substantiate the lost revenue?", priority: 8, category: "documents", reason: "Revenue documentation required for business interruption" },
    { question: "Were any employees or third parties affected?", priority: 8, category: "incident", reason: "Third-party involvement may require liability assessment" },
    { question: "Have you engaged a public adjuster or legal counsel?", priority: 7, category: "claim_details", reason: "Legal representation affects communication protocol" },
  ],
  general: [
    { question: "Is there anything else about the incident that you think is important for me to know?", priority: 6, category: "claim_details", reason: "Open-ended collection of additional context" },
    { question: "What is your preferred method of contact for updates on this claim?", priority: 5, category: "follow_up", reason: "Ensure proper communication channel" },
    { question: "Is there anything I can clarify about the claims process for you?", priority: 5, category: "resolution", reason: "Ensure customer understands next steps" },
  ],
  escalation: [
    { question: "I want to make sure we resolve this for you today — can you tell me specifically what outcome you're hoping for?", priority: 10, category: "resolution", reason: "De-escalation through goal alignment" },
    { question: "I understand this has been a frustrating experience. Would it help to speak with a senior claims specialist?", priority: 9, category: "empathy", reason: "Offer escalation path to high-stress callers" },
    { question: "Let me personally take ownership of this case. Can I get a good callback number for you?", priority: 8, category: "resolution", reason: "Personal accountability reduces customer stress" },
  ],
};

function generateQuestions(req: QuestionRequest): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const claimQuestions = QUESTION_BANKS[req.claim_type] || QUESTION_BANKS.general;

  questions.push(...QUESTION_BANKS.verification.slice(0, 1));
  questions.push(...claimQuestions);

  if (req.stress_level === "high" || req.stress_level === "critical") {
    questions.push(...QUESTION_BANKS.escalation);
  }

  if (req.urgency_indicators.some(u => ["hospital", "injured", "emergency"].includes(u))) {
    questions.unshift({
      question: "Are you or anyone involved in immediate danger or in need of medical attention?",
      priority: 10,
      category: "incident",
      reason: "Safety check triggered by emergency keywords",
    });
  }

  if (req.missing_fields?.includes("policy_number")) {
    questions.unshift(QUESTION_BANKS.verification[1]);
  }

  const seen = new Set<string>();
  const unique = questions.filter(q => {
    if (seen.has(q.question)) return false;
    seen.add(q.question);
    return true;
  });

  return unique.sort((a, b) => b.priority - a.priority).slice(0, 8);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: QuestionRequest = await req.json();

    if (!body.call_id) {
      return new Response(
        JSON.stringify({ error: "call_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const questions = generateQuestions(body);

    return new Response(JSON.stringify({ questions, generated_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
