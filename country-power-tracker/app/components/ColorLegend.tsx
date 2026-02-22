export default function ColorLegend() {
  const stops = [
    { label: "0", color: "#dc2626" },
    { label: "25", color: "#ef4444" },
    { label: "50", color: "#eab308" },
    { label: "75", color: "#22c55e" },
    { label: "100", color: "#16a34a" },
  ];

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 rounded-lg border border-gray-800 text-xs">
      <span className="text-gray-500 mr-1">EPI Score</span>
      <span className="text-gray-500">Low</span>
      <div
        className="h-3 w-40 rounded-sm"
        style={{
          background:
            "linear-gradient(to right, #dc2626, #ef4444, #eab308, #22c55e, #16a34a)",
        }}
      />
      <span className="text-gray-500">High</span>
      <span className="text-gray-600 ml-1">|</span>
      <span className="inline-block w-3 h-3 rounded-sm mr-0.5" style={{ background: "#334155" }} />
      <span className="text-gray-500">No data</span>
    </div>
  );
}
