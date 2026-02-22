export default function ColorLegend() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/60 rounded-lg border border-gray-800/50 text-[11px]">
      <span className="text-gray-500 mr-1 font-medium">EPI</span>
      <span className="text-gray-500">Low</span>
      <div
        className="h-2.5 w-36 rounded-sm"
        style={{
          background:
            "linear-gradient(to right, #dc2626, #ef4444, #eab308, #22c55e, #16a34a)",
        }}
      />
      <span className="text-gray-500">High</span>
      <span className="text-gray-700 ml-1">|</span>
      <span className="inline-block w-2.5 h-2.5 rounded-sm mr-0.5" style={{ background: "#334155" }} />
      <span className="text-gray-500">No data</span>
    </div>
  );
}
