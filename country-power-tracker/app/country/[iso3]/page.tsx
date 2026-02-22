import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import CountryDetail from "./CountryDetail";

type CountryEntry = {
  iso3: string;
  name: string;
  region: string;
  green_score: number | null;
  data_year: number;
};

type PolicyEntry = {
  iso3: string;
  country: string;
  policy_name: string;
  start_year: number | null;
  bucket_id: string;
  bucket_name: string;
  status: string;
  scope: string;
};

type DeepDiveEntry = {
  iso3: string;
  series: { year: number; co2_per_capita: number; co2_per_gdp: number }[];
};

type CleanEnergyEntry = {
  iso3: string;
  series: {
    year: number;
    clean_capacity_mw: number;
    total_capacity_mw: number;
    clean_share: number;
  }[];
};

function readJson<T>(filename: string): T {
  const filePath = path.join(process.cwd(), "public", "data", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ iso3: string }>;
}) {
  const { iso3 } = await params;
  const isoUpper = iso3.toUpperCase();

  const countries = readJson<CountryEntry[]>("countries.json");
  const country = countries.find((c) => c.iso3 === isoUpper);
  if (!country) notFound();

  const allPolicies = readJson<PolicyEntry[]>("policy_buckets.json");
  const policies = allPolicies.filter((p) => p.iso3 === isoUpper);

  const allDeepDive = readJson<DeepDiveEntry[]>("country_deep_dive.json");
  const deepDive = allDeepDive.find((d) => d.iso3 === isoUpper) ?? null;

  const allCleanEnergy = readJson<CleanEnergyEntry[]>("clean_energy.json");
  const cleanEnergy = allCleanEnergy.find((c) => c.iso3 === isoUpper) ?? null;

  return (
    <CountryDetail
      country={country}
      policies={policies}
      deepDive={deepDive}
      cleanEnergy={cleanEnergy}
    />
  );
}
