"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  ZAxis,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

/* ---------- types ---------- */

type SectorCorrelation = {
  name: string;
  code: string;
  n: number;
  r_co2_capita: number | null;
  p_co2_capita: number | null;
  r_co2_gdp: number | null;
  p_co2_gdp: number | null;
};

type InstrumentEffect = {
  instrument: string;
  type_code: string;
  avg_co2_with: number | null;
  avg_co2_without: number | null;
  difference: number | null;
  countries_with: number;
  r: number | null;
  p: number | null;
  significant: boolean;
};

type BindingTarget = {
  n: number;
  binding_r: number | null;
  binding_p: number | null;
  target_r: number | null;
  target_p: number | null;
};

type Cocktail = {
  combo: string;
  combo_codes: string[];
  n: number;
  avg_co2_gdp: number;
  median_co2_gdp: number;
};

type ScatterPoint = {
  country: string;
  iso3: string;
  co2_per_capita: number;
  co2_per_gdp: number;
  total_policies: number;
  active_policies: number;
  top_sector: string | null;
  population: number | null;
  gdp_usd: number | null;
  policy_density: number | null;
  sectors: Record<string, number>;
};

type AnalysisData = {
  sector_correlations: SectorCorrelation[];
  instrument_effectiveness: InstrumentEffect[];
  binding_target: BindingTarget;
  policy_cocktails: Cocktail[];
  scatter_data: ScatterPoint[];
  top_performers: ScatterPoint[];
  sector_names: Record<string, string>;
  instrument_names: Record<string, string>;
};

/* ---------- constants ---------- */

const SECTOR_COLORS: Record<string, string> = {
  RE: "#22c55e",
  CF: "#3b82f6",
  EEF: "#f59e0b",
  FPD: "#ef4444",
  GRT: "#8b5cf6",
  CPM: "#06b6d4",
  LU: "#84cc16",
};

const SECTOR_ICONS: Record<string, string> = {
  RE: "⚡",
  CF: "🌍",
  EEF: "🏠",
  FPD: "⛽",
  GRT: "🚗",
  CPM: "💰",
  LU: "🌲",
};

const TOOLTIP_STYLE = {
  backgroundColor: "#1F2937",
  border: "1px solid #374151",
  borderRadius: "8px",
  color: "#fff",
};

function sigStars(p: number | null): string {
  if (p === null) return "";
  if (p < 0.001) return "***";
  if (p < 0.01) return "**";
  if (p < 0.05) return "*";
  return "";
}

function sigLabel(p: number | null): string {
  if (p === null) return "n/a";
  if (p < 0.001) return "p < 0.001";
  if (p < 0.01) return `p < 0.01`;
  if (p < 0.05) return `p < 0.05`;
  return "Not significant";
}

/* ---------- component ---------- */

export default function PolicyAnalysis({ data }: { data: AnalysisData }) {
  const router = useRouter();
  const [scatterMetric, setScatterMetric] = useState<"co2_per_capita" | "co2_per_gdp">("co2_per_capita");
  const [scatterColorBy, setScatterColorBy] = useState<"top_sector" | "total_policies">("top_sector");

  // Prepare sector correlation bar data (sorted by r)
  const sectorBarData = [...data.sector_correlations]
    .filter((s) => s.r_co2_capita !== null)
    .sort((a, b) => (a.r_co2_capita ?? 0) - (b.r_co2_capita ?? 0))
    .map((s) => ({
      ...s,
      r_value: s.r_co2_capita!,
      significant: s.p_co2_capita !== null && s.p_co2_capita < 0.05,
      fill: (s.r_co2_capita ?? 0) < 0 ? "#22c55e" : "#ef4444",
    }));

  // Instrument comparison data
  const instrumentBarData = data.instrument_effectiveness
    .filter((ie) => ie.avg_co2_with !== null && ie.avg_co2_without !== null)
    .map((ie) => ({
      instrument: ie.instrument,
      avgWith: ie.avg_co2_with!,
      avgWithout: ie.avg_co2_without!,
      diff: ie.difference!,
      significant: ie.significant,
      r: ie.r,
      p: ie.p,
    }));

  // Top cocktails (best combos)
  const cocktailData = data.policy_cocktails.slice(0, 10).map((c) => ({
    ...c,
    label: c.combo.length > 35 ? c.combo.slice(0, 32) + "..." : c.combo,
  }));

  // Radar chart: top 5 performers' sector distribution (normalized)
  const radarCountries = data.top_performers.slice(0, 5);
  const allSectorCodes = Object.keys(data.sector_names);
  const radarData = allSectorCodes.map((code) => {
    const point: Record<string, string | number> = { sector: data.sector_names[code] };
    radarCountries.forEach((c) => {
      const total = c.total_policies || 1;
      point[c.iso3] = Math.round(((c.sectors[code] || 0) / total) * 100);
    });
    return point;
  });

  const RADAR_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];

  // Scatter data
  const scatterPoints = data.scatter_data
    .filter((d) => d.total_policies >= 5 && d.co2_per_capita < 50)
    .map((d) => ({
      ...d,
      x: d.total_policies,
      y: scatterMetric === "co2_per_capita" ? d.co2_per_capita : d.co2_per_gdp,
      z: d.population ? Math.sqrt(d.population / 1e6) * 3 : 20,
    }));

  // Binding/target stat cards
  const bt = data.binding_target;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <button
        onClick={() => router.push("/")}
        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <span>&larr;</span> Back to Globe
      </button>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">
            Policy Impact on CO2 Emissions
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl">
            Which types of climate policies are associated with statistically
            significant reductions in national CO2 emissions?
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Cross-sectional analysis of {data.scatter_data.length} countries with
            12,470 climate policies. Correlations measure whether countries that
            emphasize a given policy type tend to have lower carbon intensity.
          </p>
        </div>

        {/* ===== KEY FINDING CARDS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {/* Strongest reducer */}
          {(() => {
            const best = sectorBarData[0];
            return (
              <div className="bg-gray-900 rounded-xl border border-emerald-800/50 p-5">
                <div className="text-xs text-emerald-400 font-medium mb-1 uppercase tracking-wide">
                  Strongest CO2 Reducer
                </div>
                <div className="text-2xl font-bold text-emerald-400 mb-1">
                  {SECTOR_ICONS[best.code]} {best.name}
                </div>
                <div className="text-sm text-gray-400">
                  r = {best.r_co2_capita?.toFixed(3)} {sigStars(best.p_co2_capita)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {sigLabel(best.p_co2_capita)} &middot; n={best.n}
                </div>
              </div>
            );
          })()}

          {/* Best instrument */}
          {(() => {
            const sigInst = instrumentBarData.filter((ie) => ie.significant);
            const bestInst = sigInst.length > 0 ? sigInst[0] : instrumentBarData[0];
            return (
              <div className="bg-gray-900 rounded-xl border border-blue-800/50 p-5">
                <div className="text-xs text-blue-400 font-medium mb-1 uppercase tracking-wide">
                  Most Effective Instrument
                </div>
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {bestInst.instrument}
                </div>
                <div className="text-sm text-gray-400">
                  r = {bestInst.r?.toFixed(3)} {sigStars(bestInst.p)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {sigLabel(bestInst.p)}
                </div>
              </div>
            );
          })()}

          {/* Best cocktail */}
          <div className="bg-gray-900 rounded-xl border border-purple-800/50 p-5">
            <div className="text-xs text-purple-400 font-medium mb-1 uppercase tracking-wide">
              Best Policy Combination
            </div>
            <div className="text-xl font-bold text-purple-400 mb-1">
              {cocktailData[0]?.combo}
            </div>
            <div className="text-sm text-gray-400">
              Avg CO2/GDP: {cocktailData[0]?.avg_co2_gdp.toFixed(3)} kg/$
            </div>
            <div className="text-xs text-gray-500 mt-1">
              n={cocktailData[0]?.n} countries
            </div>
          </div>
        </div>

        {/* ===== SECTION 1: Sector Correlation Bar Chart ===== */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-1">
            Policy Sector vs CO2 per Capita
          </h2>
          <p className="text-xs text-gray-500 mb-1">
            Pearson correlation between each sector&apos;s share of a country&apos;s
            policy portfolio and its CO2 emissions per capita.
          </p>
          <p className="text-xs text-gray-500 mb-5">
            <span className="text-emerald-400">Green (negative r)</span> = higher
            share correlates with <em>lower</em> CO2.{" "}
            <span className="text-red-400">Red (positive r)</span> = higher share
            correlates with <em>higher</em> CO2.
          </p>
          <ResponsiveContainer width="100%" height={sectorBarData.length * 55 + 60}>
            <BarChart
              data={sectorBarData}
              layout="vertical"
              margin={{ left: 180, right: 40, top: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis
                type="number"
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                domain={[-0.5, 0.5]}
                tickFormatter={(v: number) => v.toFixed(2)}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#9CA3AF"
                tick={{ fontSize: 13 }}
                width={170}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "#9CA3AF" }}
                formatter={((value: number, _name: string, entry: { payload: typeof sectorBarData[number] }) => {
                  const p = entry.payload;
                  return [
                    `r = ${(value ?? 0).toFixed(4)} ${sigStars(p.p_co2_capita)} (${sigLabel(p.p_co2_capita)})`,
                    "Correlation",
                  ];
                }) as never}
              />
              <Bar dataKey="r_value" radius={[0, 4, 4, 0]}>
                {sectorBarData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.fill}
                    fillOpacity={entry.significant ? 1 : 0.35}
                    stroke={entry.significant ? (entry.r_value < 0 ? "#16a34a" : "#dc2626") : "transparent"}
                    strokeWidth={entry.significant ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Significant (p &lt; 0.05)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-emerald-500/35 inline-block" /> Not significant
            </span>
          </div>
        </div>

        {/* ===== SECTION 2: Instrument Effectiveness ===== */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-1">
            Policy Instrument Effectiveness
          </h2>
          <p className="text-xs text-gray-500 mb-5">
            Average CO2 per capita (tonnes) for countries that use each
            instrument type vs those that don&apos;t.
            Bordered bars indicate statistically significant density-CO2
            correlation (p &lt; 0.05).
          </p>
          <ResponsiveContainer width="100%" height={instrumentBarData.length * 44 + 60}>
            <BarChart
              data={instrumentBarData}
              layout="vertical"
              margin={{ left: 160, right: 40, top: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis
                type="number"
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                label={{
                  value: "Avg CO2/Capita (tonnes)",
                  position: "insideBottom",
                  offset: -5,
                  style: { fill: "#9CA3AF", fontSize: 12 },
                }}
              />
              <YAxis
                type="category"
                dataKey="instrument"
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                width={150}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "#9CA3AF" }}
                formatter={((value: number, name: string) => [
                  `${(value ?? 0).toFixed(2)} t/cap`,
                  name === "avgWith" ? "Countries Using" : "Countries Not Using",
                ]) as never}
              />
              <Legend
                formatter={(value: string) =>
                  value === "avgWith" ? "Countries With Instrument" : "Countries Without"
                }
              />
              <Bar dataKey="avgWith" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                {instrumentBarData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill="#3b82f6"
                    fillOpacity={entry.significant ? 1 : 0.5}
                    stroke={entry.significant ? "#60a5fa" : "transparent"}
                    strokeWidth={entry.significant ? 2 : 0}
                  />
                ))}
              </Bar>
              <Bar dataKey="avgWithout" fill="#6b7280" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ===== SECTION 3: Best Policy Cocktails ===== */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-1">
            Best Policy Sector Combinations
          </h2>
          <p className="text-xs text-gray-500 mb-5">
            Average CO2 per GDP (kg/$) for countries grouped by their top-2
            policy sectors. Lower is better.
          </p>
          <ResponsiveContainer width="100%" height={cocktailData.length * 44 + 60}>
            <BarChart
              data={cocktailData}
              layout="vertical"
              margin={{ left: 260, right: 40, top: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis
                type="number"
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                label={{
                  value: "Avg CO2 per GDP (kg/$)",
                  position: "insideBottom",
                  offset: -5,
                  style: { fill: "#9CA3AF", fontSize: 12 },
                }}
              />
              <YAxis
                type="category"
                dataKey="combo"
                stroke="#9CA3AF"
                tick={{ fontSize: 11 }}
                width={250}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "#9CA3AF" }}
                formatter={((value: number) => [
                  `${(value ?? 0).toFixed(4)} kg/$`,
                  "CO2/GDP",
                ]) as never}
              />
              <Bar dataKey="avg_co2_gdp" radius={[0, 4, 4, 0]}>
                {cocktailData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={`hsl(${150 + i * 15}, 60%, ${45 + i * 3}%)`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
            {cocktailData.slice(0, 6).map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: `hsl(${150 + i * 15}, 60%, 25%)`,
                    color: `hsl(${150 + i * 15}, 60%, 70%)`,
                  }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{c.combo}</div>
                  <div className="text-xs text-gray-500">
                    {c.n} countries &middot; median {c.median_co2_gdp.toFixed(3)} kg/$
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== SECTION 4: Scatter Plot ===== */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="text-xl font-semibold mb-1">
                Policy Count vs Carbon Intensity
              </h2>
              <p className="text-xs text-gray-500">
                Each bubble is a country. Size proportional to population.
              </p>
            </div>
            <div className="flex gap-3">
              <select
                value={scatterMetric}
                onChange={(e) => setScatterMetric(e.target.value as "co2_per_capita" | "co2_per_gdp")}
                className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg border border-gray-700"
              >
                <option value="co2_per_capita">CO2 / Capita</option>
                <option value="co2_per_gdp">CO2 / GDP</option>
              </select>
              <select
                value={scatterColorBy}
                onChange={(e) => setScatterColorBy(e.target.value as "top_sector" | "total_policies")}
                className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg border border-gray-700"
              >
                <option value="top_sector">Color by Top Sector</option>
                <option value="total_policies">Color by Policy Count</option>
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={450}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="x"
                name="Total Policies"
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                label={{
                  value: "Total Policies",
                  position: "insideBottom",
                  offset: -10,
                  style: { fill: "#9CA3AF", fontSize: 12 },
                }}
              />
              <YAxis
                dataKey="y"
                name={scatterMetric === "co2_per_capita" ? "CO2/Capita (t)" : "CO2/GDP (kg/$)"}
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                label={{
                  value: scatterMetric === "co2_per_capita" ? "CO2/Capita (t)" : "CO2/GDP (kg/$)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "#9CA3AF", fontSize: 12 },
                }}
              />
              <ZAxis dataKey="z" range={[30, 400]} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "#9CA3AF" }}
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;
                  const d = payload[0].payload as ScatterPoint & { x: number; y: number };
                  return (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm">
                      <div className="font-bold text-white">{d.country}</div>
                      <div className="text-gray-400">
                        {d.total_policies} policies &middot;{" "}
                        {scatterMetric === "co2_per_capita"
                          ? `${d.co2_per_capita.toFixed(2)} t/cap`
                          : `${d.co2_per_gdp.toFixed(3)} kg/$`}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        Top sector: {data.sector_names[d.top_sector ?? ""] ?? d.top_sector}
                      </div>
                    </div>
                  );
                }}
              />
              <Scatter data={scatterPoints}>
                {scatterPoints.map((entry, i) => {
                  let color = "#6b7280";
                  if (scatterColorBy === "top_sector" && entry.top_sector) {
                    color = SECTOR_COLORS[entry.top_sector] ?? "#6b7280";
                  } else if (scatterColorBy === "total_policies") {
                    const intensity = Math.min(entry.total_policies / 500, 1);
                    const h = 200 - intensity * 180;
                    color = `hsl(${h}, 70%, 55%)`;
                  }
                  return <Cell key={i} fill={color} fillOpacity={0.7} />;
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          {scatterColorBy === "top_sector" && (
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
              {Object.entries(data.sector_names).map(([code, name]) => (
                <span key={code} className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: SECTOR_COLORS[code] }}
                  />
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ===== SECTION 5: Radar - Top Performer Policy Mix ===== */}
        {radarCountries.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-1">
              Policy Mix of Top Performers
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Sector distribution (% of portfolio) for the 5 countries with
              lowest CO2/GDP and 20+ policies. Shows which sectors the
              cleanest economies prioritize.
            </p>
            <ResponsiveContainer width="100%" height={420}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="sector" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis stroke="#4B5563" tick={{ fontSize: 10 }} />
                {radarCountries.map((c, i) => (
                  <Radar
                    key={c.iso3}
                    name={c.country}
                    dataKey={c.iso3}
                    stroke={RADAR_COLORS[i]}
                    fill={RADAR_COLORS[i]}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                ))}
                <Legend />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ===== SECTION 6: Binding / Quantified Target ===== */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-1">
            Do Legally Binding Policies & Quantified Targets Matter?
          </h2>
          <p className="text-xs text-gray-500 mb-5">
            Correlation between the share of a country&apos;s policies that are
            legally binding (or have quantified targets) and its CO2 per capita.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-5">
              <div className="text-sm text-gray-400 mb-2">Legally Binding Share vs CO2/Capita</div>
              <div className={`text-3xl font-bold ${bt.binding_r !== null && bt.binding_r < 0 ? "text-emerald-400" : "text-gray-300"}`}>
                r = {bt.binding_r?.toFixed(4) ?? "n/a"}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {sigLabel(bt.binding_p)} &middot; n={bt.n}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {bt.binding_r !== null && bt.binding_r < 0
                  ? "Weak negative trend: countries with more legally binding policies tend to have slightly lower CO2, but the relationship is not statistically significant."
                  : "No meaningful relationship detected."}
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-5">
              <div className="text-sm text-gray-400 mb-2">Quantified Targets Share vs CO2/Capita</div>
              <div className={`text-3xl font-bold ${bt.target_r !== null && bt.target_r < 0 ? "text-emerald-400" : "text-gray-300"}`}>
                r = {bt.target_r?.toFixed(4) ?? "n/a"}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {sigLabel(bt.target_p)} &middot; n={bt.n}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {bt.target_r !== null && bt.target_r < 0
                  ? "Negligible negative correlation. Having quantified targets alone does not predict lower emissions — implementation quality matters more."
                  : "No meaningful relationship detected."}
              </p>
            </div>
          </div>
        </div>

        {/* ===== SECTION 7: Top Performers Table ===== */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-1">
            Lowest Carbon Intensity (with 20+ Policies)
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Countries that combine extensive policy portfolios with the lowest
            CO2 per GDP — demonstrating effective decarbonization.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">#</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Country</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">CO2/GDP (kg/$)</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">CO2/Capita (t)</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Policies</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Top Sector</th>
                </tr>
              </thead>
              <tbody>
                {data.top_performers.map((c, i) => (
                  <tr
                    key={c.iso3}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/country/${c.iso3}`)}
                  >
                    <td className="py-2 px-3 text-gray-500 font-mono">{i + 1}</td>
                    <td className="py-2 px-3 text-gray-200 font-medium">{c.country}</td>
                    <td className="py-2 px-3 text-right text-emerald-400 font-mono">
                      {c.co2_per_gdp.toFixed(3)}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-300 font-mono">
                      {c.co2_per_capita.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-300 font-mono">
                      {c.total_policies}
                    </td>
                    <td className="py-2 px-3">
                      {c.top_sector && (
                        <span
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
                          style={{
                            color: SECTOR_COLORS[c.top_sector] ?? "#9CA3AF",
                            borderColor: (SECTOR_COLORS[c.top_sector] ?? "#9CA3AF") + "40",
                            backgroundColor: (SECTOR_COLORS[c.top_sector] ?? "#9CA3AF") + "10",
                          }}
                        >
                          {SECTOR_ICONS[c.top_sector] ?? ""}{" "}
                          {data.sector_names[c.top_sector] ?? c.top_sector}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== METHODOLOGY ===== */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Methodology</h2>
          <div className="text-sm text-gray-400 space-y-2">
            <p>
              <strong className="text-gray-300">Correlation analysis:</strong>{" "}
              Pearson correlation (r) between each policy dimension&apos;s share
              of a country&apos;s portfolio and its current CO2 emissions.
              Significance tested via two-tailed t-test approximation.
            </p>
            <p>
              <strong className="text-gray-300">Sector density:</strong>{" "}
              Computed as (sector policy count / total policies) per country,
              avoiding bias toward large economies with more policies overall.
            </p>
            <p>
              <strong className="text-gray-300">Policy cocktails:</strong>{" "}
              Countries grouped by their top-2 sectors (by count). Average
              CO2/GDP compared across groups with n &ge; 3.
            </p>
            <p>
              <strong className="text-gray-300">Limitations:</strong>{" "}
              Cross-sectional correlation does not imply causation. Wealthier
              nations may simultaneously afford more policies and have lower
              carbon intensity due to structural factors.
            </p>
          </div>
        </div>

        {/* Data sources */}
        <div className="mt-6 text-xs text-gray-500 space-y-1 pb-8">
          <p>Policy data: <span className="text-gray-400">IEA/OECD Climate Policy Tracker — 12,470 policies across 217 jurisdictions</span></p>
          <p>CO2 data: <span className="text-gray-400">Our World in Data / Global Carbon Budget 2024</span></p>
        </div>
      </div>
    </main>
  );
}
