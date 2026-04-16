import { HelpCircle, CheckCircle2, ChevronRight, Tag } from "lucide-react";
import { useApp } from "../../context/AppContext";

const CATEGORY_COLORS: Record<string, string> = {
  verification: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  claim_details: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  incident: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  coverage: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  documents: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  follow_up: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  empathy: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  resolution: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  10: { label: "Critical", color: "text-red-400" },
  9: { label: "High", color: "text-orange-400" },
  8: { label: "High", color: "text-orange-400" },
  7: { label: "Medium", color: "text-amber-400" },
  6: { label: "Medium", color: "text-amber-400" },
  5: { label: "Low", color: "text-slate-400" },
};

export default function SuggestedQuestions() {
  const { state, dispatch } = useApp();
  const { questions } = state.activeCall;

  const pending = questions.filter(q => !q.is_answered);
  const answered = questions.filter(q => q.is_answered);

  const markAnswered = (id: string) => {
    dispatch({ type: "MARK_QUESTION_ANSWERED", payload: id });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span className="text-white text-sm font-semibold">AI-Suggested Questions</span>
        </div>
        <div className="flex items-center gap-2">
          {answered.length > 0 && (
            <span className="text-xs text-emerald-400">{answered.length} answered</span>
          )}
          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
            {pending.length} pending
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <HelpCircle className="w-9 h-9 text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm">Questions will be generated as the call progresses</p>
          </div>
        ) : (
          <>
            {pending.map(q => {
              const priorityInfo = PRIORITY_LABELS[q.priority] ?? PRIORITY_LABELS[5];
              const catColor = CATEGORY_COLORS[q.category] ?? CATEGORY_COLORS.follow_up;
              return (
                <div
                  key={q.id}
                  className="group rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-amber-500/30 hover:bg-slate-800 transition-all duration-150"
                >
                  <div className="p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`text-xs font-semibold ${priorityInfo.color} shrink-0 mt-0.5`}>
                        P{q.priority}
                      </span>
                      <p className="text-slate-200 text-sm leading-snug flex-1">{q.question}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${catColor}`}>
                          <Tag className="w-2.5 h-2.5" />
                          {q.category.replace("_", " ")}
                        </span>
                      </div>
                      <button
                        onClick={() => markAnswered(q.id)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-400 transition-colors group-hover:text-slate-400"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark asked</span>
                      </button>
                    </div>
                    {q.reason && (
                      <p className="text-slate-600 text-xs mt-1.5 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" />
                        {q.reason}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {answered.length > 0 && (
              <div className="pt-2">
                <p className="text-slate-600 text-xs mb-2 px-1">Answered</p>
                {answered.map(q => (
                  <div key={q.id} className="rounded-lg px-3 py-2 opacity-40 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <p className="text-slate-400 text-sm line-through truncate">{q.question}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
