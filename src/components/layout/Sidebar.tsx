import { Phone, LayoutDashboard, BarChart3, Users, Shield, Activity, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import type { Page } from "../../types";

interface NavItem {
  icon: React.ElementType;
  label: string;
  page: Page;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { icon: Phone, label: "Agent Console", page: "agent", roles: ["agent", "supervisor", "admin"] },
  { icon: Users, label: "Supervisor View", page: "supervisor", roles: ["supervisor", "admin"] },
  { icon: BarChart3, label: "Analytics", page: "analytics", roles: ["supervisor", "admin"] },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const { agent, signOut } = useAuth();
  const { sidebarOpen, page, activeCall } = state;

  const navigate = (p: Page) => dispatch({ type: "SET_PAGE", payload: p });
  const toggle = () => dispatch({ type: "TOGGLE_SIDEBAR" });

  const visibleItems = NAV_ITEMS.filter(item =>
    agent ? item.roles.includes(agent.role) : false
  );

  return (
    <aside
      className={`relative flex flex-col bg-slate-900 border-r border-slate-700/50 transition-all duration-300 ${sidebarOpen ? "w-60" : "w-16"} shrink-0`}
    >
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700/50 ${!sidebarOpen && "justify-center px-0"}`}>
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && (
          <div>
            <p className="text-white font-bold text-sm leading-none">CYPHER</p>
            <p className="text-blue-400 text-xs mt-0.5">Enterprise AI</p>
          </div>
        )}
      </div>

      <button
        onClick={toggle}
        className="absolute -right-3 top-14 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-slate-600 transition-colors z-10"
      >
        {sidebarOpen ? <ChevronLeft className="w-3 h-3 text-slate-300" /> : <ChevronRight className="w-3 h-3 text-slate-300" />}
      </button>

      {activeCall.call && (
        <div className={`mx-3 my-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 ${!sidebarOpen && "mx-2 justify-center"}`}>
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          {sidebarOpen && <span className="text-emerald-400 text-xs font-medium truncate">Live Call Active</span>}
        </div>
      )}

      <nav className="flex-1 px-2 py-3 space-y-1">
        {visibleItems.map(({ icon: Icon, label, page: p }) => {
          const active = page === p;
          return (
            <button
              key={p}
              onClick={() => navigate(p)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              } ${!sidebarOpen && "justify-center px-0"}`}
              title={!sidebarOpen ? label : undefined}
            >
              <Icon className="w-4.5 h-4.5 shrink-0 w-[18px] h-[18px]" />
              {sidebarOpen && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      <div className={`border-t border-slate-700/50 p-3 ${!sidebarOpen && "flex justify-center"}`}>
        {sidebarOpen && agent && (
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{agent.name.slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-xs font-medium truncate">{agent.name}</p>
              <p className="text-slate-400 text-xs capitalize">{agent.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={signOut}
          className={`flex items-center gap-2 text-slate-400 hover:text-red-400 text-xs px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-all w-full ${!sidebarOpen && "justify-center px-0"}`}
          title={!sidebarOpen ? "Sign Out" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
