# 🌍 Country Power Tracker — Frontend

A dashboard for visualizing country-level climate policy data and recommendations.

All data is precomputed by a separate Python pipeline. The frontend only reads JSON.

---

## 📥 JSON Inputs

Place these files in `public/data/` before running the app.

---

### `countries.json`
One entry per country. Used to color the map and populate country cards.

```json
{
  "iso3": "USA",
  "name": "United States",
  "region": "North America",
  "green_score": 72.4,
  "data_year": 2022
}
```

---

### `policy_buckets.json`
One entry per policy. Each policy belongs to one sector (bucket). Used to show what policies a country has.

```json
{
  "iso3": "DEU",
  "country": "Germany",
  "policy_name": "Renewable Energy Act (EEG)",
  "start_year": 2000,
  "bucket_id": "RE",
  "bucket_name": "Renewable Energy Incentives",
  "instrument_type": "feed_in_tariff",
  "legally_binding": true,
  "has_quantified_target": false,
  "scope": "national"
}
```

**Bucket (sector) options:**

| `bucket_id` | `bucket_name` |
|---|---|
| `RE` | Renewable Energy Incentives |
| `FPD` | Fossil Fuel Phase-Down |
| `CPM` | Carbon Pricing & Markets |
| `EEF` | Energy Efficiency |
| `GRT` | Grid & Transport Decarbonisation |
| `LU` | Land Use, Forests & Agriculture |
| `CF` | Climate Finance & Governance |

**Attribute options:**

- `instrument_type`: `carbon_tax` · `cap_and_trade` · `subsidy` · `tax_credit` · `feed_in_tariff` · `mandate` · `ban` · `standard` · `voluntary_agreement` · `labeling` · `reporting` · `framework_legislation` · `other`
- `legally_binding`: `true` or `false`
- `has_quantified_target`: `true` or `false`
- `scope`: `national` · `international` · `state` · `provisional`

---

### `lift_by_bucket.json`
One entry per sector. Answers: which sectors do the top-performing countries tend to have?

Lift = % of top countries with this sector / % of all countries with this sector. A lift > 1 means the sector is more common among top performers.

```json
{
  "bucket_id": "CPM",
  "bucket_name": "Carbon Pricing & Markets",
  "lift": 1.84
}
```

---

### `recommendations.json`
The top 3 sectors globally — the sectors most associated with top-performing countries.

```json
[
  {
    "bucket_id": "CPM",
    "bucket_name": "Carbon Pricing & Markets",
    "lift": 1.84
  },
  {
    "bucket_id": "RE",
    "bucket_name": "Renewable Energy Incentives",
    "lift": 1.72
  },
  {
    "bucket_id": "FPD",
    "bucket_name": "Fossil Fuel Phase-Down",
    "lift": 1.45
  }
]
```

---

### `sparklines.json`
One entry per country. Used for the trend chart inside a country card.

```json
{
  "iso3": "CHN",
  "series": [
    { "year": 1990, "value": 2.1 },
    { "year": 2000, "value": 3.4 },
    { "year": 2021, "value": 7.4 }
  ]
}
```

---

## 📤 Frontend Views

| View | What it shows | Driven by |
|---|---|---|
| **World Map** | Countries colored by green score | `countries.json` |
| **Country Card** | Trend chart + policies grouped by sector | `sparklines.json` + `policy_buckets.json` |
| **Lift Chart** | Sectors ranked by lift score | `lift_by_bucket.json` |
| **Recommendations** | Top 3 global sectors | `recommendations.json` |

---

## 🛠️ Tech Stack

- **Frontend:** Next.js · TypeScript · D3.js · Recharts
- **Backend (separate):** Python · pandas · sentence-transformers
- **Deploy:** Vercel

---

## 🚀 Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Requires the 5 JSON files to be present in `public/data/`.
