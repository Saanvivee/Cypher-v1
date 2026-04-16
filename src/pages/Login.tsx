import { useState } from "react";
import { Shield, Eye, EyeOff, Loader2, Zap, Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";

export default function Login() {
  const { signIn, demoSignIn, loading } = useAuth();
  const { dispatch } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const goTo = (page: "agent" | "supervisor") => {
    dispatch({ type: "SET_PAGE", payload: page });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: err } = await signIn(email, password);
    setSubmitting(false);
    if (err) {
      setError(err);
    } else {
      goTo("agent");
    }
  };

  const handleDemo = async (role: "agent" | "supervisor") => {
    await demoSignIn(role);
    goTo(role === "supervisor" ? "supervisor" : "agent");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <div className="hidden lg:flex flex-col flex-1 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-5 bg-blue-500"
              style={{
                width: `${200 + i * 80}px`,
                height: `${200 + i * 80}px`,
                top: `${10 + i * 12}%`,
                left: `${-5 + i * 8}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-center h-full px-16">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/40">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xl leading-none">CYPHER</p>
              <p className="text-blue-400 text-sm">Enterprise AI Platform</p>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Real-Time Emotionally<br />Aware Insurance AI
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-12 max-w-md">
            Live call analysis, stress detection, NLP transcript understanding, and AI-generated guidance — all in one unified platform.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { icon: Zap, label: "Live Stress Detection", desc: "<500ms latency" },
              { icon: Shield, label: "NLP Analysis", desc: "Real-time sentiment" },
              { icon: Lock, label: "Claim Prioritization", desc: "AI-powered queue" },
              { icon: User, label: "Agent Guidance", desc: "Contextual suggestions" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center w-full lg:w-[480px] shrink-0 px-8 sm:px-12">
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <p className="text-white font-bold text-lg">CYPHER AI</p>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">Sign in</h2>
        <p className="text-slate-400 text-sm mb-8">Access your Cypher Enterprise dashboard</p>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="agent@yourcompany.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-150 shadow-lg shadow-blue-600/30 mt-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Sign In
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-slate-600 text-xs">or try demo access</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleDemo("agent")}
            className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800 transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-white text-sm font-semibold">Agent Demo</p>
            <p className="text-slate-500 text-xs">Handle live calls</p>
          </button>

          <button
            onClick={() => handleDemo("supervisor")}
            className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800 transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-cyan-600/20 flex items-center justify-center group-hover:bg-cyan-600/30 transition-colors">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-white text-sm font-semibold">Supervisor Demo</p>
            <p className="text-slate-500 text-xs">Monitor all agents</p>
          </button>
        </div>

        <p className="text-slate-600 text-xs text-center mt-8">
          Cypher Enterprise AI · v2.4.1 · SOC 2 Type II Certified
        </p>
      </div>
    </div>
  );
}
