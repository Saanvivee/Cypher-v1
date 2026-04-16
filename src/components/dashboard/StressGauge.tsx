import { useApp } from "../../context/AppContext";

interface StressGaugeProps {
  score?: number;
  level?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export default function StressGauge({ score, level, label = "Stress Level", size = "lg" }: StressGaugeProps) {
  const { state } = useApp();
  const displayScore = score ?? state.activeCall.call?.stress_level ?? 0;
  const displayLevel = level ?? state.activeCall.stressResult?.level ?? "low";

  const dimensions = { sm: 80, md: 110, lg: 150 };
  const dim = dimensions[size];
  const cx = dim / 2;
  const cy = dim / 2;
  const r = (dim / 2) - 12;
  const strokeWidth = size === "lg" ? 10 : 8;

  const circumference = 2 * Math.PI * r;
  const arcLength = circumference * 0.75;
  const offset = arcLength - (displayScore / 100) * arcLength;

  const colorMap: Record<string, { stroke: string; text: string; bg: string; glow: string }> = {
    low: { stroke: "#10B981", text: "text-emerald-400", bg: "bg-emerald-500/10", glow: "shadow-emerald-500/20" },
    moderate: { stroke: "#F59E0B", text: "text-amber-400", bg: "bg-amber-500/10", glow: "shadow-amber-500/20" },
    high: { stroke: "#EF4444", text: "text-red-400", bg: "bg-red-500/10", glow: "shadow-red-500/20" },
    critical: { stroke: "#DC2626", text: "text-red-500", bg: "bg-red-500/20", glow: "shadow-red-500/30" },
  };

  const colors = colorMap[displayLevel] ?? colorMap.low;
  const rotation = -135;

  const fontSize = size === "lg" ? 28 : size === "md" ? 20 : 16;
  const subFontSize = size === "lg" ? 11 : 9;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative rounded-2xl p-4 ${colors.bg} shadow-xl ${colors.glow}`}>
        <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(${rotation}, ${cx}, ${cy})`}
          />
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(${rotation}, ${cx}, ${cy})`}
            style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease" }}
          />
          <text
            x={cx} y={cy - 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={colors.stroke}
            fontSize={fontSize}
            fontWeight="700"
            fontFamily="system-ui"
          >
            {Math.round(displayScore)}
          </text>
          <text
            x={cx} y={cy + fontSize / 2 + 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#64748b"
            fontSize={subFontSize}
            fontFamily="system-ui"
          >
            / 100
          </text>
        </svg>

        {displayLevel === "critical" && (
          <div className="absolute inset-0 rounded-2xl animate-pulse bg-red-500/5 pointer-events-none" />
        )}
      </div>

      <div className="text-center">
        <p className="text-slate-400 text-xs">{label}</p>
        <p className={`text-xs font-semibold capitalize mt-0.5 ${colors.text}`}>
          {displayLevel}
        </p>
      </div>
    </div>
  );
}
