import { Activity, Volume2, Zap, Clock, MessageCircle, Globe, Waves, AlertTriangle } from "lucide-react";

interface AudioMetrics {
  pitch: number;
  intensity: number;
  jitter: number;
  speakingRate: number;
  fillerCount: number;
  fillerPercentage: number;
  ambientNoise: number;
  languageSwitches: number;
  stressIndicators: string[];
}

interface AudioMetricsPanelProps {
  metrics: AudioMetrics;
  isRecording: boolean;
}

export default function AudioMetricsPanel({ metrics, isRecording }: AudioMetricsPanelProps) {
  const getMetricColor = (value: number, thresholds: { low: number; high: number }) => {
    if (value >= thresholds.high) return "text-red-400";
    if (value >= thresholds.low) return "text-amber-400";
    return "text-[#95d5b2]";
  };

  const getBarWidth = (value: number, max: number) => {
    return Math.min(100, (value / max) * 100);
  };

  const getBarColor = (value: number, thresholds: { low: number; high: number }) => {
    if (value >= thresholds.high) return "bg-red-500";
    if (value >= thresholds.low) return "bg-amber-500";
    return "bg-[#2d6a4f]";
  };

  const metricItems = [
    {
      icon: Zap,
      label: "Pitch",
      value: `${metrics.pitch} Hz`,
      numValue: metrics.pitch,
      max: 300,
      thresholds: { low: 150, high: 200 },
      description: "Voice pitch frequency",
    },
    {
      icon: Volume2,
      label: "Intensity",
      value: `${metrics.intensity}%`,
      numValue: metrics.intensity,
      max: 100,
      thresholds: { low: 60, high: 75 },
      description: "Voice volume level",
    },
    {
      icon: Activity,
      label: "Jitter",
      value: `${metrics.jitter}%`,
      numValue: metrics.jitter,
      max: 50,
      thresholds: { low: 20, high: 35 },
      description: "Pitch variance",
    },
    {
      icon: Clock,
      label: "Speaking Rate",
      value: `${metrics.speakingRate} WPM`,
      numValue: metrics.speakingRate,
      max: 250,
      thresholds: { low: 150, high: 180 },
      description: "Words per minute",
    },
    {
      icon: MessageCircle,
      label: "Filler Words",
      value: `${metrics.fillerPercentage}%`,
      numValue: metrics.fillerPercentage,
      max: 30,
      thresholds: { low: 8, high: 15 },
      description: `${metrics.fillerCount} fillers detected`,
    },
    {
      icon: Waves,
      label: "Ambient Noise",
      value: `${metrics.ambientNoise}%`,
      numValue: metrics.ambientNoise,
      max: 100,
      thresholds: { low: 40, high: 60 },
      description: "Background noise level",
    },
    {
      icon: Globe,
      label: "Language Switches",
      value: metrics.languageSwitches.toString(),
      numValue: metrics.languageSwitches,
      max: 5,
      thresholds: { low: 1, high: 2 },
      description: "Code-switching events",
    },
  ];

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#95d5b2]" />
          <span className="text-white text-sm font-semibold">Live Audio Metrics</span>
        </div>
        {isRecording && (
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#95d5b2] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2d6a4f]" />
            </span>
            <span className="text-[#95d5b2] text-xs">Live</span>
          </div>
        )}
      </div>

      <div className="p-3 space-y-3">
        {metricItems.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300 text-xs">{item.label}</span>
              </div>
              <span className={`text-xs font-semibold ${getMetricColor(item.numValue, item.thresholds)}`}>
                {item.value}
              </span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getBarColor(item.numValue, item.thresholds)}`}
                style={{ width: `${getBarWidth(item.numValue, item.max)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Stress Indicators */}
      {metrics.stressIndicators.length > 0 && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 text-xs font-medium">Stress Indicators</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {metrics.stressIndicators.map((indicator, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30"
              >
                {indicator}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
