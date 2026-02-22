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

  const ranked = [...countries]
    .filter((c) => c.green_score !== null)
    .sort((a, b) => (b.green_score ?? 0) - (a.green_score ?? 0));

  const filtered = search
    ? ranked.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : ranked;

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

  return (
    <div className="w-80 bg-gray-900/80 rounded-xl border border-gray-800/60 flex flex-col max-h-[600px]">
      <div className="p-4 border-b border-gray-800/60">
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
      <div className="overflow-y-auto flex-1 p-2">
        {filtered.map((country) => {
          const rank = ranked.indexOf(country) + 1;
          return (
            <button
              key={country.iso3}
              onClick={() => router.push(`/country/${country.iso3}`)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/60 transition-colors text-left group"
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
          );
        })}
        {filtered.length === 0 && (
          <p className="text-gray-300 text-sm text-center py-4">
            No countries found
          </p>
        )}
      </div>
    </div>
  );
}
