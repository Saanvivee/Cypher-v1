import { Lightbulb, AlertTriangle, TrendingUp, Mic, MicOff } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { STRESS_COLOR_MAP } from "../../lib/mockData";

export default function AgentGuidance() {
  const { state } = useApp();
  const { agentGuidance, stressResult, scoringResult, nlpResult } = state.activeCall;

  const stressLevel = stressResult?.level ?? "low";
  const stressColor = STRESS_COLOR_MAP[stressLevel] ?? "#10B981";
  const shouldEscalate = scoringResult?.escalate ?? false;

  return (
    <div className="flex flex-col gap-3 h-full">
      {shouldEscalate && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/40 animate-pulse-slow">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 text-xs font-semibold">Escalation Recommended</p>
            <p className="text-red-400/80 text-xs mt-0.5">{scoringResult?.escalation_reason}</p>
          </div>
        </div>
      )}

      <div className="flex-1 rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span className="text-white text-sm font-semibold">Agent Guidance</span>
        </div>
        <div className="p-3 space-y-2">
          {agentGuidance.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">Guidance will appear during active calls</p>
          ) : (
            agentGuidance.map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-800 border border-slate-700/50">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-blue-400 text-xs font-bold">{i + 1}</span>
                </span>
                <p className="text-slate-300 text-xs leading-relaxed">{tip}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {nlpResult && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-white text-sm font-semibold">NLP Insights</span>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-800 p-2 border border-slate-700/50">
              <p className="text-slate-500 text-xs">Intent</p>
              <p className="text-slate-200 text-xs font-medium mt-0.5 capitalize">
                {nlpResult.intent.replace(/_/g, " ")}
              </p>
            </div>
            <div className="rounded-lg bg-slate-800 p-2 border border-slate-700/50">
              <p className="text-slate-500 text-xs">Sentiment</p>
              <p className="text-xs font-medium mt-0.5 capitalize" style={{ color: stressColor }}>
                {nlpResult.sentiment_label}
              </p>
            </div>
            <div className="col-span-2 rounded-lg bg-slate-800 p-2 border border-slate-700/50">
              <p className="text-slate-500 text-xs mb-1.5">Key Topics</p>
              <div className="flex flex-wrap gap-1">
                {nlpResult.keywords.slice(0, 6).map(kw => (
                  <span key={kw} className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {stressResult && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50">
            <Mic className="w-4 h-4" style={{ color: stressColor }} />
            <span className="text-white text-sm font-semibold">Audio Analysis</span>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {[
              { label: "Speech Rate", value: `${stressResult.speech_rate} wpm` },
              { label: "Pitch Variance", value: `${(stressResult.pitch_variance * 100).toFixed(0)}%` },
              { label: "Pause Freq.", value: `${(stressResult.pause_frequency * 100).toFixed(0)}%` },
              { label: "Confidence", value: `${(stressResult.confidence * 100).toFixed(0)}%` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-slate-800 p-2 border border-slate-700/50">
                <p className="text-slate-500 text-xs">{label}</p>
                <p className="text-slate-200 text-xs font-semibold mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          {stressResult.contributing_factors.length > 0 && (
            <div className="px-3 pb-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <MicOff className="w-3 h-3 text-slate-500" />
                <p className="text-slate-500 text-xs">Stress Factors</p>
              </div>
              {stressResult.contributing_factors.slice(0, 2).map(f => (
                <p key={f} className="text-xs text-slate-400 flex items-start gap-1.5 mt-1">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {f}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
