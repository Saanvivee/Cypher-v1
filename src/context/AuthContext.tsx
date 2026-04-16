import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { Agent } from "../types";

interface AuthContextValue {
  user: { id: string; email: string } | null;
  agent: Agent | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  demoSignIn: (role: "agent" | "supervisor") => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_AGENT: Agent = {
  id: "demo-agent-001",
  user_id: "demo-user-001",
  name: "Alex Rivera",
  email: "agent@cypher.ai",
  role: "agent",
  status: "available",
  avatar_url: "",
  department: "Auto Claims",
  calls_handled: 247,
  avg_stress_score: 42,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEMO_SUPERVISOR: Agent = {
  id: "demo-supervisor-001",
  user_id: "demo-user-002",
  name: "Jordan Blake",
  email: "supervisor@cypher.ai",
  role: "supervisor",
  status: "available",
  avatar_url: "",
  department: "Claims Operations",
  calls_handled: 1432,
  avg_stress_score: 38,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAgent = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("agents")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) setAgent(data as Agent);
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("cypher_demo_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed.user);
      setAgent(parsed.agent);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser({ id: data.session.user.id, email: data.session.user.email ?? "" });
        fetchAgent(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? "" });
        (async () => { await fetchAgent(session.user.id); })();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setAgent(null);
      }
    });

    return () => { listener.subscription.unsubscribe(); };
  }, [fetchAgent]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    sessionStorage.removeItem("cypher_demo_user");
    await supabase.auth.signOut();
    setUser(null);
    setAgent(null);
  };

  const demoSignIn = async (role: "agent" | "supervisor") => {
    const demoAgent = role === "supervisor" ? DEMO_SUPERVISOR : DEMO_AGENT;
    const demoUser = { id: demoAgent.user_id, email: demoAgent.email };
    setUser(demoUser);
    setAgent(demoAgent);
    sessionStorage.setItem("cypher_demo_user", JSON.stringify({ user: demoUser, agent: demoAgent }));
  };

  return (
    <AuthContext.Provider value={{ user, agent, loading, signIn, signOut, demoSignIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
