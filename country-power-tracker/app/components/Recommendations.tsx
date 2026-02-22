type Recommendation = {
  bucket_id: string;
  bucket_name: string;
  lift: number;
  top_in_sector?: number;
  total_in_sector?: number;
};

type Props = {
  data: Recommendation[];
};

const BUCKET_ICONS: Record<string, string> = {
  CPM: "💰",
  RE:  "⚡",
  FPD: "⛽",
  EEF: "🏠",
  GRT: "🚗",
  LU:  "🌲",
  CF:  "🌍",
};

const BUCKET_COLORS: Record<string, string> = {
  CPM: "#06b6d4",
  RE:  "#22c55e",
  FPD: "#ef4444",
  EEF: "#f59e0b",
  GRT: "#8b5cf6",
  LU:  "#84cc16",
  CF:  "#3b82f6",
};

export default function Recommendations({ data }: Props) {
  return (
      <div className="w-full max-w-3xl mx-auto mt-10 mb-4">
      <h2 className="text-xl font-bold text-white mb-1">Top Policy Sectors by Lift Score</h2>
      <p className="text-gray-300 text-sm mb-6">
        Policy sectors most over-represented among countries with the lowest carbon intensity (top quartile CO2/GDP).
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data.map((rec, index) => {
          const color = BUCKET_COLORS[rec.bucket_id] ?? "#9CA3AF";
          return (
            <div
              key={rec.bucket_id}
              className="relative bg-gray-900 rounded-xl border border-gray-800 p-5 overflow-hidden group hover:border-gray-700 transition-colors"
            >
              {/* Rank badge */}
              <div
                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: color + "20", color }}
              >
                {index + 1}
              </div>

              {/* Icon */}
              <div className="text-3xl mb-3">
                {BUCKET_ICONS[rec.bucket_id] ?? "📋"}
              </div>

              {/* Name */}
              <div className="font-semibold text-white text-sm mb-1">{rec.bucket_name}</div>
              <div className="text-xs text-gray-400 mb-3">{rec.bucket_id}</div>

              {/* Lift */}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{ color }}>
                  {rec.lift.toFixed(2)}x
                </span>
                <span className="text-xs text-gray-400">lift</span>
              </div>

              {rec.top_in_sector !== undefined && rec.total_in_sector !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${(rec.top_in_sector / rec.total_in_sector) * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {rec.top_in_sector} of {rec.total_in_sector} in top quartile
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
