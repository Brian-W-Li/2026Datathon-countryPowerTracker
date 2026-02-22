"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function EpiRankings({ countries }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIso3, setSelectedIso3] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const ranked = [...countries]
    .filter((c) => c.green_score !== null)
    .sort((a, b) => (b.green_score ?? 0) - (a.green_score ?? 0));

  const rankByIso3 = new Map(ranked.map((c, i) => [c.iso3, i + 1]));

  const filtered = search
    ? ranked.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : ranked;

  const toggleCompare = (iso3: string) => {
    setSelectedIso3((prev) => {
      if (prev.includes(iso3)) return prev.filter((id) => id !== iso3);
      if (prev.length < 2) return [...prev, iso3];
      return [prev[1], iso3];
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 65) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const getBarColor = (score: number) => {
    if (score >= 65) return "bg-emerald-600";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-600";
  };

  const countryByIso3 = new Map(ranked.map((c) => [c.iso3, c]));
  const selectedCountries = selectedIso3
    .map((id) => countryByIso3.get(id))
    .filter(Boolean) as Country[];

  const [a, b] = selectedCountries;
  const scoreA = a?.green_score ?? null;
  const scoreB = b?.green_score ?? null;

  let deltaEl: React.ReactNode = null;
  if (selectedCountries.length === 2) {
    if (scoreA === null || scoreB === null) {
      deltaEl = (
        <div className="mt-2 pt-2 border-t border-gray-700/60 text-gray-300 text-xs">
          Δ EPI: No data
        </div>
      );
    } else {
      const delta = scoreA - scoreB;
      const higher = delta > 0 ? a.name : delta < 0 ? b.name : null;
      deltaEl = (
        <div className="mt-2 pt-2 border-t border-gray-700/60 text-gray-300 text-xs">
          Δ EPI:{" "}
          <span
            className={
              delta > 0
                ? "text-emerald-400"
                : delta < 0
                ? "text-red-400"
                : "text-gray-300"
            }
          >
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)}
          </span>
          {higher && (
            <span className="text-gray-400"> · {higher} is higher</span>
          )}
        </div>
      );
    }
  }

  return (
    <div className="w-80 bg-gray-900/80 rounded-xl border border-gray-800/60 flex flex-col max-h-[600px]">
      {/* Fixed title + search — never scrolls */}
      <div className="p-4 border-b border-gray-800/60 shrink-0">
        <h2 className="text-white text-base font-bold mb-2">
          Country Rankings
        </h2>
        <input
          type="text"
          placeholder="Search countries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800/80 text-white text-sm rounded-lg border border-gray-700/60 focus:border-emerald-500 focus:outline-none placeholder-gray-500 transition-colors"
        />
      </div>

      {/* Positioning root for compare overlay + scrollable list */}
      <div className="relative flex-1 flex flex-col min-h-0">
        {/* Sticky compare bar — sits above the scroll area, always visible */}
        <div className="sticky top-0 z-20 shrink-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800/60 px-3 py-2 flex items-center justify-between">
          <button
            onClick={() => setCompareOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white transition-colors"
          >
            <span className="font-semibold">Compare ({selectedIso3.length})</span>
            <svg
              className={`w-3 h-3 transition-transform ${compareOpen ? "rotate-180" : ""}`}
              viewBox="0 0 10 6"
              fill="none"
            >
              <path
                d="M1 1l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {selectedIso3.length > 0 && (
            <button
              onClick={() => {
                setSelectedIso3([]);
                setCompareOpen(false);
              }}
              className="text-gray-400 text-xs hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Backdrop: covers list behind the card; click to dismiss */}
        {compareOpen && (
          <div
            className="absolute inset-0 top-8 bg-black/20 z-20"
            onClick={() => setCompareOpen(false)}
          />
        )}

        {/* Floating compare card — overlays the list, does not push it down */}
        {compareOpen && (
          <div className="absolute left-2 right-2 top-8 z-30 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700/60 p-3 shadow-xl">
            {selectedCountries.length < 2 ? (
              <p className="text-gray-400 text-xs">
                Select 2 countries to compare.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {selectedCountries.map((c) => {
                    const rank = rankByIso3.get(c.iso3) ?? "—";
                    const score = c.green_score;
                    return (
                      <div key={c.iso3} className="flex flex-col gap-1">
                        <span className="text-white text-xs font-semibold truncate">
                          {c.name}
                        </span>
                        <span className="text-gray-300 text-xs">{c.region}</span>
                        <span className="text-gray-300 text-xs">
                          Year: {c.data_year}
                        </span>
                        <span className="text-gray-300 text-xs">
                          Rank: #{rank}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            score !== null
                              ? getScoreColor(score)
                              : "text-gray-400"
                          }`}
                        >
                          EPI: {score !== null ? score.toFixed(1) : "No data"}
                        </span>
                        <button
                          onClick={() => router.push(`/country/${c.iso3}`)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors text-left mt-0.5"
                        >
                          View details →
                        </button>
                      </div>
                    );
                  })}
                </div>
                {deltaEl}
              </>
            )}
          </div>
        )}

        {/* Scrollable list — height is unaffected by compare card state */}
        <div className="overflow-y-auto flex-1 p-2">
          {filtered.map((country) => {
            const rank = rankByIso3.get(country.iso3) ?? 0;
            const isSelected = selectedIso3.includes(country.iso3);
            return (
              <div
                key={country.iso3}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800/60 transition-colors group"
              >
                <button
                  onClick={() => toggleCompare(country.iso3)}
                  title={isSelected ? "Remove from compare" : "Add to compare"}
                  className={`shrink-0 w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                    isSelected
                      ? "bg-emerald-500 border-emerald-500"
                      : "border-gray-600 hover:border-emerald-500"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      viewBox="0 0 10 8"
                      fill="none"
                    >
                      <path
                        d="M1 4l3 3 5-6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => router.push(`/country/${country.iso3}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <span className="text-gray-400 text-xs font-mono w-6 text-right shrink-0 group-hover:text-gray-300 transition-colors">
                    {rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm truncate">
                      {country.name}
                    </div>
                    <div className="w-full bg-gray-800/80 rounded-full h-1 mt-1">
                      <div
                        className={`h-1 rounded-full ${getBarColor(country.green_score!)}`}
                        style={{ width: `${country.green_score}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold shrink-0 ${getScoreColor(country.green_score!)}`}
                  >
                    {country.green_score!.toFixed(1)}
                  </span>
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-gray-300 text-sm text-center py-4">
              No countries found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
