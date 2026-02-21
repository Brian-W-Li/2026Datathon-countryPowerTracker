# 2026Datathon-countryPowerTracker
A renewable energy progress tracker for global countries with respect to the COP28 Agreement, with recommended steps for each country


A two-stage pipeline that separates data processing from application logic

## Data processing layer (Python)
We use python for all data ingestion, cleaning, and analysis

Responsibilities:
- Load raw datasets:
  * CO2 emissions per country
  * Policy datasets
- Preprocess data:
  * Select the latest emission value per country or the average recently
- Returns:

    data/
      countries.json              // country-level emissions + metadata
      policy_buckets.json        // policies grouped by country and bucket
      lift_by_bucket.json        // lift score per policy category
      recommendations.json       // recommended policy buckets top 3 maybe?

  Front end will use this data and display it
