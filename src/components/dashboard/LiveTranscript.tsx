import { useEffect, useRef } from "react";
import { MessageSquare, User, Headphones, Loader2 } from "lucide-react";
import { useApp } from "../../context/AppContext";

function SentimentDot({ score }: { score: number }) {
  const color = score > 0.1 ? "bg-emerald-400" : score < -0.1 ? "bg-red-400" : "bg-slate-500";
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color} mt-1.5 shrink-0`} />;
}

export default function LiveTranscript() {
  const { state } = useApp();
  const { transcripts, isProcessing } = state.activeCall;
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <span className="text-white text-sm font-semibold">Live Transcript</span>
          {isProcessing && (
            <div className="flex items-center gap-1.5 text-xs text-blue-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </div>
        <span className="text-slate-500 text-xs">{transcripts.length} utterances</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {transcripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MessageSquare className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm">Transcript will appear here once the call begins</p>
          </div>
        ) : (
          transcripts.map((t) => {
            const isAgent = t.speaker === "agent";
            return (
              <div
                key={t.id}
                className={`flex gap-2.5 animate-fade-in ${isAgent ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  isAgent ? "bg-blue-600" : "bg-slate-700"
                }`}>
                  {isAgent
                    ? <Headphones className="w-3.5 h-3.5 text-white" />
                    : <User className="w-3.5 h-3.5 text-slate-300" />
                  }
                </div>

                <div className={`flex flex-col gap-1 max-w-[75%] ${isAgent ? "items-end" : "items-start"}`}>
                  <div className={`flex items-center gap-1.5 ${isAgent ? "flex-row-reverse" : "flex-row"}`}>
                    <span className={`text-xs font-medium ${isAgent ? "text-blue-400" : "text-slate-400"}`}>
                      {isAgent ? "Agent" : "Caller"}
                    </span>
                    <SentimentDot score={t.sentiment_score} />
                    <span className="text-slate-600 text-xs">
                      {new Date(t.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </div>

                  <div className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    isAgent
                      ? "bg-blue-600/20 border border-blue-500/30 text-slate-200 rounded-tr-sm"
                      : "bg-slate-800 border border-slate-700/50 text-slate-300 rounded-tl-sm"
                  }`}>
                    {t.text}
                  </div>

                  {t.keywords.length > 0 && (
                    <div className={`flex flex-wrap gap-1 ${isAgent ? "justify-end" : "justify-start"}`}>
                      {t.keywords.slice(0, 3).map(kw => (
                        <span key={kw} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700/50">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
