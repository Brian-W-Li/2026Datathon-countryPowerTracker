type Country = {
  iso3: string;
  name: string;
  green_score: number | null;
  region: string;
  data_year: number;
};

type Props = {
  countries: Country[];
};

export default function GlobalStats({ countries }: Props) {
  const scored = countries.filter((c) => c.green_score !== null);
  const scores = scored.map((c) => c.green_score!);
  const avgEpi = scores.reduce((a, b) => a + b, 0) / scores.length;

  const sorted = [...scores].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const aboveMedian = scores.filter((s) => s >= median).length;

  const regionMap = new Map<string, number[]>();
  for (const c of scored) {
    const arr = regionMap.get(c.region) || [];
    arr.push(c.green_score!);
    regionMap.set(c.region, arr);
  }
  const regions = [...regionMap.entries()]
    .map(([region, vals]) => ({
      region,
      avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      count: vals.length,
    }))
    .sort((a, b) => b.avg - a.avg);

  const topCountry = scored.reduce((best, c) =>
    (c.green_score ?? 0) > (best.green_score ?? 0) ? c : best
  );

  return (
    <div className="w-full max-w-5xl mx-auto mb-8">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-4">
          <div className="text-[10px] text-gray-300 font-medium uppercase tracking-wider mb-1">Countries Scored</div>
          <div className="text-2xl font-bold text-white">{scored.length}</div>
          <div className="text-[10px] text-gray-400 mt-1">of {countries.length} total</div>
        </div>
        <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-4">
          <div className="text-[10px] text-gray-300 font-medium uppercase tracking-wider mb-1">Average EPI</div>
          <div className="text-2xl font-bold text-amber-400">{avgEpi.toFixed(1)}</div>
          <div className="text-[10px] text-gray-400 mt-1">global mean</div>
        </div>
        <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-4">
          <div className="text-[10px] text-gray-300 font-medium uppercase tracking-wider mb-1">Above Median</div>
          <div className="text-2xl font-bold text-emerald-400">{aboveMedian}</div>
          <div className="text-[10px] text-gray-400 mt-1">EPI &ge; {median.toFixed(1)}</div>
        </div>
        <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-4">
          <div className="text-[10px] text-gray-300 font-medium uppercase tracking-wider mb-1">Top Performer</div>
          <div className="text-2xl font-bold text-emerald-400">{topCountry.green_score!.toFixed(1)}</div>
          <div className="text-[10px] text-gray-400 mt-1">{topCountry.name}</div>
        </div>
      </div>

      {/* Region averages bar */}
      <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-4">
        <div className="text-[10px] text-gray-300 font-medium uppercase tracking-wider mb-3">Average EPI by Region</div>
        <div className="space-y-2">
          {regions.map((r) => {
            const pct = (r.avg / 100) * 100;
            const barColor =
              r.avg >= 65 ? "bg-emerald-600" : r.avg >= 50 ? "bg-amber-500" : "bg-red-600";
            return (
              <div key={r.region} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-28 shrink-0 text-right">
                  {r.region}
                </span>
                <div className="flex-1 bg-gray-800/80 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${barColor} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-300 font-mono w-10 text-right">
                  {r.avg.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
