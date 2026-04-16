import { Bell, Activity, Clock, Moon, Sun } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { formatDuration } from "../../lib/mockData";

export default function Header() {
  const { state, dispatch } = useApp();
  const { agent } = useAuth();
  const { activeCall, analytics, darkMode } = state;

  const call = activeCall.call;

  return (
    <header className="h-14 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">Active Calls</span>
          <span className="text-white font-semibold text-sm">{analytics.active_calls}</span>
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">Avg Stress</span>
          <span
            className={`font-semibold text-sm ${
              analytics.avg_stress >= 70 ? "text-red-400" :
              analytics.avg_stress >= 45 ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {analytics.avg_stress}%
          </span>
        </div>
        {call && (
          <>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-slate-300 font-medium">{call.caller_name}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(call.duration_seconds)}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {call && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30">
            <Activity className="w-3 h-3 text-red-400 animate-pulse" />
            <span className="text-red-400 text-xs font-medium">
              Stress {Math.round(call.stress_level)}%
            </span>
          </div>
        )}

        <button
          onClick={() => dispatch({ type: "TOGGLE_DARK_MODE" })}
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
        >
          {darkMode
            ? <Sun className="w-4 h-4 text-slate-400" />
            : <Moon className="w-4 h-4 text-slate-400" />}
        </button>

        <button className="relative w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
          <Bell className="w-4 h-4 text-slate-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-slate-900" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-700">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {(agent?.name ?? "U").slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-white text-xs font-medium leading-none">{agent?.name}</p>
            <p className="text-slate-400 text-xs capitalize">{agent?.department}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
