"use client";

import { useRouter } from "next/navigation";
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

type SeriesPoint = {
  year: number;
  co2_per_capita: number;
  co2_per_gdp: number;
};

type Props = {
  iso3: string;
  name: string;
  greenScore: number | null;
  region: string;
  series: SeriesPoint[];
};

export default function CountryDeepDive({
  name,
  greenScore,
  region,
  series,
}: Props) {
  const router = useRouter();

  const getScoreColor = (score: number) => {
    if (score >= 60) return "text-green-500";
    if (score >= 40) return "text-yellow-400";
    return "text-red-500";
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <button
        onClick={() => router.push("/")}
        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <span>&larr;</span> Back to Globe
      </button>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{name}</h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">{region}</span>
            {greenScore !== null && (
              <span
                className={`font-bold text-lg ${getScoreColor(greenScore)}`}
              >
                EPI Score: {greenScore.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Chart */}
        {series.length > 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold mb-4">
              CO2 Emissions Over Time
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={series}>
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
        ) : (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <p className="text-gray-500 text-lg">
              No emissions data available for this country.
            </p>
          </div>
        )}

        {/* Data sources */}
        <div className="mt-6 text-xs text-gray-500 space-y-1">
          <p>EPI scores: <span className="text-gray-400">Yale Center for Environmental Law &amp; Policy — Environmental Performance Index (EPI) 2024</span></p>
          <p>CO2 data: <span className="text-gray-400">Our World in Data / Global Carbon Budget 2024</span></p>
        </div>
      </div>
    </main>
  );
}
