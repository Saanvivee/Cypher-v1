import { createContext, useContext, useReducer, useCallback } from "react";
import type { ReactNode } from "react";
import type {
  Call, Transcript, StressMetric, SuggestedQuestion, QueueItem,
  NLPResult, StressResult, ScoringResult, AnalyticsSnapshot, Page,
} from "../types";
import { generateAnalyticsData } from "../lib/mockData";

interface ActiveCallState {
  call: Call | null;
  transcripts: Transcript[];
  stressMetrics: StressMetric[];
  questions: SuggestedQuestion[];
  nlpResult: NLPResult | null;
  stressResult: StressResult | null;
  scoringResult: ScoringResult | null;
  agentGuidance: string[];
  isProcessing: boolean;
}

interface AppState {
  page: Page;
  activeCall: ActiveCallState;
  allCalls: Call[];
  queueItems: QueueItem[];
  analytics: AnalyticsSnapshot;
  darkMode: boolean;
  sidebarOpen: boolean;
  notification: { message: string; type: "info" | "warning" | "error" | "success" } | null;
}

type AppAction =
  | { type: "SET_PAGE"; payload: Page }
  | { type: "SET_ACTIVE_CALL"; payload: Call | null }
  | { type: "ADD_TRANSCRIPT"; payload: Transcript }
  | { type: "ADD_STRESS_METRIC"; payload: StressMetric }
  | { type: "SET_QUESTIONS"; payload: SuggestedQuestion[] }
  | { type: "MARK_QUESTION_ANSWERED"; payload: string }
  | { type: "SET_NLP_RESULT"; payload: NLPResult }
  | { type: "SET_STRESS_RESULT"; payload: StressResult }
  | { type: "SET_SCORING_RESULT"; payload: ScoringResult }
  | { type: "SET_AGENT_GUIDANCE"; payload: string[] }
  | { type: "SET_PROCESSING"; payload: boolean }
  | { type: "UPDATE_CALL_METRICS"; payload: Partial<Call> }
  | { type: "SET_ALL_CALLS"; payload: Call[] }
  | { type: "SET_QUEUE"; payload: QueueItem[] }
  | { type: "TOGGLE_DARK_MODE" }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_NOTIFICATION"; payload: AppState["notification"] }
  | { type: "END_CALL" };

const initialActiveCall: ActiveCallState = {
  call: null,
  transcripts: [],
  stressMetrics: [],
  questions: [],
  nlpResult: null,
  stressResult: null,
  scoringResult: null,
  agentGuidance: [],
  isProcessing: false,
};

const initialState: AppState = {
  page: "login",
  activeCall: initialActiveCall,
  allCalls: [],
  queueItems: [],
  analytics: generateAnalyticsData() as AnalyticsSnapshot,
  darkMode: true,
  sidebarOpen: true,
  notification: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, page: action.payload };

    case "SET_ACTIVE_CALL":
      return {
        ...state,
        activeCall: {
          ...initialActiveCall,
          call: action.payload,
        },
      };

    case "ADD_TRANSCRIPT":
      return {
        ...state,
        activeCall: {
          ...state.activeCall,
          transcripts: [...state.activeCall.transcripts, action.payload],
        },
      };

    case "ADD_STRESS_METRIC":
      return {
        ...state,
        activeCall: {
          ...state.activeCall,
          stressMetrics: [...state.activeCall.stressMetrics.slice(-30), action.payload],
        },
      };

    case "SET_QUESTIONS":
      return {
        ...state,
        activeCall: { ...state.activeCall, questions: action.payload },
      };

    case "MARK_QUESTION_ANSWERED":
      return {
        ...state,
        activeCall: {
          ...state.activeCall,
          questions: state.activeCall.questions.map(q =>
            q.id === action.payload ? { ...q, is_answered: true } : q
          ),
        },
      };

    case "SET_NLP_RESULT":
      return {
        ...state,
        activeCall: { ...state.activeCall, nlpResult: action.payload },
      };

    case "SET_STRESS_RESULT":
      return {
        ...state,
        activeCall: { ...state.activeCall, stressResult: action.payload },
      };

    case "SET_SCORING_RESULT":
      return {
        ...state,
        activeCall: { ...state.activeCall, scoringResult: action.payload },
      };

    case "SET_AGENT_GUIDANCE":
      return {
        ...state,
        activeCall: { ...state.activeCall, agentGuidance: action.payload },
      };

    case "SET_PROCESSING":
      return {
        ...state,
        activeCall: { ...state.activeCall, isProcessing: action.payload },
      };

    case "UPDATE_CALL_METRICS":
      if (!state.activeCall.call) return state;
      return {
        ...state,
        activeCall: {
          ...state.activeCall,
          call: { ...state.activeCall.call, ...action.payload },
        },
      };

    case "SET_ALL_CALLS":
      return { ...state, allCalls: action.payload };

    case "SET_QUEUE":
      return { ...state, queueItems: action.payload };

    case "TOGGLE_DARK_MODE":
      return { ...state, darkMode: !state.darkMode };

    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case "SET_NOTIFICATION":
      return { ...state, notification: action.payload };

    case "END_CALL":
      return {
        ...state,
        activeCall: initialActiveCall,
      };

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  notify: (message: string, type?: AppState["notification"] extends null ? never : NonNullable<AppState["notification"]>["type"]) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const notify = useCallback((
    message: string,
    type: NonNullable<AppState["notification"]>["type"] = "info"
  ) => {
    dispatch({ type: "SET_NOTIFICATION", payload: { message, type } });
    setTimeout(() => dispatch({ type: "SET_NOTIFICATION", payload: null }), 4000);
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, notify }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
