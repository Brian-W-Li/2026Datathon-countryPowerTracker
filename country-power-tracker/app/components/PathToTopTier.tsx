"use client";

import { useState } from "react";
import liftData from "../../public/data/lift_by_bucket.json";

type LiftEntry = {
  bucket_id: string;
  bucket_name: string;
  lift: number;
};

type Metric = "co2gdp" | "epi";

type Props = {
  isTopTier: boolean;
  isEpiTopTier: boolean | null;
};

export default function PathToTopTier({ isTopTier, isEpiTopTier }: Props) {
  const [metric, setMetric] = useState<Metric>("co2gdp");

  const lifts = liftData as LiftEntry[];

  const topSectors = [...lifts]
    .filter((s) => typeof s.lift === "number" && s.lift > 1.05)
    .sort((a, b) => b.lift - a.lift)
    .slice(0, 3);

  const isActive = metric === "co2gdp" ? isTopTier : isEpiTopTier;
  const metricLabel =
    metric === "co2gdp"
      ? "CO2/GDP (lower is better)"
      : "EPI (higher is better)";

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
      <h2 className="text-lg font-semibold mb-1">Path to Top Tier</h2>

      {/* Metric toggle */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-300">Top tier metric</span>
        <div className="flex rounded-md overflow-hidden border border-gray-700">
          <button
            onClick={() => setMetric("co2gdp")}
            className={`px-2.5 py-1 text-xs transition-colors ${
              metric === "co2gdp"
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            CO2/GDP
          </button>
          <button
            onClick={() => setMetric("epi")}
            className={`px-2.5 py-1 text-xs transition-colors border-l border-gray-700 ${
              metric === "epi"
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            EPI
          </button>
        </div>
      </div>

      {isActive === null ? (
        <p className="text-gray-500 text-sm">No data</p>
      ) : isActive ? (
        <p className="text-emerald-400 text-sm font-medium">
          ✓ This country is already in the top quartile for {metricLabel}.
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-300 mb-3">
            Top sectors associated with top performers:
          </p>

          {topSectors.length === 0 ? (
            <p className="text-gray-500 text-sm">No data</p>
          ) : (
            <ul className="space-y-2 mb-3">
              {topSectors.map((s, i) => (
                <li
                  key={s.bucket_id}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono text-gray-500 w-4 shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-300 truncate">
                      {s.bucket_name}
                    </span>
                  </div>
                  <span className="text-sm font-mono font-bold text-emerald-400 shrink-0">
                    {s.lift.toFixed(2)}x
                  </span>
                </li>
              ))}
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
