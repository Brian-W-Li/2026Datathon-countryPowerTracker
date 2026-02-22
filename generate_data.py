#!/usr/bin/env python3
"""
Generate JSON data files for the GEPI Dashboard frontend.

Inputs:
  - policies_clean.csv           (repo root)
  - public/data/countries.json   (GEPI scores)
  - public/data/country_deep_dive.json (CO2 metrics 1990-2024)

Outputs (all written to country-power-tracker/public/data/):
  - policy_buckets.json         active policies per country with sector assignment
  - lift_by_bucket.json         lift scores for all 7 policy sectors
  - recommendations.json        top-3 sectors by lift
  - overview_stats.json         scatter data, CO2/GDP trends, top-performer policy mix

Lift definition:
  Lift = P(sector | top-GEPI country) / P(sector | all countries)
  "Top" = top 25% by GEPI score.  Lift > 1 means sector is over-represented
  among high performers.
"""

import csv
import json
import os
import math
from collections import defaultdict

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT, "country-power-tracker", "public", "data")
POLICIES_CSV = os.path.join(ROOT, "policies_clean.csv")
COUNTRIES_JSON = os.path.join(DATA_DIR, "countries.json")
DEEP_DIVE_JSON = os.path.join(DATA_DIR, "country_deep_dive.json")

# ---------------------------------------------------------------------------
# Bucket definitions
# ---------------------------------------------------------------------------
BUCKET_NAMES = {
    "RE":  "Renewable Energy Incentives",
    "FPD": "Fossil Fuel Phase-Down",
    "CPM": "Carbon Pricing & Markets",
    "EEF": "Energy Efficiency",
    "GRT": "Grid & Transport Decarbonisation",
    "LU":  "Land Use, Forests & Agriculture",
    "CF":  "Climate Finance & Governance",
}

# Primary mapping: topic -> bucket_id
TOPIC_BUCKET = {
    "Power & Electricity":              "RE",
    "Just & Clean Energy Transitions":  "RE",
    "Fuels & Energy Supply":            "FPD",
    "Methane Abatement":                "FPD",
    "Buildings":                        "EEF",
    "Industry":                         "EEF",
    "Transport":                        "GRT",
    "Critical Minerals":                "GRT",
    "Technology & Innovation":          "CF",
    # "Economy-wide" resolved via family below
}

# For topic == "Economy-wide", use family to distinguish CPM vs CF
ECONOMY_WIDE_FAMILY_BUCKET = {
    "Market & Economic Mechanisms": "CPM",
    "Financial Incentives":         "CPM",
    "Legislation & Planning":       "CF",
    "Regulations & Standards":      "CF",
    "Trade Policies":               "CF",
    "R&D & Knowledge":              "CF",
    "Information & Transparency":   "CF",
    "Supply Chain & Infrastructure":"CF",
}


def classify(topic: str, family: str) -> str:
    if topic in TOPIC_BUCKET:
        return TOPIC_BUCKET[topic]
    if topic == "Economy-wide":
        return ECONOMY_WIDE_FAMILY_BUCKET.get(family, "CF")
    return "CF"  # fallback


# ---------------------------------------------------------------------------
# Load reference data
# ---------------------------------------------------------------------------
with open(COUNTRIES_JSON) as f:
    countries_raw = json.load(f)

country_scores = {c["iso3"]: c["green_score"] for c in countries_raw if c["green_score"] is not None}
country_names  = {c["iso3"]: c["name"]        for c in countries_raw}

# Top 25% by GEPI score = "top performers"
sorted_scores = sorted(country_scores.values())
cutoff_idx    = int(len(sorted_scores) * 0.75)
cutoff        = sorted_scores[cutoff_idx]
top_iso3s     = {iso3 for iso3, score in country_scores.items() if score >= cutoff}

n_all = len(country_scores)
n_top = len(top_iso3s)
print(f"Countries with GEPI score: {n_all}")
print(f"Top 25% cutoff (GEPI >= {cutoff:.1f}): {n_top} countries")

# ---------------------------------------------------------------------------
# Process policies_clean.csv
# ---------------------------------------------------------------------------
policy_buckets = []

with open(POLICIES_CSV, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        iso3 = row["country_iso3"]
        if not iso3:
            continue

        # Only keep active policies
        is_active = row["is_active"].strip().lower() == "true"
        if not is_active:
            continue

        bucket_id = classify(row["topic"], row["family"])

        year_raw = row.get("year", "")
        try:
            start_year = int(float(year_raw)) if year_raw else None
        except ValueError:
            start_year = None

        policy_buckets.append({
            "iso3":        iso3,
            "country":     row["country_name"],
            "policy_name": row["title"],
            "start_year":  start_year,
            "bucket_id":   bucket_id,
            "bucket_name": BUCKET_NAMES[bucket_id],
            "status":      row["status"],
            "scope":       row["scope"],
        })

print(f"Active policies processed: {len(policy_buckets)}")

out_path = os.path.join(DATA_DIR, "policy_buckets.json")
with open(out_path, "w") as f:
    json.dump(policy_buckets, f)
print(f"Saved {out_path}  ({os.path.getsize(out_path)//1024} KB)")

# ---------------------------------------------------------------------------
# Lift scores
# ---------------------------------------------------------------------------
# Which buckets does each country have (active policies)?
country_buckets: dict[str, set] = defaultdict(set)
for pb in policy_buckets:
    country_buckets[pb["iso3"]].add(pb["bucket_id"])

lift_scores = []
for bucket_id, bucket_name in BUCKET_NAMES.items():
    all_with  = sum(1 for iso3 in country_scores if bucket_id in country_buckets.get(iso3, set()))
    top_with  = sum(1 for iso3 in top_iso3s      if bucket_id in country_buckets.get(iso3, set()))

    pct_all = all_with / n_all if n_all else 0
    pct_top = top_with / n_top if n_top else 0
    lift    = round(pct_top / pct_all, 2) if pct_all > 0 else 0.0

    lift_scores.append({
        "bucket_id":   bucket_id,
        "bucket_name": bucket_name,
        "lift":        lift,
        "pct_all":     round(pct_all, 4),
        "pct_top":     round(pct_top, 4),
    })
    print(f"  {bucket_id}: all={pct_all:.1%}  top={pct_top:.1%}  lift={lift}")

lift_scores.sort(key=lambda x: -x["lift"])

out_path = os.path.join(DATA_DIR, "lift_by_bucket.json")
with open(out_path, "w") as f:
    json.dump(lift_scores, f, indent=2)
print(f"Saved {out_path}")

# Top 3 → recommendations.json
top3 = [{"bucket_id": l["bucket_id"], "bucket_name": l["bucket_name"], "lift": l["lift"]}
        for l in lift_scores[:3]]
out_path = os.path.join(DATA_DIR, "recommendations.json")
with open(out_path, "w") as f:
    json.dump(top3, f, indent=2)
print(f"Saved {out_path}")

# ---------------------------------------------------------------------------
# overview_stats.json
# ---------------------------------------------------------------------------
with open(DEEP_DIVE_JSON) as f:
    deep_dive_raw = json.load(f)

# --- CO2/GDP % change over last 10 years ---
co2_gdp_changes = []
for entry in deep_dive_raw:
    iso3   = entry["iso3"]
    series = sorted(entry["series"], key=lambda s: s["year"])

    recent = [s for s in series if s.get("co2_per_gdp") is not None and s["year"] >= 2014]
    if len(recent) < 2:
        continue

    v_start = recent[0]["co2_per_gdp"]
    v_end   = recent[-1]["co2_per_gdp"]
    if not v_start or v_start == 0:
        continue

    pct = round((v_end - v_start) / v_start * 100, 2)
    co2_gdp_changes.append({
        "iso3":       iso3,
        "name":       country_names.get(iso3, iso3),
        "start_year": recent[0]["year"],
        "end_year":   recent[-1]["year"],
        "start_value":round(v_start, 2),
        "end_value":  round(v_end, 2),
        "pct_change": pct,
    })

co2_gdp_changes.sort(key=lambda x: x["pct_change"])  # most negative = most improved

# --- Policy count vs GEPI score scatter ---
policy_counts: dict[str, int] = defaultdict(int)
for pb in policy_buckets:
    policy_counts[pb["iso3"]] += 1

scatter_data = [
    {
        "iso3":         iso3,
        "name":         country_names.get(iso3, iso3),
        "gepi_score":   score,
        "policy_count": policy_counts.get(iso3, 0),
    }
    for iso3, score in country_scores.items()
]

# --- Policy mix of top performers ---
bucket_count_top: dict[str, int] = defaultdict(int)
for iso3 in top_iso3s:
    for bid in country_buckets.get(iso3, set()):
        bucket_count_top[bid] += 1

policy_mix_top = sorted(
    [
        {
            "bucket_id":   bid,
            "bucket_name": BUCKET_NAMES[bid],
            "count":       cnt,
            "pct":         round(cnt / n_top * 100, 1),
        }
        for bid, cnt in bucket_count_top.items()
    ],
    key=lambda x: -x["pct"],
)

overview = {
    "co2_gdp_changes":           co2_gdp_changes[:20],
    "scatter_data":              scatter_data,
    "policy_mix_top_performers": policy_mix_top,
}

out_path = os.path.join(DATA_DIR, "overview_stats.json")
with open(out_path, "w") as f:
    json.dump(overview, f, indent=2)
print(f"Saved {out_path}  ({os.path.getsize(out_path)//1024} KB)")

print("\nAll done.")
