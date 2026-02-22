"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import overviewStats from "../../public/data/overview_stats.json";
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
  Line,
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

type SectorLift = {
  bucket_id: string;
  bucket_name: string;
  lift: number;
  top_in_sector: number;
  total_in_sector: number;
};

type InstrumentLift = {
  instrument_id: string;
  instrument_name: string;
  lift: number;
  top_in_instrument: number;
  total_with_instrument: number;
};

type LiftScores = {
  sector_lifts: SectorLift[];
  instrument_lifts: InstrumentLift[];
  method: string;
  n_countries: number;
  n_top_quartile: number;
};

export type AnalysisData = {
  sector_correlations: SectorCorrelation[];
  instrument_effectiveness: InstrumentEffect[];
  binding_target: BindingTarget;
  policy_cocktails: Cocktail[];
  scatter_data: ScatterPoint[];
  top_performers: ScatterPoint[];
  sector_names: Record<string, string>;
  instrument_names: Record<string, string>;
  lift_scores: LiftScores;
};

export type Co2PcChange5y = Record<
  string,
  {
    pct_change: number;
    start_year: number;
    end_year: number;
    start_value?: number;
    end_value?: number;
    country?: string;
  }
>;

export type Co2GdpChange5y = Record<
  string,
  {
    pct_change: number;
    start_year: number;
    end_year: number;
    start_value?: number;
    end_value?: number;
  }
>;

/* ---------- helpers ---------- */

function linearFit(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) return null;
  let n = 0;
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXY = 0;
  for (const p of points) {
    n++;
    sumX += p.x;
    sumY += p.y;
    sumXX += p.x * p.x;
    sumXY += p.x * p.y;
  }
  const den = n * sumXX - sumX * sumX;
  if (!isFinite(den) || den === 0) return null;
  const m = (n * sumXY - sumX * sumY) / den;
  const b = (sumY - m * sumX) / n;
  if (!isFinite(m) || !isFinite(b)) return null;
  return { m, b };
}

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
  backgroundColor: "#111827",
  border: "1px solid #1f2937",
  borderRadius: "10px",
  color: "#fff",
  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
};

const COLOR_GOOD = "#22c55e"; // green = good (lower emissions / reductions)
const COLOR_BAD = "#ef4444"; // red = bad (higher emissions / increases)
const COLOR_NEUTRAL = "#9ca3af";
const COLOR_NO_DATA = "#334155";
const NON_SIG_OPACITY = 0.35; // visually distinct, but still readable
const AXIS_STROKE = "#9ca3af";

type TabId = "overview" | "sectors" | "instruments" | "lift";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "sectors", label: "Sector Analysis" },
  { id: "instruments", label: "Instrument Analysis" },
  { id: "lift", label: "Lift Scores" },
];

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
  if (p < 0.01) return "p < 0.01";
  if (p < 0.05) return "p < 0.05";
  return "Not significant";
}

function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 3) return null;
  const n = xs.length;
  let sumX = 0, sumY = 0, sumXX = 0, sumYY = 0, sumXY = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i];
    const y = ys[i];
    sumX += x;
    sumY += y;
    sumXX += x * x;
    sumYY += y * y;
    sumXY += x * y;
  }
  const num = n * sumXY - sumX * sumY;
  const denA = n * sumXX - sumX * sumX;
  const denB = n * sumYY - sumY * sumY;
  const den = Math.sqrt(denA * denB);
  if (!isFinite(den) || den === 0) return null;
  return num / den;
}
function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] === undefined) return sorted[base];
  return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
}

function filterPairsByYIqr(xs: number[], ys: number[], k = 1.5) {
  if (xs.length !== ys.length || xs.length < 8) return { xs, ys }; // too small to trim
  const sortedY = [...ys].sort((a, b) => a - b);
  const q1 = quantile(sortedY, 0.25);
  const q3 = quantile(sortedY, 0.75);
  const iqr = q3 - q1;
  if (!isFinite(iqr) || iqr === 0) return { xs, ys };

  const lo = q1 - k * iqr;
  const hi = q3 + k * iqr;

  const fx: number[] = [];
  const fy: number[] = [];
  for (let i = 0; i < ys.length; i++) {
    const y = ys[i];
    if (y < lo || y > hi) continue;
    fx.push(xs[i]);
    fy.push(y);
  }
  return { xs: fx, ys: fy };
}

function erf(x: number): number {
  // Abramowitz & Stegun 7.1.26 approximation
  const sign = x < 0 ? -1 : 1;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const absX = Math.abs(x);
  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function pValueFromPearson(r: number, n: number): number | null {
  // Fisher z-transform normal approximation (fast, reasonable for n>=10)
  if (!isFinite(r) || n < 4) return null;
  const clamped = Math.max(-0.999999, Math.min(0.999999, r));
  const z = 0.5 * Math.log((1 + clamped) / (1 - clamped)) * Math.sqrt(n - 3);
  const p = 2 * (1 - normalCdf(Math.abs(z)));
  if (!isFinite(p)) return null;
  return Math.max(0, Math.min(1, p));
}

function correlationFill(r: number): string {
  if (r < 0) return COLOR_GOOD;
  if (r > 0) return COLOR_BAD;
  return COLOR_NEUTRAL;
}

function correlationTextClass(r: number | null): string {
  if (r === null) return "text-gray-300";
  if (r < 0) return "text-emerald-400";
  if (r > 0) return "text-red-400";
  return "text-gray-300";
}

function correlationSummary(r: number | null, p: number | null, goodMeans: string, badMeans: string): string {
  if (r === null) return "No data available for this estimate.";
  const isSig = p !== null && p < 0.05;
  if (r === 0) return isSig ? "No linear association detected (p < 0.05)." : "No linear association detected.";
  const direction = r < 0 ? goodMeans : badMeans;
  if (isSig) return `Statistically significant association (p < 0.05): ${direction}`;
  return `Association is not statistically significant: ${direction}`;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lerpColor(a: string, b: string, t: number): string {
  const clampT = Math.max(0, Math.min(1, t));
  const parse = (hex: string) => {
    const cleaned = hex.replace("#", "");
    return {
      r: parseInt(cleaned.slice(0, 2), 16),
      g: parseInt(cleaned.slice(2, 4), 16),
      b: parseInt(cleaned.slice(4, 6), 16),
    };
  };
  const ca = parse(a);
  const cb = parse(b);
  return rgbToHex(
    ca.r + (cb.r - ca.r) * clampT,
    ca.g + (cb.g - ca.g) * clampT,
    ca.b + (cb.b - ca.b) * clampT
  );
}

function sectorCodeFromCorrelation(s: unknown): string | null {
  if (!s || typeof s !== "object") return null;
  const record = s as Record<string, unknown>;
  const v = record.sector ?? record.code;
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/* ---------- component ---------- */

export default function PolicyAnalysis({
  data,
  co2GdpChange5y,
  inForceCountByIso3,
}: {
  data: AnalysisData;
  co2GdpChange5y: Co2GdpChange5y;
  inForceCountByIso3?: Record<string, number>;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [excludeOutliers, setExcludeOutliers] = useState(true);

  // Sector correlation bar data
  const sectorBarData = useMemo(
    () =>
      [...data.sector_correlations]
        .filter((s) => s.r_co2_capita !== null)
        .sort((a, b) => (a.r_co2_capita ?? 0) - (b.r_co2_capita ?? 0))
        .map((s) => ({
          ...s,
          r_value: s.r_co2_capita!,
          significant: s.p_co2_capita !== null && s.p_co2_capita < 0.05,
          fill: correlationFill(s.r_co2_capita ?? 0),
        })),
    [data.sector_correlations]
  );

    const sectorBarData5y = useMemo(() => {
    const sectorCodes = Object.keys(data.sector_names);
    type SectorBarPoint = {
      name: string;
      code: string;
      n: number;
      r_value: number | null;
      p_value: number | null;
      significant: boolean;
      fill: string;
      removed_outliers: number;
      trimmed: boolean;
    };

    const points: SectorBarPoint[] = sectorCodes
      .map((code) => {
        const xs: number[] = [];
        const ys: number[] = [];

        for (const c of data.scatter_data) {
          const change = co2GdpChange5y?.[c.iso3];
          if (!change) continue;
          if (typeof change.pct_change !== "number" || Number.isNaN(change.pct_change)) continue;

          const total = c.total_policies || 0;
          if (total <= 0) continue;

          const share = (c.sectors?.[code] ?? 0) / total;
          xs.push(share);
          ys.push(change.pct_change);
        }

        // Optional outlier trimming (IQR on Y)
        const beforeN = xs.length;
        const filtered = excludeOutliers ? filterPairsByYIqr(xs, ys, 1.5) : { xs, ys };
        const afterN = filtered.xs.length;
        const removed = Math.max(0, beforeN - afterN);
        const trimmed = excludeOutliers && beforeN >= 8 && removed > 0;

        const r = pearson(filtered.xs, filtered.ys);
        const p = r === null ? null : pValueFromPearson(r, filtered.xs.length);

        return {
          name: data.sector_names[code] ?? code,
          code,
          n: filtered.xs.length,
          r_value: r,
          p_value: p,
          significant: p !== null && p < 0.05,
          fill: r === null ? COLOR_NO_DATA : correlationFill(r),
          removed_outliers: removed,
          trimmed,
        };
      })
      .filter((d) => d.n >= 3);

    return points
      .filter((d): d is SectorBarPoint & { r_value: number } => d.r_value !== null)
      .sort((a, b) => a.r_value - b.r_value);
  }, [data.scatter_data, data.sector_names, co2GdpChange5y, excludeOutliers]);

  // Instrument comparison
  const instrumentBarData = useMemo(
    () =>
      data.instrument_effectiveness
        .filter((ie) => ie.avg_co2_with !== null && ie.avg_co2_without !== null)
        .map((ie) => ({
          instrument: ie.instrument,
          avgWith: ie.avg_co2_with!,
          avgWithout: ie.avg_co2_without!,
          diff: ie.difference ?? ie.avg_co2_with! - ie.avg_co2_without!,
          significant: ie.significant,
          r: ie.r,
          p: ie.p,
        })),
    [data.instrument_effectiveness]
  );

  // Top cocktails
  const { cocktailData, cocktailMin, cocktailMax } = useMemo(() => {
    const list = data.policy_cocktails.slice(0, 10).map((c) => ({
      ...c,
      label: c.combo.length > 35 ? c.combo.slice(0, 32) + "..." : c.combo,
    }));
    const min = list.length > 0 ? Math.min(...list.map((c) => c.avg_co2_gdp)) : 0;
    const max = list.length > 0 ? Math.max(...list.map((c) => c.avg_co2_gdp)) : 1;
    return { cocktailData: list, cocktailMin: min, cocktailMax: max };
  }, [data.policy_cocktails]);

  const RADAR_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];
  const { radarCountries, radarData } = useMemo(() => {
    if (!showAdvanced) return { radarCountries: [] as ScatterPoint[], radarData: [] as Array<Record<string, string | number>> };
    const countries = Array.isArray(data.top_performers) ? data.top_performers.slice(0, 5) : [];
    const sectorCodes = data?.sector_names && typeof data.sector_names === "object" ? Object.keys(data.sector_names) : [];
    if (countries.length === 0 || sectorCodes.length === 0) {
      return { radarCountries: [] as ScatterPoint[], radarData: [] as Array<Record<string, string | number>> };
    }

    const points = sectorCodes.map((code) => {
      const point: Record<string, string | number> = { sector: data.sector_names[code] ?? code };
      for (const c of countries) {
        const sectors = (c as unknown as { sectors?: Record<string, number> }).sectors;
        const total = (c as unknown as { total_policies?: number }).total_policies || 1;
        point[c.iso3] = Math.round((((sectors?.[code] ?? 0) as number) / total) * 100);
      }
      return point;
    });

    return { radarCountries: countries, radarData: points };
  }, [showAdvanced, data.top_performers, data.sector_names]);

  const decisionSupport = useMemo(() => {
    const iso3s = Array.isArray(data.scatter_data)
      ? data.scatter_data
          .map((d) => d?.iso3)
          .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      : [];
    const countryCount = new Set(iso3s).size;

    const lifts = Array.isArray(data?.lift_scores?.sector_lifts) ? data.lift_scores.sector_lifts : [];
    const sectorNames = data?.sector_names ?? {};

    const getSectorName = (code: string, fallback?: string) => sectorNames?.[code] ?? fallback ?? code;

    const mostEffective = [...lifts]
      .filter((s) => typeof s?.lift === "number" && isFinite(s.lift) && s.lift > 1.05)
      .sort((a, b) => b.lift - a.lift)
      .slice(0, 3)
      .map((s) => ({
        code: s.bucket_id,
        name: getSectorName(s.bucket_id, s.bucket_name),
        lift: s.lift,
      }));

    const leastEffective = [...lifts]
      .filter((s) => typeof s?.lift === "number" && isFinite(s.lift))
      .sort((a, b) => a.lift - b.lift)
      .slice(0, 3)
      .map((s) => ({
        code: s.bucket_id,
        name: getSectorName(s.bucket_id, s.bucket_name),
        lift: s.lift,
      }));

    const correlationMap = new Map<string, { r: number | null; p: number | null }>();
    if (Array.isArray(data.sector_correlations)) {
      for (const raw of data.sector_correlations as unknown[]) {
        const sectorCode = sectorCodeFromCorrelation(raw);
        if (!sectorCode) continue;
        const record = raw as Record<string, unknown>;
        const r = record.r_co2_capita;
        const p = record.p_co2_capita;
        const rOk = typeof r === "number" || r === null;
        const pOk = typeof p === "number" || p === null;
        if (!rOk || !pOk) continue;
        correlationMap.set(sectorCode, { r: (r as number | null) ?? null, p: (p as number | null) ?? null });
      }
    }

    const sectorSummary = lifts
      .map((s) => {
        const sectorCode = s?.bucket_id;
        if (typeof sectorCode !== "string" || sectorCode.trim().length === 0) return null;
        const corr = correlationMap.get(sectorCode);
        if (!corr) return null;
        if (typeof s.lift !== "number" || !isFinite(s.lift)) return null;
        const sectorName = getSectorName(sectorCode, s.bucket_name);
        const significant = corr.p !== null && corr.p < 0.05;
        return { sectorCode, sectorName, lift: s.lift, r: corr.r, p: corr.p, significant };
      })
      .filter(
        (row): row is { sectorCode: string; sectorName: string; lift: number; r: number | null; p: number | null; significant: boolean } =>
          row !== null
      );

    return { countryCount, mostEffective, leastEffective, sectorSummary };
  }, [data.scatter_data, data.lift_scores, data.sector_correlations, data.sector_names]);

  // Scatter data (EPI)
  const epiByIso3 = useMemo(() => {
    const map = new Map<string, number>();
    const rows = (overviewStats as unknown as { scatter_data?: unknown }).scatter_data;
    if (!Array.isArray(rows)) return map;
    for (const row of rows as Array<Record<string, unknown>>) {
      const iso3 = row.iso3;
      const score = row.gepi_score;
      if (typeof iso3 !== "string" || iso3.trim().length === 0) continue;
      if (typeof score !== "number" || Number.isNaN(score)) continue;
      map.set(iso3, score);
    }
    return map;
  }, []);

  const epiScatter = useMemo(() => {
    const points: Array<
      ScatterPoint & {
        x: number;
        y: number;
        z: number;
        epi_score: number;
        in_force_policies: number;
      }
    > = [];

    for (const d of data.scatter_data) {
      const epi = epiByIso3.get(d.iso3);
      if (typeof epi !== "number" || Number.isNaN(epi)) continue;

      const inForce = (inForceCountByIso3?.[d.iso3] ?? d.active_policies ?? 0) as number;
      if (typeof inForce !== "number" || !isFinite(inForce) || inForce <= 0) continue;

      points.push({
        ...d,
        epi_score: epi,
        in_force_policies: inForce,
        x: inForce,
        y: epi,
        z: d.population ? Math.sqrt(d.population / 1e6) * 3 : 20,
      });
    }

    points.sort((a, b) => a.x - b.x);
    const maxInForce = points.length > 0 ? Math.max(...points.map((p) => p.in_force_policies)) : 0;
    const minX = points.length > 0 ? Math.min(...points.map((p) => p.x)) : 0;
    const maxX = points.length > 0 ? Math.max(...points.map((p) => p.x)) : 0;

    return { points, maxInForce, minX, maxX };
  }, [data.scatter_data, epiByIso3, inForceCountByIso3]);

  const epiTrendLine = useMemo(() => {
    const pts = epiScatter.points;
    if (pts.length < 8) return [] as Array<{ x: number; y: number }>;
    const fit = linearFit(pts);
    if (!fit) return [] as Array<{ x: number; y: number }>;
    const minX = epiScatter.minX;
    const maxX = epiScatter.maxX;
    if (!isFinite(minX) || !isFinite(maxX) || minX === maxX) return [] as Array<{ x: number; y: number }>;
    return [
      { x: minX, y: fit.m * minX + fit.b },
      { x: maxX, y: fit.m * maxX + fit.b },
    ];
  }, [epiScatter.maxX, epiScatter.minX, epiScatter.points]);

  const bt = data.binding_target;
  const lift = data.lift_scores;

  const bestInstrument = (() => {
    const bySig = instrumentBarData.filter((d) => d.p !== null && d.p < 0.05);
    const pool = bySig.length > 0 ? bySig : instrumentBarData;
    return [...pool].sort((a, b) => (a.diff ?? 0) - (b.diff ?? 0))[0];
  })();

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800/80 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 pt-5 pb-0">
          <button
            onClick={() => router.push("/")}
            className="mb-4 flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
          >
            <span>&larr;</span> Back to Globe
          </button>
          <h1 className="text-2xl font-bold mb-1">
            Global Policy & Environmental Outcomes
          </h1>
          <p className="text-gray-300 text-sm mb-5">
            Cross-sectional analysis of {data.scatter_data.length} countries with
            12,470+ climate policies
          </p>

          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto pb-0 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-emerald-500 text-white bg-gray-900/50"
                    : "border-transparent text-gray-300 hover:text-gray-300 hover:bg-gray-900/30"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* =================== OVERVIEW TAB =================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Key finding cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const best = sectorBarData[0];
                return (
                  <div className="bg-gray-900/80 rounded-xl border border-emerald-900/40 p-5">
                    <div className="text-[10px] text-emerald-400 font-semibold mb-1.5 uppercase tracking-widest">
                      Strongest CO2 Reducer
                    </div>
                    <div className="text-xl font-bold text-emerald-400 mb-1">
                      {SECTOR_ICONS[best.code]} {best.name}
                    </div>
                    <div className="text-sm text-gray-300">
                      r = {best.r_co2_capita?.toFixed(3)} {sigStars(best.p_co2_capita)}
                    </div>
                    <div className="text-xs text-gray-300 mt-1">
                      {sigLabel(best.p_co2_capita)} &middot; n={best.n}
                    </div>
                  </div>
                );
              })()}

              {(() => {
                const sigInst = instrumentBarData.filter((ie) => ie.significant);
                const bestInst = bestInstrument ?? (sigInst.length > 0 ? sigInst[0] : instrumentBarData[0]);
                if (!bestInst) {
                  return (
                    <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-5">
                      <div className="text-[10px] text-gray-300 font-semibold mb-1.5 uppercase tracking-widest">
                        Most Effective Instrument
                      </div>
                      <div className="text-xl font-bold text-white mb-1">n/a</div>
                      <div className="text-sm text-gray-300">No instrument data available.</div>
                    </div>
                  );
                }

                const isGood = bestInst.diff < 0;
                return (
                  <div className={`bg-gray-900/80 rounded-xl border p-5 ${isGood ? "border-emerald-900/40" : "border-red-900/40"}`}>
                    <div className={`text-[10px] font-semibold mb-1.5 uppercase tracking-widest ${isGood ? "text-emerald-400" : "text-red-400"}`}>
                      Most Effective Instrument
                    </div>
                    <div className={`text-xl font-bold mb-1 ${isGood ? "text-emerald-400" : "text-red-400"}`}>
                      {bestInst.instrument}
                    </div>
                    <div className="text-sm text-gray-300">
                      {bestInst.diff < 0 ? "Lower CO2 with instrument" : "Higher CO2 with instrument"} &middot; Δ={bestInst.diff.toFixed(2)} t/cap
                    </div>
                    <div className="text-xs text-gray-300 mt-1">
                      {bestInst.p !== null ? `Correlation: r=${bestInst.r?.toFixed(3) ?? "n/a"} ${sigStars(bestInst.p)} (${sigLabel(bestInst.p)})` : "Correlation: n/a"}
                    </div>
                  </div>
                );
              })()}

              <div className="bg-gray-900/80 rounded-xl border border-purple-900/40 p-5">
                <div className="text-[10px] text-purple-400 font-semibold mb-1.5 uppercase tracking-widest">
                  Best Policy Combination
                </div>
                <div className="text-lg font-bold text-purple-400 mb-1">
                  {cocktailData[0]?.combo}
                </div>
                <div className="text-sm text-gray-300">
                  Avg CO2/GDP: {cocktailData[0]?.avg_co2_gdp.toFixed(3)} kg/$
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  n={cocktailData[0]?.n} countries
                </div>
              </div>
            </div>

            {/* Scatter Plot */}
            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-0.5">Policy Count vs Environmental Performance (EPI)</h2>
                <p className="text-xs text-gray-300">Each dot is a country. Higher EPI is better.</p>
              </div>
              <ResponsiveContainer width="100%" height={420}>
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
	                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
	                  <XAxis
	                    type="number"
	                    dataKey="x"
	                    name="Policies (In force)"
	                    stroke={AXIS_STROKE}
	                    tick={{ fontSize: 11, fill: AXIS_STROKE }}
	                    domain={[0, "dataMax"]}
	                    allowDecimals={false}
	                    label={{
	                      value: "Policies (In force)",
	                      position: "insideBottom",
	                      offset: -10,
	                      style: { fill: AXIS_STROKE, fontSize: 11 },
	                    }}
	                  />
	                  <YAxis
	                    type="number"
	                    dataKey="y"
	                    name="EPI score"
	                    stroke={AXIS_STROKE}
	                    tick={{ fontSize: 11, fill: AXIS_STROKE }}
	                    domain={[0, 100]}
	                    label={{ value: "EPI score", angle: -90, position: "insideLeft", style: { fill: AXIS_STROKE, fontSize: 11 } }}
	                  />
                  <ZAxis dataKey="z" range={[30, 400]} />
	                  <Tooltip
	                    contentStyle={TOOLTIP_STYLE}
	                    content={({ payload }) => {
	                      if (!payload || payload.length === 0) return null;
	                      const d = payload[0].payload as ScatterPoint & {
	                        x: number;
	                        y: number;
	                        epi_score: number;
	                        in_force_policies: number;
	                      };
	                      return (
	                        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm shadow-xl">
	                          <div className="font-bold text-white">{d.country}</div>
	                          <div className="text-gray-300">{d.in_force_policies} in-force policies</div>
	                          <div className="text-gray-300">EPI: {d.epi_score.toFixed(1)}</div>
	                          {typeof d.population === "number" && isFinite(d.population) && (
	                            <div className="text-gray-400 text-xs mt-1">Population: {(d.population / 1e6).toFixed(1)}M</div>
	                          )}
	                        </div>
	                      );
	                    }}
	                  />
	                  {epiTrendLine.length === 2 && (
	                    <Line
	                      type="linear"
	                      data={epiTrendLine}
	                      dataKey="y"
	                      dot={false}
	                      isAnimationActive={false}
	                      stroke="#d1d5db"
	                      strokeWidth={2}
	                    />
	                  )}
	                  <Scatter data={epiScatter.points}>
	                    {epiScatter.points.map((entry, i) => {
	                      const max = Math.max(1, epiScatter.maxInForce);
	                      const intensity = Math.max(0, Math.min(1, entry.in_force_policies / max));
	                      const h = 200 - intensity * 180;
	                      const color = `hsl(${h}, 70%, 55%)`;
	                      return <Cell key={i} fill={color} fillOpacity={0.78} />;
	                    })}
	                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Top Performers Table */}
            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-6">
              <h2 className="text-lg font-semibold mb-0.5">Lowest Carbon Intensity (20+ Policies)</h2>
              <p className="text-xs text-gray-300 mb-4">Countries combining extensive policy portfolios with the lowest CO2 per GDP.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-2.5 px-3 text-gray-300 font-medium text-xs">#</th>
                      <th className="text-left py-2.5 px-3 text-gray-300 font-medium text-xs">Country</th>
                      <th className="text-right py-2.5 px-3 text-gray-300 font-medium text-xs">CO2/GDP</th>
                      <th className="text-right py-2.5 px-3 text-gray-300 font-medium text-xs">CO2/Capita</th>
                      <th className="text-right py-2.5 px-3 text-gray-300 font-medium text-xs">Policies</th>
                      <th className="text-left py-2.5 px-3 text-gray-300 font-medium text-xs">Top Sector</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_performers.map((c, i) => (
                      <tr key={c.iso3} className="border-b border-gray-800/40 hover:bg-gray-800/40 transition-colors cursor-pointer" onClick={() => router.push(`/country/${c.iso3}`)}>
                        <td className="py-2.5 px-3 text-gray-300 font-mono text-xs">{i + 1}</td>
                        <td className="py-2.5 px-3 text-gray-300 font-medium">{c.country}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-mono text-xs">{c.co2_per_gdp.toFixed(3)}</td>
                        <td className="py-2.5 px-3 text-right text-gray-300 font-mono text-xs">{c.co2_per_capita.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right text-gray-300 font-mono text-xs">{c.total_policies}</td>
                        <td className="py-2.5 px-3">
                          {c.top_sector && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
                              style={{ color: SECTOR_COLORS[c.top_sector] ?? "#9CA3AF", borderColor: (SECTOR_COLORS[c.top_sector] ?? "#9CA3AF") + "30", backgroundColor: (SECTOR_COLORS[c.top_sector] ?? "#9CA3AF") + "10" }}>
                              {SECTOR_ICONS[c.top_sector] ?? ""} {data.sector_names[c.top_sector] ?? c.top_sector}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================== SECTORS TAB =================== */}
        {activeTab === "sectors" && (
          <div className="space-y-6">
            {/* Sector Correlation Bar Chart */}
            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-6">
              <h2 className="text-lg font-semibold mb-0.5">Policy Sector vs CO2 per GDP Change (5y %)</h2>
              <p className="text-xs text-gray-300 mb-1">
                Pearson correlation between each sector&apos;s share of a country&apos;s policy portfolio and its CO2 per GDP percent change over 5 years.
              </p>
              <p className="text-xs text-gray-300 mb-5">
                <span className="text-emerald-400">Green (negative r)</span> = higher share correlates with <em>more negative</em> CO2 per GDP change (bigger reductions).{" "}
                <span className="text-red-400">Red (positive r)</span> = higher share correlates with <em>more positive</em> CO2 per GDP change (bigger increases).
              </p>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <label className="flex items-center gap-2 text-xs text-gray-300 select-none">
                  <input
                    type="checkbox"
                    checked={excludeOutliers}
                    onChange={(e) => setExcludeOutliers(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  Exclude outliers (IQR on CO2/GDP % change)
                  <span className="text-gray-400">(applies only when n ≥ 8 per sector)</span>
                </label>

                {excludeOutliers && sectorBarData5y.length > 0 && (
                  <div className="text-xs text-gray-400">
                    Total removed:{" "}
                    <span className="text-gray-200 font-mono">
                      {sectorBarData5y.reduce((acc, d) => acc + (d.removed_outliers ?? 0), 0)}
                    </span>
                  </div>
                )}
              </div>
              {sectorBarData5y.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-gray-400">No data.</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={sectorBarData5y.length * 55 + 60}>
                    <BarChart data={sectorBarData5y} layout="vertical" margin={{ left: 180, right: 40, top: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                      <XAxis type="number" stroke={AXIS_STROKE} tick={{ fontSize: 11, fill: AXIS_STROKE }} domain={[-0.5, 0.5]} tickFormatter={(v: number) => v.toFixed(2)} />
                      <YAxis type="category" dataKey="name" stroke={AXIS_STROKE} tick={{ fontSize: 12, fill: AXIS_STROKE }} width={170} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#6b7280" }}
                        formatter={((value: number, _name: string, entry: { payload: typeof sectorBarData5y[number] }) => {
                          const p = entry.payload;
                          return [`r = ${(value ?? 0).toFixed(4)} ${sigStars(p.p_value)} (${sigLabel(p.p_value)})`, "Correlation"];
                        }) as never} />
                      <Bar dataKey="r_value" radius={[0, 4, 4, 0]}>
                        {sectorBarData5y.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} fillOpacity={entry.significant ? 1 : NON_SIG_OPACITY}
                            stroke={entry.significant ? (entry.r_value < 0 ? "#16a34a" : "#dc2626") : "transparent"} strokeWidth={entry.significant ? 2 : 0} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-6 mt-3 text-xs text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-2.5 rounded-sm bg-gray-200 inline-block" /> Solid = p &lt; 0.05
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-2.5 rounded-sm bg-gray-200/30 inline-block" /> Faded = p ≥ 0.05
                    </span>
                    <span className="text-gray-400">Correlation ≠ causation.</span>
                  </div>
                </>
              )}
            </div>

            {/* Best Policy Cocktails */}
            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-6">
              <h2 className="text-lg font-semibold mb-0.5">Best Policy Sector Combinations</h2>
              <p className="text-xs text-gray-300 mb-5">Average CO2/GDP (kg/$) for countries grouped by their top-2 policy sectors. Lower is better.</p>
              <ResponsiveContainer width="100%" height={cocktailData.length * 44 + 60}>
                <BarChart data={cocktailData} layout="vertical" margin={{ left: 260, right: 40, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" stroke={AXIS_STROKE} tick={{ fontSize: 11, fill: AXIS_STROKE }}
                    label={{ value: "Avg CO2 per GDP (kg/$)", position: "insideBottom", offset: -5, style: { fill: AXIS_STROKE, fontSize: 11 } }} />
                  <YAxis type="category" dataKey="combo" stroke={AXIS_STROKE} tick={{ fontSize: 11, fill: AXIS_STROKE }} width={250} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#6b7280" }}
                    formatter={((value: number) => [`${(value ?? 0).toFixed(4)} kg/$`, "CO2/GDP"]) as never} />
                  <Bar dataKey="avg_co2_gdp" radius={[0, 4, 4, 0]}>
                    {cocktailData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={lerpColor(COLOR_GOOD, COLOR_BAD, (cocktailData[i].avg_co2_gdp - cocktailMin) / Math.max(1e-9, cocktailMax - cocktailMin))}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
                {cocktailData.slice(0, 6).map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-700/40">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: `hsl(${150 + i * 15}, 55%, 20%)`, color: `hsl(${150 + i * 15}, 55%, 65%)` }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{c.combo}</div>
                      <div className="text-xs text-gray-300">{c.n} countries &middot; median {c.median_co2_gdp.toFixed(3)} kg/$</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar Chart */}
            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold mb-0.5">Advanced charts (optional)</h2>
                  <p className="text-xs text-gray-300">
                    Show the radar chart comparing sector policy mix for the 5 lowest CO2/GDP countries (20+ policies).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    showAdvanced
                      ? "bg-gray-800/70 border-gray-700/60 text-white hover:bg-gray-800"
                      : "bg-gray-900/40 border-gray-800/60 text-gray-300 hover:text-white hover:bg-gray-900/60"
                  }`}
                >
                  {showAdvanced ? "Hide" : "Show"}
                </button>
              </div>

              {showAdvanced && (
                <div className="mt-5">
                  {radarCountries.length === 0 || radarData.length === 0 ? (
                    <div className="text-sm text-gray-300">No data</div>
                  ) : (
                    <>
                      <div className="text-sm font-semibold text-white mb-1">Policy Mix of Top Performers</div>
                      <p className="text-xs text-gray-300 mb-5">
                        Sector distribution (% of portfolio) for the 5 countries with lowest CO2/GDP and 20+ policies.
                      </p>
                      <ResponsiveContainer width="100%" height={420}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#1f2937" />
                          <PolarAngleAxis dataKey="sector" stroke={AXIS_STROKE} tick={{ fontSize: 11, fill: AXIS_STROKE }} />
                          <PolarRadiusAxis stroke="#374151" tick={{ fontSize: 10 }} />
                          {radarCountries.map((c, i) => (
                            <Radar
                              key={c.iso3}
                              name={c.country}
                              dataKey={c.iso3}
                              stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                              fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                              fillOpacity={0.1}
                              strokeWidth={2}
                            />
                          ))}
                          <Legend />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================== INSTRUMENTS TAB =================== */}
        {activeTab === "instruments" && (
          <div className="space-y-6">
            {/* Instrument Effectiveness */}
            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-6">
              <h2 className="text-lg font-semibold mb-0.5">Policy Instrument Effectiveness</h2>
              <p className="text-xs text-gray-300 mb-5">
                Average CO2 per capita (tonnes) for countries that use each instrument type vs those that don&apos;t.
                Lower is better. Bordered bars indicate statistically significant association (p &lt; 0.05).
              </p>
              <ResponsiveContainer width="100%" height={instrumentBarData.length * 44 + 60}>
                <BarChart data={instrumentBarData} layout="vertical" margin={{ left: 160, right: 40, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" stroke={AXIS_STROKE} tick={{ fontSize: 11, fill: AXIS_STROKE }}
                    label={{ value: "Avg CO2/Capita (tonnes)", position: "insideBottom", offset: -5, style: { fill: AXIS_STROKE, fontSize: 11 } }} />
                  <YAxis type="category" dataKey="instrument" stroke={AXIS_STROKE} tick={{ fontSize: 11, fill: AXIS_STROKE }} width={150} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#6b7280" }}
                    formatter={((value: number, name: string) => [`${(value ?? 0).toFixed(2)} t/cap`, name === "avgWith" ? "Countries Using" : "Countries Not Using"]) as never} />
                  <Legend formatter={(value: string) => value === "avgWith" ? "Countries With Instrument" : "Countries Without"} />
                  <Bar dataKey="avgWith" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {instrumentBarData.map((entry, i) => (
                      <Cell key={i} fill="#3b82f6" fillOpacity={entry.significant ? 1 : NON_SIG_OPACITY}
                        stroke={entry.significant ? "#60a5fa" : "transparent"} strokeWidth={entry.significant ? 2 : 0} />
                    ))}
                  </Bar>
                  <Bar dataKey="avgWithout" fill="#4b5563" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Binding / Quantified Target */}
            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-6">
              <h2 className="text-lg font-semibold mb-0.5">Legally Binding Policies & Quantified Targets</h2>
              <p className="text-xs text-gray-300 mb-5">
                Correlation between the share of a country&apos;s policies that are legally binding (or have quantified targets) and its CO2 per capita.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-800/40 rounded-lg border border-gray-700/40 p-5">
                  <div className="text-sm text-gray-300 mb-2">Legally Binding Share vs CO2/Capita</div>
                  <div className={`text-3xl font-bold ${correlationTextClass(bt.binding_r)} ${(bt.binding_p !== null && bt.binding_p < 0.05) ? "" : "opacity-80"}`}>
                    r = {bt.binding_r?.toFixed(4) ?? "n/a"}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{sigLabel(bt.binding_p)} &middot; n={bt.n}</div>
                  <p className="text-xs text-gray-300 mt-3">
                    {correlationSummary(
                      bt.binding_r,
                      bt.binding_p,
                      "higher binding share tends to coincide with lower CO2 per capita",
                      "higher binding share tends to coincide with higher CO2 per capita"
                    )}
                  </p>
                </div>
                <div className="bg-gray-800/40 rounded-lg border border-gray-700/40 p-5">
                  <div className="text-sm text-gray-300 mb-2">Quantified Targets Share vs CO2/Capita</div>
                  <div className={`text-3xl font-bold ${correlationTextClass(bt.target_r)} ${(bt.target_p !== null && bt.target_p < 0.05) ? "" : "opacity-80"}`}>
                    r = {bt.target_r?.toFixed(4) ?? "n/a"}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{sigLabel(bt.target_p)} &middot; n={bt.n}</div>
                  <p className="text-xs text-gray-300 mt-3">
                    {correlationSummary(
                      bt.target_r,
                      bt.target_p,
                      "higher target share tends to coincide with lower CO2 per capita",
                      "higher target share tends to coincide with higher CO2 per capita"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================== LIFT SCORES TAB =================== */}
        {activeTab === "lift" && (
          <div className="space-y-6">
            {/* Decision Support */}
            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
                <div>
                  <h2 className="text-lg font-semibold mb-0.5">Decision Support</h2>
                  <p className="text-xs text-gray-300">
                    Global recommendations based on lift scores and sector correlations across{" "}
                    {Number.isFinite(decisionSupport.countryCount) && decisionSupport.countryCount > 0 ? decisionSupport.countryCount : "No data"} countries.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/40 rounded-xl border border-gray-700/40 p-5">
                  <div className="text-sm font-semibold text-white mb-1">Most Effective Sectors</div>
                  <p className="text-xs text-gray-300 mb-3">Top 3 sectors with lift &gt; 1.05.</p>
                  {decisionSupport.mostEffective.length === 0 ? (
                    <div className="text-sm text-gray-300">No data</div>
                  ) : (
                    <ul className="space-y-2">
                      {decisionSupport.mostEffective.map((s) => (
                        <li key={s.code} className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-300 truncate">{s.name}</span>
                          <span className="text-sm font-mono font-semibold text-emerald-400">{s.lift.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="bg-gray-800/40 rounded-xl border border-gray-700/40 p-5">
                  <div className="text-sm font-semibold text-white mb-1">Least Effective Sectors</div>
                  <p className="text-xs text-gray-300 mb-3">Bottom 3 sectors by lift.</p>
                  {decisionSupport.leastEffective.length === 0 ? (
                    <div className="text-sm text-gray-300">No data</div>
                  ) : (
                    <ul className="space-y-2">
                      {decisionSupport.leastEffective.map((s) => (
                        <li key={s.code} className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-300 truncate">{s.name}</span>
                          <span className="text-sm font-mono font-semibold text-red-400">{s.lift.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-end justify-between gap-3 mb-3">
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">Sector Summary</div>
                    <p className="text-xs text-gray-300">
                      Lift joined with CO2/capita correlation (r) and significance (p &lt; 0.05). Missing joins are skipped.
                    </p>
                  </div>
                </div>

                {decisionSupport.sectorSummary.length === 0 ? (
                  <div className="text-sm text-gray-300">No data</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left py-2.5 px-3 text-gray-300 font-medium text-xs">Sector Name</th>
                          <th className="text-right py-2.5 px-3 text-gray-300 font-medium text-xs">Lift</th>
                          <th className="text-right py-2.5 px-3 text-gray-300 font-medium text-xs">Correlation (r)</th>
                          <th className="text-left py-2.5 px-3 text-gray-300 font-medium text-xs">Significant?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {decisionSupport.sectorSummary.map((row) => (
                          <tr key={row.sectorCode} className="border-b border-gray-800/40 hover:bg-gray-800/40 transition-colors">
                            <td className="py-2.5 px-3 text-gray-300 font-medium">{row.sectorName}</td>
                            <td className="py-2.5 px-3 text-right text-gray-300 font-mono text-xs">{row.lift.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right text-gray-300 font-mono text-xs">
                              {row.r === null ? "No data" : row.r.toFixed(3)}
                            </td>
                            <td className="py-2.5 px-3 text-xs">
                              {row.p === null ? (
                                <span className="text-gray-300">No data</span>
                              ) : row.significant ? (
                                <span className="text-emerald-400 font-semibold">Yes</span>
                              ) : (
                                <span className="text-gray-300">No</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-6">
              <h2 className="text-lg font-semibold mb-0.5">Sector Lift Scores</h2>
              <p className="text-xs text-gray-300 mb-2">
                How much more likely is a country to be a &quot;top performer&quot; (top 25% lowest CO2/GDP) if it emphasizes a given policy sector?
              </p>
              <p className="text-xs text-gray-300 mb-6">
                Lift = P(top quartile | above-median sector share) / P(top quartile). A lift &gt; 1.0 means countries emphasizing that sector are over-represented among top performers.
                Based on {lift.n_countries} countries with 5+ policies.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                <span className="text-emerald-400">Green</span> = over-represented among top performers (good).{" "}
                <span className="text-red-400">Red</span> = under-represented (potentially worse outcomes). Lift ≈ 1.0 is neutral.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {lift.sector_lifts.map((s, i) => {
                  const color = SECTOR_COLORS[s.bucket_id] ?? "#9CA3AF";
                  const isGood = s.lift > 1.0;
                  const isBad = s.lift < 1.0;
                  return (
                    <div key={s.bucket_id} className="relative bg-gray-800/40 rounded-xl border border-gray-700/40 p-5 overflow-hidden">
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: color + "20", color }}>
                        {i + 1}
                      </div>
                      <div className="text-2xl mb-2">{SECTOR_ICONS[s.bucket_id] ?? "📋"}</div>
                      <div className="text-sm font-semibold text-white mb-0.5">{s.bucket_name}</div>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className={`text-2xl font-bold ${isGood ? "text-emerald-400" : isBad ? "text-red-400" : "text-gray-300"}`}>
                          {s.lift.toFixed(2)}x
                        </span>
                        <span className="text-xs text-gray-300">lift</span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-1.5 mb-1">
                        <div className="h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min((s.top_in_sector / s.total_in_sector) * 100, 100)}%`, backgroundColor: color }} />
                      </div>
                      <div className="text-[10px] text-gray-300">
                        {s.top_in_sector} of {s.total_in_sector} countries in top quartile
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instrument Lift Scores */}
            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-6">
              <h2 className="text-lg font-semibold mb-0.5">Instrument Lift Scores</h2>
              <p className="text-xs text-gray-300 mb-6">
                Same lift methodology applied to individual policy instrument types (e.g., subsidies, carbon taxes, bans).
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-2.5 px-3 text-gray-300 font-medium text-xs">#</th>
                      <th className="text-left py-2.5 px-3 text-gray-300 font-medium text-xs">Instrument</th>
                      <th className="text-right py-2.5 px-3 text-gray-300 font-medium text-xs">Lift</th>
                      <th className="text-right py-2.5 px-3 text-gray-300 font-medium text-xs">Countries Using</th>
                      <th className="text-right py-2.5 px-3 text-gray-300 font-medium text-xs">In Top Quartile</th>
                      <th className="text-left py-2.5 px-3 text-gray-300 font-medium text-xs">Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lift.instrument_lifts.map((inst, i) => (
                      <tr key={inst.instrument_id} className="border-b border-gray-800/40 hover:bg-gray-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-gray-300 font-mono text-xs">{i + 1}</td>
                        <td className="py-2.5 px-3 text-gray-300 font-medium">{inst.instrument_name}</td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold text-xs ${inst.lift > 1.0 ? "text-emerald-400" : inst.lift < 1.0 ? "text-red-400" : "text-gray-300"}`}>
                          {inst.lift.toFixed(2)}x
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-300 font-mono text-xs">{inst.total_with_instrument}</td>
                        <td className="py-2.5 px-3 text-right text-gray-300 font-mono text-xs">{inst.top_in_instrument}</td>
                        <td className="py-2.5 px-3">
                          <div className="w-16 bg-gray-700/50 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(Math.max(inst.lift, 0), 2) * 50}%`, backgroundColor: inst.lift > 1.0 ? COLOR_GOOD : inst.lift < 1.0 ? COLOR_BAD : COLOR_NEUTRAL }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-xs text-gray-300 space-y-0.5 pb-8">
          <p>
          DATA SOURCES:
        </p>
        <p>
          Yale Center for Environmental Law & Policy - EPI Report (2024)
        </p>
        <p>
          Our World in Data - Global CO₂ Emissions per Capita  (Nov 2024)
        </p>
        <p>
          World Bank Group - GDP in Current US Dollars (2024)
        </p>
        <p>
          Global Energy Monitor - Global Integrated Power Tracker (Feb 2026)
        </p>
        <p>
          International Energy Agency - Global Policies Database (2026)
        </p>
        </div>
      </div>
    </main>
  );
}
