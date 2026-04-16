import { Phone, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/layout/AppLayout";
import CallControls from "../components/dashboard/CallControls";
import StressGauge from "../components/dashboard/StressGauge";
import LiveTranscript from "../components/dashboard/LiveTranscript";
import SuggestedQuestions from "../components/dashboard/SuggestedQuestions";
import AgentGuidance from "../components/dashboard/AgentGuidance";
import { MetricCard, MetricGrid } from "../components/dashboard/MetricCards";
import { formatDuration } from "../lib/mockData";

export default function AgentDashboard() {
  const { state } = useApp();
  const { agent } = useAuth();
  const { activeCall } = state;
  const call = activeCall.call;

  const stressLevel = activeCall.stressResult?.level ?? "low";

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 shrink-0">
          <div>
            <h1 className="text-white font-bold text-lg">Agent Console</h1>
            <p className="text-slate-500 text-sm">
              {agent?.name} · {agent?.department}
            </p>
          </div>
          <CallControls />
        </div>

        <div className="flex-1 overflow-hidden">
          {!call ? (
            <div className="flex flex-col h-full">
              <div className="p-6">
                <MetricGrid cols={4}>
                  <MetricCard
                    label="Calls Handled Today"
                    value={agent?.calls_handled ?? 0}
                    sub="This session"
                    trend="up"
                    trendValue="+12%"
                    icon={<Phone className="w-4 h-4" />}
                    color="info"
                  />
                  <MetricCard
                    label="Avg Stress Score"
                    value={`${agent?.avg_stress_score ?? 0}%`}
                    sub="Below team avg"
                    trend="down"
                    trendValue="-5%"
                    icon={<TrendingUp className="w-4 h-4" />}
                    color="success"
                  />
                  <MetricCard
                    label="Resolution Rate"
                    value="84%"
                    sub="Last 30 days"
                    trend="up"
                    trendValue="+3%"
                    icon={<CheckCircle className="w-4 h-4" />}
                    color="success"
                  />
                  <MetricCard
                    label="Avg Handle Time"
                    value="7:32"
                    sub="Target: 8:00"
                    trend="neutral"
                    trendValue="On track"
                    icon={<Clock className="w-4 h-4" />}
                  />
                </MetricGrid>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center mx-auto mb-6 animate-pulse-slow">
                    <Phone className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h2 className="text-white text-xl font-semibold mb-2">Ready for Calls</h2>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">
                    Your status is set to available. Click "Simulate Incoming Call" above to start a live AI-assisted session.
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      NLP Service Online
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Stress Detection Online
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Scoring Engine Online
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full gap-0 divide-x divide-slate-700/50">
              <div className="w-64 xl:w-72 shrink-0 flex flex-col gap-4 p-4 overflow-y-auto">
                <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
                  <p className="text-slate-400 text-xs mb-3">Caller Info</p>
                  <p className="text-white font-semibold">{call.caller_name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{call.caller_phone}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 capitalize">
                      {call.sentiment}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {formatDuration(call.duration_seconds)}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 flex flex-col items-center gap-3">
                  <StressGauge size="md" />
                  <div className="w-full grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <p className="text-slate-500 text-xs">Urgency</p>
                      <p className={`text-sm font-bold ${
                        call.urgency_score >= 70 ? "text-red-400" :
                        call.urgency_score >= 45 ? "text-amber-400" : "text-emerald-400"
                      }`}>{Math.round(call.urgency_score)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 text-xs">Confidence</p>
                      <p className="text-sm font-bold text-blue-400">{Math.round(call.confidence_score)}%</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
                  <AgentGuidance />
                </div>
              </div>

              <div className="flex-1 flex flex-col min-w-0">
                <LiveTranscript />
              </div>

              <div className="w-72 xl:w-80 shrink-0 flex flex-col overflow-hidden">
                <SuggestedQuestions />
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
