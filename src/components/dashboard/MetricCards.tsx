import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "default" | "success" | "warning" | "danger" | "info";
  icon?: ReactNode;
}

const COLOR_MAP = {
  default: "border-slate-700/50",
  success: "border-emerald-500/30",
  warning: "border-amber-500/30",
  danger: "border-red-500/30",
  info: "border-blue-500/30",
};

const VALUE_COLOR_MAP = {
  default: "text-white",
  success: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-red-400",
  info: "text-blue-400",
};

export function MetricCard({ label, value, sub, trend, trendValue, color = "default", icon }: MetricCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-slate-500";

  return (
    <div className={`rounded-xl bg-slate-800/60 border ${COLOR_MAP[color]} p-4 flex flex-col gap-2 hover:bg-slate-800 transition-colors`}>
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</p>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className={`text-2xl font-bold leading-none ${VALUE_COLOR_MAP[color]}`}>{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface MetricGridProps {
  children: ReactNode;
  cols?: 2 | 3 | 4;
}

export function MetricGrid({ children, cols = 4 }: MetricGridProps) {
  const gridCols = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-2 lg:grid-cols-4" };
  return <div className={`grid ${gridCols[cols]} gap-3`}>{children}</div>;
}
