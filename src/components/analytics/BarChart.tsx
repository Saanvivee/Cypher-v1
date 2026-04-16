interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  height?: number;
  defaultColor?: string;
  unit?: string;
  horizontal?: boolean;
}

export default function BarChart({
  data,
  height = 160,
  defaultColor = "#3B82F6",
  unit = "",
  horizontal = false,
}: BarChartProps) {
  if (!data.length) return null;

  const maxVal = Math.max(...data.map(d => d.value));

  if (horizontal) {
    return (
      <div className="flex flex-col gap-2.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-slate-400 text-xs w-20 shrink-0 text-right truncate">{d.label}</span>
            <div className="flex-1 h-5 bg-slate-800 rounded-md overflow-hidden">
              <div
                className="h-full rounded-md flex items-center justify-end pr-2 transition-all duration-700"
                style={{
                  width: `${(d.value / maxVal) * 100}%`,
                  backgroundColor: d.color ?? defaultColor,
                  minWidth: "4px",
                }}
              >
                <span className="text-white text-xs font-semibold opacity-90">{d.value}{unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const width = 500;
  const padL = 8;
  const padR = 8;
  const padT = 10;
  const padB = 24;
  const barArea = width - padL - padR;
  const barW = Math.max(4, (barArea / data.length) * 0.65);
  const gap = barArea / data.length;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padT + pct * (height - padT - padB);
          const val = Math.round(maxVal * (1 - pct));
          return (
            <g key={i}>
              <line x1={padL} x2={width - padR} y1={y} y2={y} stroke="#1e293b" strokeWidth={1} />
              <text x={padL} y={y - 3} fill="#475569" fontSize={8}>{val}{unit}</text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const barH = ((d.value / maxVal) * (height - padT - padB)) || 1;
          const x = padL + i * gap + (gap - barW) / 2;
          const y = height - padB - barH;
          const color = d.color ?? defaultColor;

          return (
            <g key={i}>
              <rect
                x={x} y={y}
                width={barW} height={barH}
                rx={3}
                fill={color}
                opacity={0.85}
              />
              <text
                x={x + barW / 2}
                y={height - 6}
                textAnchor="middle"
                fill="#475569"
                fontSize={8}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
