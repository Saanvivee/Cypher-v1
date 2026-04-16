import { useState, useEffect } from "react";
import {
  Users, Phone, TrendingUp, AlertTriangle, CheckCircle,
  Clock, ArrowRight, Activity, BarChart2
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import QueuePriorityTable from "../components/dashboard/QueuePriorityTable";
import StressGauge from "../components/dashboard/StressGauge";
import { MetricCard, MetricGrid } from "../components/dashboard/MetricCards";
import { CALLER_NAMES, CLAIM_TYPES, STRESS_COLOR_MAP } from "../lib/mockData";
import type { AgentStatus, UrgencyLevel } from "../types";

interface LiveAgent {
  id: string;
  name: string;
  status: AgentStatus;
  currentCaller?: string;
  stressLevel: number;
  stressCategory: "low" | "moderate" | "high" | "critical";
  callDuration: number;
  callsToday: number;
  urgency: UrgencyLevel;
}

function generateAgents(): LiveAgent[] {
  const statuses: AgentStatus[] = ["on_call", "on_call", "on_call", "available", "on_call", "break", "on_call", "available"];
  return [
    "Sarah Mitchell", "James Chen", "Maria Garcia", "David Thompson",
    "Lisa Johnson", "Kevin Park", "Emma Rodriguez", "Michael Davis",
  ].map((name, i) => {
    const stress = Math.round(20 + Math.random() * 70);
    const cat = stress >= 70 ? "critical" : stress >= 50 ? "high" : stress >= 30 ? "moderate" : "low";
    return {
      id: `agent_${i + 1}`,
      name,
      status: statuses[i],
      currentCaller: statuses[i] === "on_call" ? CALLER_NAMES[(i * 3) % CALLER_NAMES.length] : undefined,
      stressLevel: stress,
      stressCategory: cat as LiveAgent["stressCategory"],
      callDuration: Math.round(60 + Math.random() * 480),
      callsToday: Math.round(8 + Math.random() * 20),
      urgency: (["medium", "high", "critical", "low", "high", "medium", "critical", "low"] as UrgencyLevel[])[i],
    };
  });
}

const STATUS_BADGE: Record<AgentStatus, string> = {
  on_call: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  available: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  offline: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  break: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

function fmtDur(s: number) {
  const m = Math.floor(s / 60); const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function SupervisorDashboard() {
  const [agents, setAgents] = useState<LiveAgent[]>(() => generateAgents());
  const [selectedAgent, setSelectedAgent] = useState<LiveAgent | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(a => ({
        ...a,
        stressLevel: Math.min(100, Math.max(0, a.stressLevel + (Math.random() - 0.45) * 4)),
        callDuration: a.status === "on_call" ? a.callDuration + 5 : a.callDuration,
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const onCall = agents.filter(a => a.status === "on_call").length;
  const available = agents.filter(a => a.status === "available").length;
  const highStress = agents.filter(a => a.stressLevel >= 65).length;
  const avgStress = Math.round(agents.reduce((s, a) => s + a.stressLevel, 0) / agents.length);

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-auto">
        <div className="px-6 py-4 border-b border-slate-700/50 shrink-0">
          <h1 className="text-white font-bold text-lg">Supervisor Dashboard</h1>
          <p className="text-slate-500 text-sm">Real-time agent monitoring & call queue management</p>
        </div>

        <div className="p-6 space-y-6">
          <MetricGrid cols={4}>
            <MetricCard label="Active Calls" value={onCall} sub={`${available} agents available`} color="info" icon={<Phone className="w-4 h-4" />} trend="up" trendValue="+3 since 9AM" />
            <MetricCard label="Agents Online" value={agents.length} sub={`${agents.filter(a => a.status !== "offline").length} active`} icon={<Users className="w-4 h-4" />} />
            <MetricCard label="High Stress Alerts" value={highStress} sub="Require attention" color={highStress > 2 ? "danger" : "warning"} icon={<AlertTriangle className="w-4 h-4" />} trend={highStress > 2 ? "up" : "neutral"} trendValue={highStress > 2 ? "Escalating" : "Stable"} />
            <MetricCard label="Avg Team Stress" value={`${avgStress}%`} sub="Team average" color={avgStress >= 60 ? "danger" : avgStress >= 40 ? "warning" : "success"} icon={<TrendingUp className="w-4 h-4" />} />
          </MetricGrid>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-semibold text-sm">Live Agent Monitor</span>
                  </div>
                  <span className="text-slate-500 text-xs">{agents.length} agents</span>
                </div>
                <div className="divide-y divide-slate-700/30">
                  {agents.map(agent => {
                    const stressColor = STRESS_COLOR_MAP[agent.stressCategory];
                    return (
                      <div
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent === selectedAgent ? null : agent)}
                        className={`flex items-center gap-4 px-5 py-3.5 hover:bg-slate-800/60 cursor-pointer transition-colors ${selectedAgent?.id === agent.id ? "bg-slate-800" : ""}`}
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shrink-0 border border-slate-600">
                          <span className="text-slate-200 text-xs font-bold">{agent.name.slice(0, 2)}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-slate-200 text-sm font-medium">{agent.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_BADGE[agent.status]}`}>
                              {agent.status.replace("_", " ")}
                            </span>
                          </div>
                          {agent.currentCaller && (
                            <p className="text-slate-400 text-xs truncate mt-0.5">
                              {agent.currentCaller} · {fmtDur(agent.callDuration)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Stress</p>
                            <p className="text-sm font-bold" style={{ color: stressColor }}>
                              {Math.round(agent.stressLevel)}%
                            </p>
                          </div>

                          <div className="w-20">
                            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${agent.stressLevel}%`, backgroundColor: stressColor }}
                              />
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-slate-500">Calls</p>
                            <p className="text-sm font-semibold text-slate-300">{agent.callsToday}</p>
                          </div>

                          <button className="text-slate-500 hover:text-blue-400 transition-colors">
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {selectedAgent ? (
                <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{selectedAgent.name.slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{selectedAgent.name}</p>
                      <p className="text-slate-400 text-xs capitalize">{selectedAgent.status.replace("_", " ")}</p>
                    </div>
                  </div>

                  <div className="flex justify-center mb-4">
                    <StressGauge
                      score={selectedAgent.stressLevel}
                      level={selectedAgent.stressCategory}
                      size="md"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {[
                      { label: "Calls Today", value: selectedAgent.callsToday, icon: Phone },
                      { label: "Current Duration", value: selectedAgent.status === "on_call" ? fmtDur(selectedAgent.callDuration) : "—", icon: Clock },
                      { label: "Urgency Level", value: selectedAgent.urgency, icon: AlertTriangle },
                      { label: "Performance", value: "Good", icon: CheckCircle },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="rounded-lg bg-slate-800 p-3 border border-slate-700/50">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="w-3 h-3 text-slate-500" />
                          <p className="text-slate-500 text-xs">{label}</p>
                        </div>
                        <p className="text-slate-200 text-sm font-semibold capitalize">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-medium transition-colors">
                      <Activity className="w-3 h-3" />
                      Monitor Live
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-medium transition-colors">
                      <BarChart2 className="w-3 h-3" />
                      View Stats
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5">
                  <p className="text-slate-500 text-sm text-center py-8">
                    Click an agent to view detailed metrics
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4">
                <p className="text-white text-sm font-semibold mb-3">Stress Distribution</p>
                {(["critical", "high", "moderate", "low"] as const).map(level => {
                  const count = agents.filter(a => a.stressCategory === level).length;
                  const pct = (count / agents.length) * 100;
                  return (
                    <div key={level} className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-slate-400 w-16 capitalize">{level}</span>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: STRESS_COLOR_MAP[level] }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-4 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden" style={{ height: 420 }}>
            <QueuePriorityTable />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
