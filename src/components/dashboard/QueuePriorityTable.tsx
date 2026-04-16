import { useEffect, useState } from "react";
import { ListOrdered, AlertTriangle, ArrowUp, Minus, Clock, PhoneCall } from "lucide-react";
import type { QueueItem, UrgencyLevel, ClaimType } from "../../types";
import { URGENCY_COLOR_MAP, formatDuration } from "../../lib/mockData";
import { CALLER_NAMES, CLAIM_TYPES } from "../../lib/mockData";

function generateMockQueue(): QueueItem[] {
  const urgencyLevels: UrgencyLevel[] = ["critical", "high", "medium", "low"];
  return Array.from({ length: 12 }, (_, i) => {
    const urgency = urgencyLevels[Math.min(Math.floor(i / 3), 3)];
    const score = Math.round(95 - i * 6 + (Math.random() * 8 - 4));
    return {
      id: `q_${i + 1}`,
      call_id: `call_${i + 1}`,
      priority_score: Math.max(5, score),
      urgency,
      estimated_wait_seconds: Math.round(30 + i * 45 + Math.random() * 30),
      claim_type: CLAIM_TYPES[i % CLAIM_TYPES.length] as ClaimType,
      escalation_reason: urgency === "critical" ? "Customer distress detected" : urgency === "high" ? "Extended wait time" : "",
      position: i + 1,
      created_at: new Date(Date.now() - i * 60000).toISOString(),
      updated_at: new Date().toISOString(),
      call: {
        id: `call_${i + 1}`,
        agent_id: null,
        claim_id: null,
        caller_name: CALLER_NAMES[i % CALLER_NAMES.length],
        caller_phone: `+1-555-01${String(i + 10).padStart(2, "0")}`,
        status: "active",
        stress_level: Math.round(20 + Math.random() * 70),
        urgency_score: Math.max(5, score),
        confidence_score: Math.round(60 + Math.random() * 35),
        sentiment: urgency === "critical" ? "distressed" : urgency === "high" ? "negative" : "neutral",
        duration_seconds: Math.round(60 + i * 30 + Math.random() * 120),
        resolution_notes: "",
        started_at: new Date(Date.now() - i * 60000).toISOString(),
        ended_at: null,
        created_at: new Date(Date.now() - i * 60000).toISOString(),
      },
    };
  });
}

const URGENCY_BADGE: Record<UrgencyLevel, string> = {
  critical: "bg-red-500/20 text-red-300 border-red-500/40",
  high: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  medium: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  low: "bg-slate-500/20 text-slate-400 border-slate-500/40",
};

export default function QueuePriorityTable() {
  const [queue, setQueue] = useState<QueueItem[]>([]);

  useEffect(() => {
    setQueue(generateMockQueue());
    const interval = setInterval(() => {
      setQueue(prev => prev.map(item => ({
        ...item,
        estimated_wait_seconds: Math.max(0, item.estimated_wait_seconds - 10 + Math.round(Math.random() * 5)),
        call: item.call ? {
          ...item.call,
          stress_level: Math.min(100, Math.max(0, item.call.stress_level + (Math.random() - 0.4) * 3)),
          duration_seconds: item.call.duration_seconds + 10,
        } : item.call,
      })));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/50 shrink-0">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-blue-400" />
          <span className="text-white text-sm font-semibold">Live Queue Priority</span>
          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
            {queue.length} calls
          </span>
        </div>
        <span className="text-slate-500 text-xs">Auto-sorted by AI priority score</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm">
            <tr className="border-b border-slate-700/50">
              {["#", "Caller", "Type", "Urgency", "Stress", "Wait", "Score", "Action"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {queue.map(item => {
              const stressColor = item.call!.stress_level >= 70 ? "text-red-400" :
                item.call!.stress_level >= 45 ? "text-amber-400" : "text-emerald-400";
              const urgencyColor = URGENCY_COLOR_MAP[item.urgency];

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-800/40 transition-colors ${item.urgency === "critical" ? "bg-red-500/5" : ""}`}
                >
                  <td className="px-4 py-3">
                    <span className="text-slate-400 font-mono text-xs">{item.position}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-slate-200 font-medium text-xs whitespace-nowrap">{item.call!.caller_name}</p>
                      <p className="text-slate-500 text-xs">{item.call!.caller_phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-300 text-xs capitalize">{item.claim_type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {item.urgency === "critical" && <AlertTriangle className="w-3 h-3 text-red-400" />}
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${URGENCY_BADGE[item.urgency]}`}>
                        {item.urgency}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${item.call!.stress_level}%`, backgroundColor: urgencyColor }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${stressColor}`}>
                        {Math.round(item.call!.stress_level)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <Clock className="w-3 h-3" />
                      {formatDuration(item.estimated_wait_seconds)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {item.priority_score >= 70
                        ? <ArrowUp className="w-3 h-3 text-red-400" />
                        : <Minus className="w-3 h-3 text-slate-500" />
                      }
                      <span className={`text-xs font-bold ${item.priority_score >= 70 ? "text-red-400" : item.priority_score >= 45 ? "text-amber-400" : "text-slate-400"}`}>
                        {item.priority_score}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap">
                      <PhoneCall className="w-3 h-3" />
                      Route
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
