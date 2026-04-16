import { useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import AgentDashboard from "./pages/AgentDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";

function Router() {
  const { state, dispatch } = useApp();
  const { agent, loading } = useAuth();

  useEffect(() => {
    if (!loading && !agent && state.page !== "login") {
      dispatch({ type: "SET_PAGE", payload: "login" });
    }
    if (!loading && agent && state.page === "login") {
      dispatch({
        type: "SET_PAGE",
        payload: agent.role === "supervisor" || agent.role === "admin" ? "supervisor" : "agent",
      });
    }
  }, [agent, loading, state.page, dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">Loading Cypher AI...</p>
        </div>
      </div>
    );
  }

  if (state.page === "login" || !agent) return <Login />;
  if (state.page === "agent") return <AgentDashboard />;
  if (state.page === "supervisor") return <SupervisorDashboard />;
  if (state.page === "analytics") return <AnalyticsDashboard />;

  return <AgentDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router />
      </AppProvider>
    </AuthProvider>
  );
}
