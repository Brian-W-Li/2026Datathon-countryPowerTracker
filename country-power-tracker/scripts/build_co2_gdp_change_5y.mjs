// scripts/build_co2_gdp_change_5y.mjs
// Reads public/data/country_deep_dive.json
// Writes public/data/co2_gdp_change_5y.json
//
// Run from repo root:
//   node scripts/build_co2_gdp_change_5y.mjs

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT  = join(__dirname, "../public/data/country_deep_dive.json");
const OUTPUT = join(__dirname, "../public/data/co2_gdp_change_5y.json");

const START_YEAR = 2019;
const END_YEAR   = 2024;

// Verification spot-checks — logged at end
const VERIFY_ISO3S = ["CAN", "FRA"];

// ── Types (JSDoc for editor hints, no runtime cost) ───────────────────────────
/**
 * @typedef {{ year: number; co2_per_gdp?: number | null }} SeriesEntry
 * @typedef {{ iso3: string; series: SeriesEntry[] }} DeepDiveEntry
 * @typedef {{ country: string; start_year: number; end_year: number; start_value: number; end_value: number; pct_change: number }} OutputEntry
 */

// ── Load ──────────────────────────────────────────────────────────────────────
/** @type {DeepDiveEntry[]} */
const raw = JSON.parse(readFileSync(INPUT, "utf8"));
const total = raw.length;

// ── Process ───────────────────────────────────────────────────────────────────
const skipped = {
  missing2019:  0,
  missing2024:  0,
  missingValue: 0,
  nonFinite:    0,
  startLteZero: 0,
};

/** @type {Record<string, OutputEntry>} */
const result = {};

for (const entry of raw) {
  const { iso3, series } = entry;

  const row2019 = series.find((s) => s.year === START_YEAR);
  const row2024 = series.find((s) => s.year === END_YEAR);

  if (!row2019) { skipped.missing2019++;  continue; }
  if (!row2024) { skipped.missing2024++;  continue; }

  const startValue = row2019.co2_per_gdp;
  const endValue   = row2024.co2_per_gdp;

  if (startValue == null || endValue == null) { skipped.missingValue++;  continue; }
  if (!isFinite(startValue) || !isFinite(endValue)) { skipped.nonFinite++;    continue; }
  if (startValue <= 0)                               { skipped.startLteZero++; continue; }

  const rawPct  = ((endValue - startValue) / startValue) * 100;
  const pctChange = Math.round(rawPct * 10000) / 10000;

  // Belt-and-suspenders: guard against edge-case NaN after rounding
  if (!isFinite(pctChange)) { skipped.nonFinite++; continue; }

  result[iso3] = {
    country:     iso3,       // deep_dive has no display name; use iso3 as key
    start_year:  START_YEAR,
    end_year:    END_YEAR,
    start_value: startValue,
    end_value:   endValue,
    pct_change:  pctChange,
  };
}

const written = Object.keys(result).length;

// ── pct_change distribution ───────────────────────────────────────────────────
const sorted = Object.values(result)
  .map((v) => v.pct_change)
  .sort((a, b) => a - b);

const min    = sorted[0];
const max    = sorted[sorted.length - 1];
const mid    = sorted.length / 2;
const median = sorted.length % 2 === 0
  ? (sorted[Math.floor(mid) - 1] + sorted[Math.ceil(mid)]) / 2
  : sorted[Math.floor(mid)];

// ── Summary report ────────────────────────────────────────────────────────────
console.log("");
console.log("── Input ─────────────────────────────────────────");
console.log(`  Total countries in deep dive : ${total}`);
console.log("");
console.log("── Output ────────────────────────────────────────");
console.log(`  Written to output            : ${written}`);
console.log("");
console.log("── Skipped by reason ─────────────────────────────");
console.log(`  missing year=${START_YEAR} entry    : ${skipped.missing2019}`);
console.log(`  missing year=${END_YEAR} entry    : ${skipped.missing2024}`);
console.log(`  co2_per_gdp null/undefined   : ${skipped.missingValue}`);
console.log(`  non-finite value             : ${skipped.nonFinite}`);
console.log(`  start_value <= 0             : ${skipped.startLteZero}`);
console.log("");
console.log("── pct_change distribution ───────────────────────");
console.log(`  min    : ${min    != null ? min.toFixed(4)    : "n/a"}`);
console.log(`  median : ${median != null ? median.toFixed(4) : "n/a"}`);
console.log(`  max    : ${max    != null ? max.toFixed(4)    : "n/a"}`);

// ── Spot-check verification ───────────────────────────────────────────────────
console.log("");
console.log("── Spot-check (sanity) ───────────────────────────");
for (const iso of VERIFY_ISO3S) {
  const e = result[iso];
  if (!e) {
    console.log(`  ${iso}: NOT FOUND in output`);
  } else {
    console.log(
      `  ${iso}: co2_per_gdp ${START_YEAR}=${e.start_value} → ${END_YEAR}=${e.end_value}` +
      `  (pct_change=${e.pct_change.toFixed(4)}%)`
    );
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────
writeFileSync(OUTPUT, JSON.stringify(result, null, 2), "utf8");
console.log("");
console.log(`  Wrote → ${OUTPUT}`);
console.log("");
