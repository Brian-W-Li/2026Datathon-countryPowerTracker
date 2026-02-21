type Recommendation = {
  bucket_id: string;
  bucket_name: string;
  lift: number;
};

type Props = {
  data: Recommendation[];
};

const BUCKET_ICONS: Record<string, string> = {
  CPM: "💰",
  RE:  "☀️",
  FPD: "⛔",
  EEF: "🏠",
  GRT: "🚗",
  LU:  "🌳",
  CF:  "🏦",
};

export default function Recommendations({ data }: Props) {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">🌍 Global Policy Recommendations</h2>
      <p className="text-gray-500 mb-6 text-sm">
        The 3 policy sectors most associated with top-performing countries worldwide.
      </p>

      <div className="flex flex-col gap-4">
        {data.map((rec, index) => (
          <div
            key={rec.bucket_id}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            {/* Rank */}
            <div className="text-3xl font-black text-gray-200 w-8">
              {index + 1}
            </div>

            {/* Icon */}
            <div className="text-2xl">
              {BUCKET_ICONS[rec.bucket_id] ?? "📋"}
            </div>

            {/* Name */}
            <div className="flex-1">
              <div className="font-semibold text-gray-800">{rec.bucket_name}</div>
              <div className="text-xs text-gray-400">{rec.bucket_id}</div>
            </div>

            {/* Lift badge */}
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">{rec.lift}×</div>
              <div className="text-xs text-gray-400">lift score</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}