import { useState } from "react";
import { BarChart3, TrendingUp, Phone, Clock, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import { MetricCard, MetricGrid } from "../components/dashboard/MetricCards";
import LineChart from "../components/analytics/LineChart";
import BarChart from "../components/analytics/BarChart";
import { useApp } from "../context/AppContext";
import { generateAnalyticsData, formatDuration, formatCurrency } from "../lib/mockData";

const CLAIM_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function AnalyticsDashboard() {
  const { state, dispatch } = useApp();
  const { analytics } = state;

  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 600));
    dispatch({ type: "SET_NOTIFICATION", payload: { message: "Analytics refreshed", type: "success" } });
    setRefreshing(false);
  };

  const stressTrendData = analytics.stress_trend.map(d => ({ label: d.time, value: d.score }));
  const callsByHourData = analytics.calls_by_hour.map(d => ({ label: d.hour, value: d.count }));
  const callsByTypeData = analytics.calls_by_type.map((d, i) => ({
    label: d.type,
    value: d.count,
    color: CLAIM_COLORS[i % CLAIM_COLORS.length],
  }));

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 shrink-0">
          <div>
            <h1 className="text-white font-bold text-lg">Analytics Dashboard</h1>
            <p className="text-slate-500 text-sm">Real-time performance metrics & AI insights</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 text-sm focus:outline-none focus:border-blue-500">
              <option>Today</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last quarter</option>
            </select>
            <button
              onClick={refresh}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition-colors ${refreshing ? "opacity-60" : ""}`}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <MetricGrid cols={4}>
            <MetricCard
              label="Total Calls"
              value={analytics.total_calls.toLocaleString()}
              sub="Today's volume"
              trend="up"
              trendValue="+8.3%"
              icon={<Phone className="w-4 h-4" />}
              color="info"
            />
            <MetricCard
              label="Active Right Now"
              value={analytics.active_calls}
              sub="Concurrent calls"
              icon={<TrendingUp className="w-4 h-4" />}
              color={analytics.active_calls > 150 ? "warning" : "success"}
              trend="up"
              trendValue="Peak hours"
            />
            <MetricCard
              label="Resolution Rate"
              value={`${analytics.resolution_rate}%`}
              sub="First call resolution"
              trend="up"
              trendValue="+2.1%"
              icon={<CheckCircle className="w-4 h-4" />}
              color="success"
            />
            <MetricCard
              label="Escalation Rate"
              value={`${analytics.escalation_rate}%`}
              sub="Requires supervisor"
              trend="down"
              trendValue="-1.4%"
              icon={<AlertTriangle className="w-4 h-4" />}
              color={analytics.escalation_rate > 15 ? "danger" : "warning"}
            />
          </MetricGrid>

          <MetricGrid cols={3}>
            <MetricCard
              label="Avg Handle Time"
              value={formatDuration(analytics.avg_duration)}
              sub="Target: 8:00"
              icon={<Clock className="w-4 h-4" />}
              color={analytics.avg_duration > 600 ? "warning" : "success"}
            />
            <MetricCard
              label="Avg Stress Score"
              value={`${analytics.avg_stress}%`}
              sub="Across all calls"
              color={analytics.avg_stress >= 60 ? "danger" : analytics.avg_stress >= 40 ? "warning" : "success"}
              icon={<BarChart3 className="w-4 h-4" />}
            />
            <MetricCard
              label="Claims Value Processed"
              value={formatCurrency(2847500)}
              sub="Today's total"
              trend="up"
              trendValue="+14.2%"
              color="success"
            />
          </MetricGrid>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold text-sm">Call Volume by Hour</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Calls handled per hour today</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-400">
                  <span className="w-3 h-0.5 bg-blue-400 rounded" />
                  Total Calls
                </div>
              </div>
              <BarChart data={callsByHourData} defaultColor="#3B82F6" height={160} unit="" />
            </div>

            <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold text-sm">Stress Score Trend</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Average stress over last 60 minutes</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-red-400">
                  <span className="w-3 h-0.5 bg-red-400 rounded" />
                  Avg Stress %
                </div>
              </div>
              <LineChart
                data={stressTrendData}
                color="#EF4444"
                fillColor="#EF4444"
                height={160}
                unit="%"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Claims by Type</h3>
              <BarChart data={callsByTypeData} horizontal height={200} />
            </div>

            <div className="xl:col-span-1 rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Sentiment Breakdown</h3>
              <div className="space-y-3 mt-6">
                {analytics.sentiment_breakdown.map(item => {
                  const total = analytics.sentiment_breakdown.reduce((s, i) => s + i.count, 0);
                  const pct = ((item.count / total) * 100).toFixed(1);
                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-20">{item.label}</span>
                      <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: item.color }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-300 w-10 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                {analytics.sentiment_breakdown.map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-slate-300 font-medium ml-auto">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="xl:col-span-1 rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5">
              <h3 className="text-white font-semibold text-sm mb-4">AI Service Performance</h3>
              <div className="space-y-3">
                {[
                  { service: "NLP Service", latency: "124ms", uptime: "99.97%", requests: "18.4K" },
                  { service: "Stress Detection", latency: "89ms", uptime: "99.99%", requests: "22.1K" },
                  { service: "Scoring Engine", latency: "47ms", uptime: "100%", requests: "18.4K" },
                  { service: "Question Generator", latency: "203ms", uptime: "99.94%", requests: "6.2K" },
                ].map(({ service, latency, uptime, requests }) => (
                  <div key={service} className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <p className="text-slate-200 text-xs font-medium">{service}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500">{latency}</span>
                      <span className="text-emerald-400 font-medium">{uptime}</span>
                      <span className="text-blue-400">{requests}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-blue-300 text-xs font-medium">System Health</p>
                <div className="flex items-end gap-1 mt-2">
                  {Array.from({ length: 20 }, (_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${8 + Math.random() * 24}px`,
                        backgroundColor: Math.random() > 0.1 ? "#3B82F6" : "#EF4444",
                        opacity: 0.7 + Math.random() * 0.3,
                      }}
                    />
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-1">API response times (last 20 requests)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
