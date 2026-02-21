# 🌍 Country Power Tracker

Frontend dashboard for visualizing country-level CO₂ emissions and policy-based recommendations.

---

## 📌 Overview

This frontend application consumes precomputed data to display:

- Country-level CO₂ emissions
- Policy categories (buckets) per country
- Policy effectiveness signals (lift scores)
- Recommended policy categories for each country

All data processing, aggregation, and analysis are performed in a separate backend pipeline (Python).

---

---

## 📥 Inputs (Required Data)

The frontend expects the following JSON files in:

`countries.json`
Country-level emissions and metadata

```json
{
  "iso3": "USA",
  "name": "United States",
  "co2_per_capita": 14.7,
  "data_year": 2022
}

`policy_buckets.json`

{
  "iso3": "DEU",
  "bucket_id": "RE",
  "bucket_name": "Renewable Energy Incentives"
}

`lift_by_bucket.json`
{
  "bucket_id": "CPM",
  "bucket_name": "Carbon Pricing & Markets",
  "lift": 1.84
}

`recommendations.json`
{
  "iso3": "IND",
  "recommendations": [
    {
      "bucket_id": "CPM",
      "bucket_name": "Carbon Pricing & Markets",
      "lift": 1.84
    }
  ]
}

Outputs (frontend)
Country dashboard: map of countries with CO2 emmissions per country
Policy buckets view: policy categories associated with each country
Lift insights: Visualization of lift scores per policy category
Recommenations: Top policy categories per country

Tech stack: Javascript frontend Python backend
