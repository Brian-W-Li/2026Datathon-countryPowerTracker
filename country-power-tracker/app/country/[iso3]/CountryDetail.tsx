"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ── Types ────────────────────────────────────────────────────────────────────

type CountryEntry = {
  iso3: string;
  name: string;
  region: string;
  green_score: number | null;
  data_year: number;
};

type PolicyEntry = {
  iso3: string;
  country: string;
  policy_name: string;
  start_year: number | null;
  bucket_id: string;
  bucket_name: string;
  status: string;
  scope: string;
};

type DeepDiveEntry = {
  iso3: string;
  series: { year: number; co2_per_capita: number; co2_per_gdp: number }[];
} | null;

type CleanEnergyEntry = {
  iso3: string;
  series: {
    year: number;
    clean_capacity_mw: number;
    total_capacity_mw: number;
    clean_share: number;
  }[];
} | null;

type Props = {
  country: CountryEntry;
  policies: PolicyEntry[];
  deepDive: DeepDiveEntry;
  cleanEnergy: CleanEnergyEntry;
};

// ── Constants ────────────────────────────────────────────────────────────────

const ALL_BUCKETS: { id: string; name: string }[] = [
  { id: "RE",  name: "Renewable Energy" },
  { id: "FPD", name: "Fossil Fuel Phase-Down" },
  { id: "CPM", name: "Carbon Pricing" },
  { id: "EEF", name: "Energy Efficiency" },
  { id: "GRT", name: "Grid & Transport" },
  { id: "CF",  name: "Climate Finance" },
  { id: "LU",  name: "Land Use" },
];

const ALL_STATUSES = ["In force", "In preparation", "Ended"];

const CHART_STYLE = {
  grid: "#374151",
  axis: "#9ca3af",
  tooltip: { background: "#1f2937", border: "1px solid #374151", color: "#f9fafb" },
};

const SCORE_COLOR = (score: number | null) => {
  if (score === null) return "text-gray-400";
  if (score >= 60) return "text-green-400";
  if (score >= 45) return "text-yellow-400";
  return "text-red-400";
};

// ── Component ────────────────────────────────────────────────────────────────

export default function CountryDetail({
  country,
  policies,
  deepDive,
  cleanEnergy,
}: Props) {
  // Checkbox filter state
  const [selectedBuckets, setSelectedBuckets] = useState<Set<string>>(
    new Set(ALL_BUCKETS.map((b) => b.id))
  );
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    new Set(ALL_STATUSES)
  );

  function toggleBucket(id: string) {
    setSelectedBuckets((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleStatus(s: string) {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }

  // Filtered policies
  const filteredPolicies = useMemo(
    () =>
      policies.filter(
        (p) =>
          selectedBuckets.has(p.bucket_id) && selectedStatuses.has(p.status)
      ),
    [policies, selectedBuckets, selectedStatuses]
  );

  // Group by bucket
  const grouped = useMemo(() => {
    const map = new Map<string, PolicyEntry[]>();
    for (const p of filteredPolicies) {
      if (!map.has(p.bucket_id)) map.set(p.bucket_id, []);
      map.get(p.bucket_id)!.push(p);
    }
    return map;
  }, [filteredPolicies]);

  // CO2/GDP % change over last 10 years
  const co2Change = useMemo(() => {
    if (!deepDive) return null;
    const recent = deepDive.series
      .filter((s) => s.co2_per_gdp != null && s.year >= 2014)
      .sort((a, b) => a.year - b.year);
    if (recent.length < 2) return null;
    const start = recent[0].co2_per_gdp;
    const end = recent[recent.length - 1].co2_per_gdp;
    return { pct: ((end - start) / start) * 100, startYear: recent[0].year, endYear: recent[recent.length - 1].year };
  }, [deepDive]);

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="max-w-5xl mx-auto">

        {/* ── Back link ──────────────────────────────────────────────── */}
        <Link
          href="/"
          className="text-gray-400 hover:text-gray-200 text-sm inline-flex items-center gap-1 mb-6"
        >
          ← Back to Globe
        </Link>

        {/* ── Country header ────────────────────────────────────────── */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-white text-3xl font-bold">{country.name}</h1>
              <p className="text-gray-400 mt-1">{country.region}</p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-black ${SCORE_COLOR(country.green_score)}`}>
                {country.green_score ?? "—"}
              </div>
              <div className="text-gray-400 text-sm">GEPI Score</div>
            </div>
          </div>

          {/* CO2/GDP change callout */}
          {co2Change && (
            <div className="mt-4 p-3 bg-gray-800 rounded-xl inline-flex items-center gap-3">
              <span className="text-gray-400 text-sm">
                CO₂/GDP change ({co2Change.startYear}–{co2Change.endYear})
              </span>
              <span
                className={`font-bold text-lg ${
                  co2Change.pct < 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {co2Change.pct > 0 ? "+" : ""}
                {co2Change.pct.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* ── Charts row ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* CO2/GDP over time */}
          {deepDive && (
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
              <h2 className="text-white font-semibold mb-3">CO₂ / GDP Over Time</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={deepDive.series}
                  margin={{ top: 5, right: 10, bottom: 5, left: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} />
                  <XAxis
                    dataKey="year"
                    stroke={CHART_STYLE.axis}
                    tick={{ fill: CHART_STYLE.axis, fontSize: 11 }}
                  />
                  <YAxis
                    stroke={CHART_STYLE.axis}
                    tick={{ fill: CHART_STYLE.axis, fontSize: 11 }}
                  />
                  <Tooltip contentStyle={CHART_STYLE.tooltip} labelStyle={{ color: "#f9fafb" }} />
                  <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="co2_per_gdp"
                    name="CO₂/GDP"
                    stroke="#22c55e"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Clean energy share */}
          {cleanEnergy && (
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
              <h2 className="text-white font-semibold mb-3">Clean Energy Share (%)</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={cleanEnergy.series}
                  margin={{ top: 5, right: 10, bottom: 5, left: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} />
                  <XAxis
                    dataKey="year"
                    stroke={CHART_STYLE.axis}
                    tick={{ fill: CHART_STYLE.axis, fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke={CHART_STYLE.axis}
                    tick={{ fill: CHART_STYLE.axis, fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(v: number | undefined) => v !== undefined ? `${v.toFixed(1)}%` : ""}
                    contentStyle={CHART_STYLE.tooltip}
                    labelStyle={{ color: "#f9fafb" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="clean_share"
                    name="Clean Share"
                    stroke="#38bdf8"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── Policy section ────────────────────────────────────────── */}
        <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-white text-xl font-semibold mb-4">
              Active Policies
              <span className="ml-2 text-gray-400 text-sm font-normal">
                ({filteredPolicies.length} shown)
              </span>
            </h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-8">
              {/* Sector filter */}
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
                  Sector
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {ALL_BUCKETS.map((b) => {
                    const count = policies.filter((p) => p.bucket_id === b.id).length;
                    if (count === 0) return null;
                    return (
                      <label
                        key={b.id}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBuckets.has(b.id)}
                          onChange={() => toggleBucket(b.id)}
                          className="w-4 h-4 accent-green-500 rounded"
                        />
                        <span className="text-gray-300 text-sm group-hover:text-white">
                          {b.name}
                          <span className="text-gray-500 ml-1 text-xs">({count})</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status filter */}
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
                  Status
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {ALL_STATUSES.map((s) => {
                    const count = policies.filter((p) => p.status === s).length;
                    if (count === 0) return null;
                    return (
                      <label
                        key={s}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStatuses.has(s)}
                          onChange={() => toggleStatus(s)}
                          className="w-4 h-4 accent-green-500 rounded"
                        />
                        <span className="text-gray-300 text-sm group-hover:text-white">
                          {s}
                          <span className="text-gray-500 ml-1 text-xs">({count})</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Policy groups */}
          <div className="p-6 space-y-8">
            {grouped.size === 0 && (
              <p className="text-gray-500 text-sm">
                No policies match the selected filters.
              </p>
            )}
            {ALL_BUCKETS.filter((b) => grouped.has(b.id)).map((b) => (
              <div key={b.id}>
                <h3 className="text-green-400 font-semibold text-sm uppercase tracking-wider mb-3">
                  {b.name}
                </h3>
                <div className="grid gap-3">
                  {grouped.get(b.id)!.map((p, i) => (
                    <div
                      key={i}
                      className="bg-gray-800 rounded-xl p-4 border border-gray-700"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-gray-100 text-sm font-medium leading-snug">
                          {p.policy_name}
                        </p>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="flex gap-3 mt-2">
                        {p.start_year && (
                          <span className="text-gray-400 text-xs">
                            Since {p.start_year}
                          </span>
                        )}
                        {p.scope && (
                          <span className="text-gray-500 text-xs capitalize">
                            · {p.scope}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "In force":       "bg-green-900 text-green-300 border border-green-700",
    "In preparation": "bg-yellow-900 text-yellow-300 border border-yellow-700",
    "Ended":          "bg-gray-700 text-gray-400 border border-gray-600",
  };
  const cls = styles[status] ?? "bg-gray-700 text-gray-400 border border-gray-600";
  return (
    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}
