interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  showGrid?: boolean;
  showDots?: boolean;
  fillColor?: string;
  unit?: string;
}

export default function LineChart({
  data,
  color = "#3B82F6",
  height = 120,
  showGrid = true,
  showDots = false,
  fillColor,
  unit = "",
}: LineChartProps) {
  if (!data.length) return null;

  const width = 500;
  const padL = 8;
  const padR = 8;
  const padT = 10;
  const padB = 20;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const toX = (i: number) => padL + (i / (data.length - 1)) * (width - padL - padR);
  const toY = (v: number) => padT + (1 - (v - min) / range) * (height - padT - padB);

  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const fillPath = fillColor
    ? `${linePath} L ${points[points.length - 1].x} ${height - padB} L ${points[0].x} ${height - padB} Z`
    : null;

  const gridLines = showGrid ? [0, 0.25, 0.5, 0.75, 1] : [];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        {gridLines.map((pct, i) => {
          const y = padT + pct * (height - padT - padB);
          const val = Math.round(max - pct * range);
          return (
            <g key={i}>
              <line x1={padL} x2={width - padR} y1={y} y2={y} stroke="#1e293b" strokeWidth={1} />
              <text x={padL} y={y - 3} fill="#475569" fontSize={8} textAnchor="start">{val}{unit}</text>
            </g>
          );
        })}

        {fillPath && (
          <path d={fillPath} fill={fillColor} opacity={0.15} />
        )}

        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {showDots && points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} stroke="#0f172a" strokeWidth={1.5} />
        ))}

        {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1).map((d, _, arr) => {
          const origIdx = data.indexOf(d);
          const x = toX(origIdx);
          return (
            <text key={origIdx} x={x} y={height - 4} fill="#475569" fontSize={8} textAnchor="middle">
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
