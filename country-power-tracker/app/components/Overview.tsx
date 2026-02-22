"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

type CountryScatter = {
  iso3: string;
  name: string;
  gepi_score: number;
  policy_count: number;
};

type Co2Change = {
  iso3: string;
  name: string;
  start_year: number;
  end_year: number;
  pct_change: number;
};

type PolicyMixEntry = {
  bucket_id: string;
  bucket_name: string;
  count: number;
  pct: number;
};

type OverviewData = {
  co2_gdp_changes: Co2Change[];
  scatter_data: CountryScatter[];
  policy_mix_top_performers: PolicyMixEntry[];
};

type Country = {
  iso3: string;
  name: string;
  green_score: number | null;
};

type Props = {
  data: OverviewData;
  countries: Country[];
};

const CHART_COLORS = {
  grid: "#374151",
  axis: "#9ca3af",
  scatter: "#22c55e",
  bar: "#22c55e",
  tooltip: { background: "#1f2937", border: "none", color: "#f9fafb" },
};

export default function Overview({ data, countries }: Props) {
  const scored = countries.filter((c) => c.green_score !== null);
  const avgScore =
    scored.length > 0
      ? (
          scored.reduce((s, c) => s + (c.green_score ?? 0), 0) / scored.length
        ).toFixed(1)
      : "—";

  // Most-improved country (largest negative pct_change = biggest CO2/GDP reduction)
  const bestImproved = data.co2_gdp_changes[0];

  // Cap bars at max absolute change for width scaling
  const maxAbs = Math.max(...data.co2_gdp_changes.slice(0, 10).map((c) => Math.abs(c.pct_change)));

  return (
    <div className="w-full max-w-5xl mt-12 mb-8">
      <h2 className="text-white text-2xl font-bold mb-6">Global Overview</h2>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Countries Tracked</div>
          <div className="text-white text-3xl font-bold">{scored.length}</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Avg GEPI Score</div>
          <div className="text-white text-3xl font-bold">{avgScore}</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Best CO₂/GDP Change (10 yr)</div>
          <div className="text-green-400 text-3xl font-bold">
            {bestImproved ? `${bestImproved.pct_change.toFixed(1)}%` : "—"}
          </div>
          <div className="text-gray-400 text-xs mt-1">{bestImproved?.name}</div>
        </div>
      </div>

      {/* ── Policy Count vs GEPI Score scatter ─────────────────────────── */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 mb-6">
        <h3 className="text-white font-semibold text-lg mb-1">
          Policy Count vs GEPI Score
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Each dot represents a country. Countries with more active policies tend to
          score higher on the GEPI index.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="policy_count"
              name="Active Policies"
              stroke={CHART_COLORS.axis}
              tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
              label={{
                value: "Active Policies",
                position: "insideBottom",
                offset: -15,
                fill: CHART_COLORS.axis,
                fontSize: 12,
              }}
            />
            <YAxis
              dataKey="gepi_score"
              name="GEPI Score"
              domain={[0, 100]}
              stroke={CHART_COLORS.axis}
              tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
              label={{
                value: "GEPI Score",
                angle: -90,
                position: "insideLeft",
                offset: 10,
                fill: CHART_COLORS.axis,
                fontSize: 12,
              }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ payload }) => {
                if (payload && payload.length > 0) {
                  const d = payload[0].payload as CountryScatter;
                  return (
                    <div className="bg-gray-800 text-gray-100 text-xs p-2 rounded border border-gray-600">
                      <div className="font-semibold">{d.name}</div>
                      <div>Policies: {d.policy_count}</div>
                      <div>GEPI: {d.gepi_score}</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter
              data={data.scatter_data}
              fill={CHART_COLORS.scatter}
              opacity={0.65}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* ── Two-column: CO2/GDP changes + Policy mix ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CO2/GDP % change — last 10 years */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
          <h3 className="text-white font-semibold text-lg mb-1">
            CO₂/GDP Change — Last 10 Years
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Top countries by reduction in CO₂ emissions per unit of GDP
          </p>
          <div className="space-y-3">
            {data.co2_gdp_changes.slice(0, 10).map((c) => (
              <div key={c.iso3} className="flex items-center gap-3">
                <div className="text-gray-300 text-xs w-28 truncate shrink-0">
                  {c.name}
                </div>
                <div className="flex-1 h-2.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${(Math.abs(c.pct_change) / maxAbs) * 100}%`,
                    }}
                  />
                </div>
                <div className="text-green-400 text-xs w-14 text-right shrink-0">
                  {c.pct_change.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Policy mix — top GEPI performers */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
          <h3 className="text-white font-semibold text-lg mb-1">
            Policy Mix — Top GEPI Performers
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            % of top-25% GEPI countries with active policies in each sector
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data.policy_mix_top_performers}
              layout="vertical"
              margin={{ top: 0, right: 30, bottom: 0, left: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.grid}
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                stroke={CHART_COLORS.axis}
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                dataKey="bucket_id"
                type="category"
                stroke={CHART_COLORS.axis}
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                width={38}
              />
              <Tooltip
                formatter={(v: number | undefined) => v !== undefined ? `${v}%` : ""}
                contentStyle={CHART_COLORS.tooltip}
                labelStyle={{ color: "#f9fafb" }}
              />
              <Bar dataKey="pct" fill={CHART_COLORS.bar} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
