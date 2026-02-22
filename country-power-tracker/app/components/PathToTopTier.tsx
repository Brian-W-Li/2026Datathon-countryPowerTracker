"use client";

type ScatterPoint = {
  iso3: string;
  total_policies: number;
  sectors: Record<string, number>;
};

type SectorLift = {
  bucket_id: string;
  bucket_name: string;
  lift: number;
  top_in_sector: number;
  total_in_sector: number;
};

type Props = {
  iso3: string;
  scatterData: ScatterPoint[];
  sectorNames: Record<string, string>;
  sectorLifts: SectorLift[];
  isTopTier: boolean;
};

function median(sortedNumbers: number[]) {
  const n = sortedNumbers.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 1 ? sortedNumbers[mid] : (sortedNumbers[mid - 1] + sortedNumbers[mid]) / 2;
}

function safeShare(point: ScatterPoint, code: string) {
  const total = point.total_policies;
  if (typeof total !== "number" || !isFinite(total) || total <= 0) return 0;
  const count = point.sectors?.[code] ?? 0;
  if (typeof count !== "number" || !isFinite(count) || count <= 0) return 0;
  return Math.max(0, Math.min(1, count / total));
}

export default function PathToTopTier({ iso3, scatterData, sectorNames, sectorLifts, isTopTier }: Props) {
  const upper = iso3.toUpperCase();
  const country = scatterData.find((d) => d.iso3?.toUpperCase?.() === upper) ?? null;
  const eligible = scatterData.filter((d) => typeof d.total_policies === "number" && isFinite(d.total_policies) && d.total_policies > 0);

  const sectorCodes = sectorLifts.map((s) => s.bucket_id);
  const medianShareByCode: Record<string, number> = {};
  for (const code of sectorCodes) {
    const shares = eligible.map((d) => safeShare(d, code)).sort((a, b) => a - b);
    medianShareByCode[code] = median(shares);
  }

  const recommendations = country
    ? sectorLifts
        .map((s) => {
          const code = s.bucket_id;
          const lift = s.lift;
          if (typeof lift !== "number" || !isFinite(lift) || lift <= 1.0) return null;
          if (typeof s.total_in_sector === "number" && s.total_in_sector < 10) return null;

          const countryShare = safeShare(country, code);
          const medianShare = medianShareByCode[code] ?? 0;
          const gap = medianShare - countryShare;
          const need = Math.max(0, gap);
          const evidence = Math.log(lift);
          const score = evidence * need;
          if (!isFinite(score) || score <= 0) return null;

          return {
            code,
            name: sectorNames?.[code] ?? s.bucket_name ?? code,
            lift,
            score,
            countryShare,
            medianShare,
            gap,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
    : [];

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
      <h2 className="text-lg font-semibold mb-1">Path to Top Tier</h2>

      {country === null ? (
        <p className="text-gray-500 text-sm">No data</p>
      ) : isTopTier ? (
        <p className="text-emerald-400 text-sm font-medium">
          ✓ This country is already in the top quartile for CO2/GDP (lower is better).
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-300 mb-3">
            Suggested focus areas (based on gaps vs peers + lift):
          </p>

          {recommendations.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No strong underrepresented sectors found — this country already matches or exceeds peer medians for high-lift sectors.
            </p>
          ) : (
            <ul className="space-y-2 mb-3">
              {recommendations.map((s, i) => {
                const countryPct = s.countryShare * 100;
                const medianPct = s.medianShare * 100;
                const gapPp = s.gap * 100;
                const gapLabel = `${gapPp.toFixed(gapPp >= 10 ? 0 : 1)}pp`;
                return (
                <li
                  key={s.code}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono text-gray-500 w-4 shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm text-gray-300 truncate">{s.name}</div>
                      <div className="text-[11px] text-gray-500 truncate">
                        This country’s share: {countryPct.toFixed(countryPct >= 10 ? 0 : 1)}% vs median:{" "}
                        {medianPct.toFixed(medianPct >= 10 ? 0 : 1)}% (gap: {gapLabel})
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-bold text-emerald-400 shrink-0">
                    {s.lift.toFixed(2)}x
                  </span>
                </li>
              );
              })}
            </ul>
          )}

          <p className="text-xs text-gray-500">
            Lift indicates over-representation among top performers — associative, not causal.
          </p>
        </>
      )}
    </div>
  );
}
