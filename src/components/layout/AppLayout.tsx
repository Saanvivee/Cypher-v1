import type { ReactNode } from "react";
import { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useApp } from "../../context/AppContext";

const NOTIF_ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const NOTIF_COLORS = {
  success: "bg-emerald-500/10 border-emerald-500/40 text-emerald-300",
  error: "bg-red-500/10 border-red-500/40 text-red-300",
  info: "bg-blue-500/10 border-blue-500/40 text-blue-300",
  warning: "bg-amber-500/10 border-amber-500/40 text-amber-300",
};

function Notification() {
  const { state, dispatch } = useApp();
  const { notification } = state;

  if (!notification) return null;

  const Icon = NOTIF_ICONS[notification.type];
  const color = NOTIF_COLORS[notification.type];

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-2xl max-w-sm ${color}`}>
        <Icon className="w-4 h-4 shrink-0" />
        <p className="text-sm font-medium flex-1">{notification.message}</p>
        <button
          onClick={() => dispatch({ type: "SET_NOTIFICATION", payload: null })}
          className="opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { state } = useApp();

  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [state.darkMode]);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <Notification />
    </div>
  );
}
