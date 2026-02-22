"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

type CO2Point = {
  year: number;
  co2_per_capita: number;
  co2_per_gdp: number;
};

type EnergyPoint = {
  year: number;
  clean_capacity_mw: number;
  total_capacity_mw: number;
  clean_share: number;
};

type TopicSummary = {
  topic: string;
  total: number;
  active: number;
};

type PolicyRecord = {
  title: string;
  topic: string;
  family: string | null;
  year: number | null;
  status: string;
};

type Props = {
  iso3: string;
  name: string;
  region: string;
  co2Series: CO2Point[];
  energySeries: EnergyPoint[];
  topicSummary: TopicSummary[];
  totalPolicies: number;
  activePolicies: number;
  activePolicyList: PolicyRecord[];
};

const TOPIC_COLORS: Record<string, string> = {
  "Buildings": "#f59e0b",
  "Power & Electricity": "#3b82f6",
  "Transport": "#8b5cf6",
  "Economy-wide": "#10b981",
  "Fuels & Energy Supply": "#ef4444",
  "Just & Clean Energy Transitions": "#06b6d4",
  "Technology & Innovation": "#ec4899",
  "Industry": "#f97316",
  "Methane Abatement": "#84cc16",
  "Critical Minerals": "#6366f1",
};

const TOPIC_ICONS: Record<string, string> = {
  "Buildings": "🏠",
  "Power & Electricity": "⚡",
  "Transport": "🚗",
  "Economy-wide": "🌍",
  "Fuels & Energy Supply": "⛽",
  "Just & Clean Energy Transitions": "☀️",
  "Technology & Innovation": "🔬",
  "Industry": "🏭",
  "Methane Abatement": "♻️",
  "Critical Minerals": "⛏️",
};

export default function CountryDeepDive({
  name,
  region,
  co2Series,
  energySeries,
  topicSummary,
  totalPolicies,
  activePolicies,
  activePolicyList,
}: Props) {
  const router = useRouter();
  const [policySearch, setPolicySearch] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [showAllPolicies, setShowAllPolicies] = useState(false);

  // Compute energy data with fossil share for stacked area
  const stackedEnergy = energySeries.map((d) => ({
    year: d.year,
    clean_mw: d.clean_capacity_mw,
    fossil_mw: Math.max(0, d.total_capacity_mw - d.clean_capacity_mw),
    clean_share: d.clean_share,
  }));

  // Latest energy snapshot
  const latestEnergy = energySeries.length > 0 ? energySeries[energySeries.length - 1] : null;

  // CO2 trend
  const latestCO2 = co2Series.length > 0 ? co2Series[co2Series.length - 1] : null;
  const earliestCO2 = co2Series.length > 0 ? co2Series[0] : null;
  const co2Change = latestCO2 && earliestCO2
    ? ((latestCO2.co2_per_capita - earliestCO2.co2_per_capita) / earliestCO2.co2_per_capita * 100)
    : null;

  // Clean energy share change
  const earliestEnergy = energySeries.length > 0 ? energySeries[0] : null;
  const cleanShareChange = latestEnergy && earliestEnergy
    ? (latestEnergy.clean_share - earliestEnergy.clean_share)
    : null;

  // Policy effectiveness = active / total ratio
  const policyBarData = topicSummary.map((t) => ({
    topic: t.topic,
    active: t.active,
    inactive: t.total - t.active,
    effectiveness: t.total > 0 ? Math.round((t.active / t.total) * 100) : 0,
  }));

  // Filter active policies for the table
  const allTopics = [...new Set(activePolicyList.map((p) => p.topic))].sort();
  const filteredPolicies = activePolicyList.filter((p) => {
    const matchesTopic = topicFilter === "all" || p.topic === topicFilter;
    const matchesSearch = !policySearch || p.title.toLowerCase().includes(policySearch.toLowerCase());
    return matchesTopic && matchesSearch;
  });
  const displayedPolicies = showAllPolicies ? filteredPolicies : filteredPolicies.slice(0, 20);

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <button
        onClick={() => router.push("/")}
        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <span>&larr;</span> Back to Globe
      </button>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">{name}</h1>
          <span className="text-gray-400 text-sm">{region}</span>
        </div>

        {/* Key stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {latestEnergy && (
            <>
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <div className="text-xs text-gray-500 mb-1">Clean Energy Share</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {latestEnergy.clean_share.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">{latestEnergy.year}</div>
              </div>
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <div className="text-xs text-gray-500 mb-1">Total Capacity</div>
                <div className="text-2xl font-bold text-blue-400">
                  {latestEnergy.total_capacity_mw >= 1000
                    ? `${(latestEnergy.total_capacity_mw / 1000).toFixed(1)} GW`
                    : `${latestEnergy.total_capacity_mw.toFixed(0)} MW`}
                </div>
                <div className="text-xs text-gray-500 mt-1">{latestEnergy.year}</div>
              </div>
            </>
          )}
          {latestCO2 && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="text-xs text-gray-500 mb-1">CO2 per Capita</div>
              <div className="text-2xl font-bold text-orange-400">
                {latestCO2.co2_per_capita.toFixed(1)}t
              </div>
              <div className="text-xs text-gray-500 mt-1">{latestCO2.year}</div>
            </div>
          )}
          {co2Change !== null && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="text-xs text-gray-500 mb-1">CO2/Capita Trend</div>
              <div className={`text-2xl font-bold ${co2Change <= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {co2Change > 0 ? "+" : ""}{co2Change.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">since {earliestCO2!.year}</div>
            </div>
          )}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="text-xs text-gray-500 mb-1">Active Policies</div>
            <div className="text-2xl font-bold text-cyan-400">
              {activePolicies}
            </div>
            <div className="text-xs text-gray-500 mt-1">of {totalPolicies} total</div>
          </div>
        </div>

        {/* Clean Energy Share Trend (small sparkline-style) */}
        {energySeries.length > 1 && cleanShareChange !== null && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold">Clean Energy Share Over Time</h2>
              <div className={`text-sm font-bold ${cleanShareChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {cleanShareChange >= 0 ? "+" : ""}{cleanShareChange.toFixed(1)} pp since {earliestEnergy!.year}
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Percentage of total installed capacity from renewable sources
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={energySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="year" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#9CA3AF" }}
                  formatter={((value: number) => [`${(value ?? 0).toFixed(1)}%`, "Clean Share"]) as any}
                />
                <Area
                  type="monotone"
                  dataKey="clean_share"
                  stroke="#22c55e"
                  fill="#22c55e20"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Renewable Energy Capacity Chart */}
        {stackedEnergy.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-1">
              Energy Capacity Breakdown
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Clean vs fossil power generation capacity (MW)
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={stackedEnergy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="year" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "Capacity (MW)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#9CA3AF", fontSize: 12 },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#9CA3AF" }}
                  formatter={((value: number, name: string) => {
                    const label = name === "clean_mw" ? "Clean" : "Fossil";
                    return [`${(value ?? 0).toFixed(0)} MW`, label];
                  }) as any}
                />
                <Legend
                  formatter={(value: string) =>
                    value === "clean_mw" ? "Clean Energy" : "Fossil Fuel"
                  }
                />
                <Area
                  type="monotone"
                  dataKey="fossil_mw"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef444440"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="clean_mw"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#22c55e40"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* CO2 Emissions Chart */}
        {co2Series.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-1">
              CO2 Emissions Over Time
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Carbon intensity per capita and per unit GDP
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={co2Series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="year"
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#60A5FA"
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "CO2 per Capita (t)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#60A5FA", fontSize: 12 },
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#F472B6"
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "CO2 per GDP (kg/$)",
                    angle: 90,
                    position: "insideRight",
                    style: { fill: "#F472B6", fontSize: 12 },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#9CA3AF" }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="co2_per_capita"
                  name="CO2 per Capita (tonnes)"
                  stroke="#60A5FA"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="co2_per_gdp"
                  name="CO2 per GDP (kg/$)"
                  stroke="#F472B6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Policy Effectiveness Section */}
        {topicSummary.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold">Policy Landscape</h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-400">
                  {totalPolicies} total
                </span>
                <span className="text-emerald-400 font-medium">
                  {activePolicies} active
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              Active vs inactive policies by sector — higher active share indicates sustained policy commitment
            </p>

            {/* Horizontal stacked bar chart */}
            <ResponsiveContainer width="100%" height={topicSummary.length * 44 + 40}>
              <BarChart
                data={policyBarData}
                layout="vertical"
                margin={{ left: 160, right: 40, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="topic"
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                  width={150}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#9CA3AF" }}
                  formatter={((value: number, name: string) => {
                    const label = name === "active" ? "Active" : "Inactive";
                    return [value ?? 0, label];
                  }) as any}
                />
                <Legend
                  formatter={(value: string) =>
                    value === "active" ? "Active Policies" : "Inactive Policies"
                  }
                />
                <Bar dataKey="active" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="inactive" stackId="a" fill="#6b7280" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Topic cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              {topicSummary.map((t) => {
                const eff = t.total > 0 ? Math.round((t.active / t.total) * 100) : 0;
                return (
                  <div
                    key={t.topic}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50"
                  >
                    <span className="text-xl">{TOPIC_ICONS[t.topic] ?? "📋"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.topic}</div>
                      <div className="text-xs text-gray-500">
                        {t.active} active / {t.total} total
                      </div>
                    </div>
                    <div
                      className="text-sm font-bold"
                      style={{ color: TOPIC_COLORS[t.topic] ?? "#9CA3AF" }}
                    >
                      {eff}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Policy Table */}
        {activePolicyList.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold">Active Policies</h2>
              <span className="text-sm text-emerald-400 font-medium">{activePolicyList.length} policies</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Currently enforced climate and energy policies
            </p>

            {/* Search & filter controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                placeholder="Search policies..."
                value={policySearch}
                onChange={(e) => { setPolicySearch(e.target.value); setShowAllPolicies(false); }}
                className="flex-1 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none placeholder-gray-500"
              />
              <select
                value={topicFilter}
                onChange={(e) => { setTopicFilter(e.target.value); setShowAllPolicies(false); }}
                className="px-3 py-2 bg-gray-800 text-white text-sm rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All sectors</option>
                {allTopics.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-400 font-medium">Policy Name</th>
                    <th className="text-left py-2 px-3 text-gray-400 font-medium">Sector</th>
                    <th className="text-left py-2 px-3 text-gray-400 font-medium">Type</th>
                    <th className="text-left py-2 px-3 text-gray-400 font-medium">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPolicies.map((p, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-2 px-3 text-gray-200 max-w-md">
                        <div className="truncate" title={p.title}>{p.title}</div>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
                          style={{
                            color: TOPIC_COLORS[p.topic] ?? "#9CA3AF",
                            borderColor: (TOPIC_COLORS[p.topic] ?? "#9CA3AF") + "40",
                            backgroundColor: (TOPIC_COLORS[p.topic] ?? "#9CA3AF") + "10",
                          }}
                        >
                          {TOPIC_ICONS[p.topic] ?? "📋"} {p.topic}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-400 text-xs whitespace-nowrap">
                        {p.family ?? "—"}
                      </td>
                      <td className="py-2 px-3 text-gray-400 font-mono text-xs">
                        {p.year ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Show more / results count */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Showing {displayedPolicies.length} of {filteredPolicies.length} policies
              </span>
              {!showAllPolicies && filteredPolicies.length > 20 && (
                <button
                  onClick={() => setShowAllPolicies(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Show all {filteredPolicies.length} policies
                </button>
              )}
              {showAllPolicies && filteredPolicies.length > 20 && (
                <button
                  onClick={() => setShowAllPolicies(false)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Show fewer
                </button>
              )}
            </div>
          </div>
        )}

        {/* No data fallback */}
        {co2Series.length === 0 && energySeries.length === 0 && topicSummary.length === 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <p className="text-gray-500 text-lg">
              No data available for this country.
            </p>
          </div>
        )}

        {/* Data sources */}
        <div className="mt-6 text-xs text-gray-500 space-y-1">
          <p>CO2 data: <span className="text-gray-400">Our World in Data / Global Carbon Budget 2024</span></p>
          <p>Energy capacity: <span className="text-gray-400">IRENA Renewable Capacity Statistics 2024</span></p>
          <p>Policy data: <span className="text-gray-400">IEA/OECD Climate Policy Tracker</span></p>
        </div>
      </div>
    </main>
  );
}
