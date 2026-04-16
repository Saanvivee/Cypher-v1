import { Phone, PhoneOff, Pause, Volume2, UserPlus, Clock } from "lucide-react";
import { useCallSimulator } from "../../hooks/useCallSimulator";
import { useApp } from "../../context/AppContext";
import { formatDuration } from "../../lib/mockData";

export default function CallControls() {
  const { startCall, endCall } = useCallSimulator();
  const { state } = useApp();
  const { call } = state.activeCall;

  return (
    <div className="flex items-center gap-3">
      {!call ? (
        <button
          onClick={startCall}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all duration-150 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-500/40 hover:-translate-y-px active:translate-y-0"
        >
          <Phone className="w-4 h-4" />
          Simulate Incoming Call
        </button>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700/50">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-white text-sm font-medium">{call.caller_name}</span>
            <span className="text-slate-500 text-xs">·</span>
            <span className="text-slate-400 text-sm flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(call.duration_seconds)}
            </span>
          </div>

          <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white text-sm transition-all">
            <Volume2 className="w-4 h-4" />
          </button>

          <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white text-sm transition-all">
            <Pause className="w-4 h-4" />
          </button>

          <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white text-sm transition-all">
            <UserPlus className="w-4 h-4" />
            <span>Transfer</span>
          </button>

          <button
            onClick={endCall}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all duration-150 shadow-lg shadow-red-600/30 hover:shadow-red-500/40"
          >
            <PhoneOff className="w-4 h-4" />
            End Call
          </button>
        </div>
      )}
    </div>
  );
}
