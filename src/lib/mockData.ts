import type { ClaimType } from "../types";

export const CALLER_NAMES = [
  "Margaret Thompson", "Robert Martinez", "Susan Chen", "David Williams",
  "Jennifer Brown", "Michael Johnson", "Lisa Anderson", "James Taylor",
  "Patricia Davis", "Christopher Wilson", "Barbara Moore", "Daniel Jackson",
  "Nancy White", "Paul Harris", "Sandra Clark", "Kevin Lewis",
];

export const CALLER_PHONES = [
  "+1-555-0101", "+1-555-0102", "+1-555-0103", "+1-555-0104",
  "+1-555-0105", "+1-555-0106", "+1-555-0107", "+1-555-0108",
  "+1-555-0109", "+1-555-0110", "+1-555-0111", "+1-555-0112",
];

export const CLAIM_TYPES: ClaimType[] = ["auto", "home", "health", "life", "commercial", "liability"];

export const TRANSCRIPT_SCRIPTS: Record<string, string[][]> = {
  auto: [
    [
      ["caller", "Hello, I was just in a car accident and I need to file a claim immediately."],
      ["agent", "I'm so sorry to hear that. Are you and everyone involved safe right now?"],
      ["caller", "Yes, thankfully. But my car is completely totaled. I'm devastated."],
      ["agent", "I understand this is very stressful. Let me pull up your policy right away. Can I get your policy number?"],
      ["caller", "It's POL-AUTO-7842. I've been with you for 15 years and this has never happened before."],
      ["agent", "Absolutely, I can see your account here. You're a valued long-term customer. Can you describe what happened?"],
      ["caller", "Someone ran a red light and hit me on the driver's side. The police are still here."],
      ["agent", "Good, please make sure to get the police report number — that'll be important for the claim."],
      ["caller", "Do I need to do anything else right now? I'm kind of shaken up."],
      ["agent", "Just stay safe and take photos of the damage if you can. I'll start the claim process right now."],
    ],
    [
      ["caller", "I cannot believe this! This is the third time I'm calling about the same claim!"],
      ["agent", "I sincerely apologize for the inconvenience. Let me pull up your file immediately."],
      ["caller", "Your company is absolutely terrible. I've been waiting 3 weeks for an adjuster!"],
      ["agent", "I completely understand your frustration and I want to make this right today."],
      ["caller", "I want to speak to a manager. This is unacceptable!"],
      ["agent", "I hear you. Let me see if a senior specialist is available right now."],
      ["caller", "I'm about to call a lawyer if this isn't resolved today."],
      ["agent", "Please let me personally take ownership of this case. I'll escalate it immediately."],
    ],
  ],
  home: [
    [
      ["caller", "Our house had a water pipe burst last night and there's flooding everywhere."],
      ["agent", "That sounds very stressful. Is everyone in your family safe and out of harm's way?"],
      ["caller", "Yes, we're staying at my mother's place. But we need emergency housing assistance."],
      ["agent", "Of course. Your policy does include additional living expenses coverage. Let me check the details."],
      ["caller", "The floors, the walls, everything is damaged. I don't even know where to start."],
      ["agent", "First, make sure you document everything with photos. Then we'll send an adjuster within 48 hours."],
      ["caller", "48 hours? We can't go back in that house, it could be a safety hazard."],
      ["agent", "I'll mark this as urgent and try to get someone there today. You have my word."],
    ],
  ],
  health: [
    [
      ["caller", "I had emergency surgery last month and I just got a bill for $28,000. This can't be right."],
      ["agent", "I understand that must be alarming. Let me look into your claims history right now."],
      ["caller", "I was told everything would be covered. The hospital said so."],
      ["agent", "Let me review what was submitted and what was approved. Do you have the Explanation of Benefits?"],
      ["caller", "I got something in the mail but it's so confusing. It says I owe a lot."],
      ["agent", "Let me walk you through it line by line. First, can you tell me the date of the surgery?"],
      ["caller", "November 15th. At St. Mary's Medical Center."],
      ["agent", "Got it. I can see the claim here. Let me identify exactly what was approved and why."],
    ],
  ],
  life: [
    [
      ["caller", "I'm calling about my late husband's life insurance policy. He passed away two weeks ago."],
      ["agent", "I'm so deeply sorry for your loss. Please take your time. I'm here to help you through this."],
      ["caller", "Thank you. I just... I don't know where to start. He always handled these things."],
      ["agent", "We'll take this one step at a time together. You don't have to worry about anything right now."],
      ["caller", "His policy number is POL-LIFE-1147. I found it in his papers."],
      ["agent", "I have the policy right here. You are listed as the primary beneficiary. I'll guide you through the process."],
      ["caller", "How long does it take? I have bills coming in and I'm not sure I can manage."],
      ["agent", "I understand the urgency. Once we receive the death certificate, we can typically process within 5-7 business days."],
    ],
  ],
  commercial: [
    [
      ["caller", "Our entire warehouse flooded during the storm and we've lost over $200,000 in inventory."],
      ["agent", "That's a significant loss. I want to make sure we handle this comprehensively. When did this occur?"],
      ["caller", "Two days ago. We have business interruption insurance but I don't know how to file."],
      ["agent", "Your commercial policy covers both property damage and business interruption. I'll walk you through both."],
      ["caller", "We have 40 employees who can't work right now. This is a crisis for us."],
      ["agent", "I'm treating this as a priority claim. Can you give me the policy number so I can confirm your coverage limits?"],
    ],
  ],
};

export function getRandomScript(claimType: string): string[][] {
  const scripts = TRANSCRIPT_SCRIPTS[claimType] || TRANSCRIPT_SCRIPTS.auto;
  return scripts[Math.floor(Math.random() * scripts.length)];
}

export function generateCallId(): string {
  return `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function formatPhone(phone: string): string {
  return phone.replace(/(\+1-)(\d{3})-(\d{4})/, "$1$2-$3");
}

export const STRESS_COLOR_MAP: Record<string, string> = {
  low: "#10B981",
  moderate: "#F59E0B",
  high: "#EF4444",
  critical: "#DC2626",
};

export const URGENCY_COLOR_MAP: Record<string, string> = {
  low: "#6B7280",
  medium: "#3B82F6",
  high: "#F59E0B",
  critical: "#EF4444",
};

export const SENTIMENT_COLOR_MAP: Record<string, string> = {
  positive: "#10B981",
  neutral: "#6B7280",
  negative: "#F59E0B",
  distressed: "#EF4444",
};

export function generateAnalyticsData() {
  const hours = Array.from({ length: 12 }, (_, i) => {
    const h = 8 + i;
    return {
      hour: `${h > 12 ? h - 12 : h}${h >= 12 ? "PM" : "AM"}`,
      count: Math.floor(20 + Math.random() * 60),
    };
  });

  const stressTrend = Array.from({ length: 20 }, (_, i) => ({
    time: `${i * 3}m`,
    score: Math.floor(30 + Math.random() * 50),
  }));

  return {
    total_calls: 1847,
    active_calls: Math.floor(80 + Math.random() * 60),
    avg_stress: Math.round(38 + Math.random() * 20),
    avg_duration: Math.round(480 + Math.random() * 180),
    resolution_rate: Math.round(78 + Math.random() * 12),
    escalation_rate: Math.round(8 + Math.random() * 8),
    calls_by_hour: hours,
    stress_trend: stressTrend,
    calls_by_type: [
      { type: "Auto", count: 643 },
      { type: "Home", count: 412 },
      { type: "Health", count: 387 },
      { type: "Life", count: 198 },
      { type: "Commercial", count: 154 },
      { type: "Liability", count: 53 },
    ],
    sentiment_breakdown: [
      { label: "Positive", count: 412, color: "#10B981" },
      { label: "Neutral", count: 731, color: "#6B7280" },
      { label: "Negative", count: 486, color: "#F59E0B" },
      { label: "Distressed", count: 218, color: "#EF4444" },
    ],
  };
}
